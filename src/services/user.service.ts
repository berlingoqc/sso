import { UserService } from '@loopback/authentication';
import { inject } from '@loopback/context';
import { service } from '@loopback/core';
import { repository } from '@loopback/repository';
import { HttpErrors } from '@loopback/rest';
import { securityId, UserProfile } from '@loopback/security';
import _ from 'lodash';
import { OTPBindings, PasswordHasherBindings, SSOBindings } from '../key';
import { UserCredentials, UserRoleMapping } from '../models';
import {
  NewUserRequest,
  PasswordConfig,
  PasswordResetRequest,
  throwError,
  UpdatePassword,
  User,
  UserServiceError,
} from '../models/user.model';
import {
  EmailTemplateRepository,
  UserCredentialsRepository,
  ExtraFieldRepository,
} from '../repositories';
import { Credentials, UserRepository } from '../repositories/user.repository';
import { SSOSettings } from '../settings';
import { AuthFactorSender } from './auth-factor/ifactor.service';
import { EmailSenderService } from './email.service';
import { PasswordHasher } from './hash.password.bcryptjs';
import { RoleService } from './role.service';

const { hotp } = require('node-otp');
const uuidv1 = require('uuid/v1');

export class MyUserService implements UserService<User, Credentials> {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(EmailTemplateRepository)
    public emailTemplateRepository: EmailTemplateRepository,
    @inject(SSOBindings.SETTINGS) private settings: SSOSettings,
    @inject(OTPBindings.SECRET) private secret: string,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
    @inject(PasswordHasherBindings.PASSWORD_CONFIG)
    public passwordConfig: PasswordConfig,
    @service(EmailSenderService)
    public emailService: EmailSenderService,
    @service(AuthFactorSender)
    public authFactorService: AuthFactorSender,
    @repository(UserCredentialsRepository)
    public userCredRepo: UserCredentialsRepository,
    @repository(ExtraFieldRepository)
    public extraFieldRepo: ExtraFieldRepository,
    @service(RoleService)
    public roleService: RoleService,
  ) { }

  async verifyCredentials(credentials: Credentials): Promise<User> {
    const { foundUser, credentialsFound } = await this.getUserAndCredentail(
      credentials.email,
    );

    const passwordMatched = await this.passwordHasher.comparePassword(
      credentials.password,
      credentialsFound.password,
    );

    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError.INVALID_PASSWORD, data: {} }),
      );
    }

    if (
      credentialsFound.activationCode &&
      credentialsFound.activationCode !== ''
    ) {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError.NOT_VALIDATE_EMAIL }),
      );
    }

    if (
      foundUser.validUntil &&
      foundUser.validUntil !== 0 &&
      foundUser.validUntil * 1000 <= Date.now()
    ) {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError.EXPIRED_ACCOUNT }),
      );
    }

    if (foundUser.blocked) {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError.BLOCKED_ACCOUNT }),
      );
    }

    return foundUser;
  }

  async createDefaultRole(user: User): Promise<UserRoleMapping[]> {
    if (this.settings.defaultRoles && this.settings.defaultRoles.length > 0) {
      const ret = [];
      for (const r of this.settings.defaultRoles) {
        const rm = new UserRoleMapping();
        rm.role = r;
        rm.userId = user.id;
        ret.push(await this.userRepository.roleMappings(user.id).create(rm));
      }
      return ret;
    }
    return [];
  }

  async createAdmin(newUserRequest: NewUserRequest): Promise<User> {
    await this.validatePassword(newUserRequest.password);

    const password = await this.passwordHasher.hashPassword(newUserRequest.password);
    newUserRequest.id = uuidv1();
    try {
      const savedUser = await this.userRepository.create(
        _.omit(newUserRequest, 'password'),
      );
      console.log(savedUser);

      await this.userRepository.userCredentials(savedUser.id).create({
        password,
        id: uuidv1(),
      });
      await this.roleService.addRoleToUser(savedUser.id, 'ADMIN');
      return savedUser;
    } catch (error) {
      throw error;
    }

  }

  async createUser(newUserRequest: NewUserRequest): Promise<User> {
    console.log('You are here , we are there ', newUserRequest);
    await this.validatePassword(newUserRequest.password);

    // encrypt the password
    const password = await this.passwordHasher.hashPassword(
      newUserRequest.password,
    );

    newUserRequest.id = uuidv1();
    newUserRequest.extraFields = await this.addDefaultExtraFieldsValue(
      newUserRequest.extraFields,
    );
    try {
      const savedUser = await this.userRepository.create(
        _.omit(newUserRequest, 'password'),
      );
      console.log(savedUser);

      const otp = hotp({ secret: this.secret });
      await this.userRepository.userCredentials(savedUser.id).create({
        password,
        id: uuidv1(),
        activationCode: otp,
      });

      const url =
        this.emailService.redirect +
        '?otp=' +
        otp +
        '&email=' +
        newUserRequest.email +
        '&action=confirm';

      const ret = await this.emailService.sendMailTemplate(
        savedUser.email,
        'CONFIRM_ACOUNT',
        {
          url,
        },
      );

      console.log('EMAIL SEND', ret);
      return savedUser;
    } catch (error) {
      console.log('ERROR CREATING USER ', error);
      throw error;
    }
  }

  async addDefaultExtraFieldsValue(extraFields: {
    [id: string]: unknown;
  }): Promise<{ [id: string]: unknown }> {
    const fields: any = {};
    const extras = await this.extraFieldRepo.find();
    extras.forEach((extraField) => {
      if (!extraFields[extraField.name]) {
        fields[extraField.name] = extraField.defaultValue;
      } else {
        fields[extraField.name] = extraFields[extraField.name];
      }
    });
    return fields;
  }

  async validatePassword(password: string) {
    if (password.length > this.passwordConfig.max) {
      throwError(UserServiceError.INVALID_PASSWORD_FORMAT, {
        error: 'Dépasse taille maximal de ' + this.passwordConfig.max,
      });
    }
    if (password.length < this.passwordConfig.min) {
      throwError(UserServiceError.INVALID_PASSWORD_FORMAT, {
        error: 'Sous la taille minimal de ' + this.passwordConfig.min,
      });
    }
    if (this.passwordConfig.upperLetter && !password.match(/[A-Z\s]+/)) {
      throwError(UserServiceError.INVALID_PASSWORD_FORMAT, {
        error: 'Pas de majuscule',
      });
    }
    if (this.passwordConfig.upperLetter && !password.match(/[a-z\s]+/)) {
      throwError(UserServiceError.INVALID_PASSWORD_FORMAT, {
        error: 'Pas de minuscule',
      });
    }

    if (
      this.passwordConfig.symbol &&
      !password.match(/[!@#$%^&*(),.?":{}|<>]/g)
    ) {
      throwError(UserServiceError.INVALID_PASSWORD_FORMAT, {
        error: 'Pas de symbole',
      });
    }
  }

  async passwordReset(reset: PasswordResetRequest): Promise<void> {
    const { credentialsFound } = await this.getUserAndCredentail(reset.email);
    const otp = hotp({ secret: this.secret });
    await this.userCredRepo.updateById(credentialsFound.id, {
      passwordResetCode: otp,
    });
    await this.authFactorService.sendFactorMessage(
      reset.factor,
      reset.email,
      otp,
    );
  }

  async validPasswordReset(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<void> {
    const profile = await this.userRepository.findOne({ where: { email } });
    if (!profile) {
      throw new Error();
    }
    const d = await this.userCredRepo.findOne({
      where: {
        and: [
          {
            passwordResetCode: otp,
          },
          {
            userId: profile.id,
          },
        ],
      },
    });
    if (!d) {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError.INVALID_PASSWORD, data: {} }),
      );
    }

    await this.validatePassword(newPassword);

    d.passwordResetCode = '';
    d.password = await this.passwordHasher.hashPassword(newPassword);

    await this.userCredRepo.update(d);
  }

  async validActivationCode(email: string, otp: string) {
    const { credentialsFound } = await this.getUserAndCredentail(email);
    if (!credentialsFound || !email) {
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
        await this.userCredRepo.updateById(credentialsFound.id, {
          activationCode: '',
        });
      } else {
        throw new HttpErrors.Unauthorized(
          JSON.stringify({
            code: UserServiceError.INVALID_PASSWORD,
            data: 'Code OTP invalide',
          }),
        );
      }
    }
  }

  async setPhoneFactor(userProfil: User, phone: string): Promise<void> {
    if (userProfil) {
      userProfil.phone = phone;
      userProfil.phoneActivationCode = hotp({ secret: this.secret });

      await this.userRepository.update(userProfil);

      await this.authFactorService.factors['textsms'].sendFactorMessage(
        userProfil.email,
        userProfil.phoneActivationCode,
      );
    } else {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError, data: {} }),
      );
    }
  }

  async updatePassword(
    profil: UserProfile,
    update: UpdatePassword,
  ): Promise<void> {
    const credentialsFound = await this.userRepository.findCredentials(
      profil.id,
    );
    if (!credentialsFound) {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError.NO_CREDENTIALS, data: {} }),
      );
    }

    const passwordMatched = await this.passwordHasher.comparePassword(
      update.old,
      credentialsFound.password,
    );
    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError.INVALID_PASSWORD, data: {} }),
      );
    }
    await this.validatePassword(update.new);

    const newPasswordHash = await this.passwordHasher.hashPassword(update.new);

    return this.userCredRepo.updateById(credentialsFound.id, {
      password: newPasswordHash,
    });
  }


  async getUser(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email }
    });
  }

  async getUserAndCredentail(
    email: string,
  ): Promise<{ foundUser: User; credentialsFound: UserCredentials }> {
    const foundUser = await this.getUser(email);
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError.INVALID_EMAIL, data: {} }),
      );
    }

    const credentialsFound = await this.userRepository.findCredentials(
      foundUser.id,
    );
    if (!credentialsFound) {
      throw new HttpErrors.Unauthorized(
        JSON.stringify({ code: UserServiceError.NO_CREDENTIALS, data: {} }),
      );
    }

    return { foundUser, credentialsFound };
  }

  convertToUserProfile(user: User): UserProfile {
    // since first name and lastName are optional, no error is thrown if not provided
    let userName = '';
    if (user.firstName) userName = `${user.firstName}`;
    if (user.lastName)
      userName = user.firstName
        ? `${userName} ${user.lastName}`
        : `${user.lastName}`;
    return { [securityId]: user.id, name: userName, id: user.id };
  }
}
