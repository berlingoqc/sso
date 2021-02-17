import {
  bind,
  /* inject, */ BindingScope,
  service,
  inject,
} from '@loopback/core';
import { MyUserService } from './user.service';
import { repository } from '@loopback/repository';
import {
  OrganisationInvitationRepository,
  UserRepository,
  UserCredentialsRepository,
  OrgUserLinkRepository,
} from '../repositories';
import { HttpErrors } from '@loopback/rest';
import { User, UserServiceError, throwError } from '../models';
import { EmailSenderService } from './email.service';
import { OTPBindings, PasswordHasherBindings } from '../key';
import { PasswordHasher } from './hash.password.bcryptjs';

const { hotp } = require('node-otp');
const uuidv1 = require('uuid/v1');

@bind({ scope: BindingScope.TRANSIENT })
export class InvitationService {
  constructor(
    @inject(OTPBindings.SECRET) private secret: string,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
    @service(MyUserService) public userService: MyUserService,
    @service(EmailSenderService) public emailService: EmailSenderService,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(OrgUserLinkRepository)
    public orgUserLinkRepo: OrgUserLinkRepository,
    @repository(OrganisationInvitationRepository)
    public orgInvitationRepo: OrganisationInvitationRepository,
    @repository(UserCredentialsRepository)
    public userCredRepo: UserCredentialsRepository,
  ) { }

  // Invite un usager dans une organisation, invite a rejoindre la plateforme s'il n'a pas de compte
  async inviteUserToOrganisation(
    email: string,
    organisationId: string,
  ): Promise<User> {
    // valide si l'user existe ou pas.
    const foundUser = await this.userService.getUser(email);
    if (foundUser) {
      // j'existe donc je lui envoie une invitation a rejoindre la plateforme
      return this.sendOrganisationInvitation(foundUser, organisationId);
    } else {
      const user = await this.inviteUser({
        email,
      });
      return this.sendOrganisationInvitation(user, organisationId);
    }
  }

  // Ajout une demande d'invitation au group a un usager existant
  async sendOrganisationInvitation(user: User, organisationId: string) {
    if (!user.id) {
      throwError(15, { msg: 'User dont have an id for the org invitation' });
    }
    await this.orgInvitationRepo.create({
      organisationId,
      response: 'pending',
      userId: user.id,
    });
    return user;
  }

  // Accept ou refuse la demande d'invitation
  async acceptOrganisationInvitation(invitationId: number, response: boolean) {
    const item = await this.orgInvitationRepo.findById(invitationId);
    // TODO: throw erreur si on n'a deja repondu
    item.response = response ? 'accepted' : 'denied';
    if (item.response === 'accepted') {
      await this.orgUserLinkRepo.create({
        organisationId: item.organisationId,
        userId: item.userId,
      });
      await this.orgInvitationRepo.delete(item);
    } else {
      await this.orgInvitationRepo.save(item);
    }
  }

  // Invite un user à rejoindre la plateforme , lui envoie un email de validation
  async inviteUser(newUser: Partial<User>): Promise<User> {
    newUser.id = uuidv1();
    newUser.extraFields = await this.userService.addDefaultExtraFieldsValue(
      newUser.extraFields ?? {},
    );
    try {
      const savedUser = await this.userRepository.create(newUser);
      const otp = hotp({ secret: this.secret });
      await this.userRepository.userCredentials(savedUser.id).create({
        password: undefined,
        id: uuidv1(),
        activationCode: otp,
      });

      savedUser.roles = await this.userService.createDefaultRole(savedUser);

      const url = `${this.emailService.redirect}?otp=${otp}&email=${savedUser.email}&action=validate`;

      await this.emailService.sendMailTemplate(
        savedUser.email,
        'INVITE_USER',
        {
          url,
        },
        {},
      );
      return savedUser;
    } catch (ex) {
      console.log(ex);
      throw ex;
    }
  }

  async acceptInvitationUser(
    email: string,
    otp: string,
    password: string,
  ): Promise<void> {
    const { credentialsFound } = await this.userService.getUserAndCredentail(
      email,
    );
    if (!credentialsFound) {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError.NO_CREDENTIALS, data: {} }),
      );
    }
    console.log(credentialsFound.activationCode);

    if (
      !credentialsFound.activationCode ||
      credentialsFound.activationCode === ''
    ) {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError.ALREADY_VALIDATE }),
      );
    } else {
      if (credentialsFound.activationCode === otp) {
        await this.userService.validatePassword(password);

        await this.userCredRepo.updateById(credentialsFound.id, {
          activationCode: '',
          password: await this.passwordHasher.hashPassword(password),
        });
      } else {
        throw new HttpErrors.Unauthorized(
          JSON.stringify({ code: UserServiceError.INVALID_PASSWORD }),
        );
      }
    }
  }
}
