import {authenticate, TokenService} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Filter, Where, repository, Count} from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {OPERATION_SECURITY_SPEC} from '@berlingoqc/lb-extensions';
import _ from 'lodash';
import {
  PasswordHasherBindings,
  TokenServiceBindings,
  UserServiceBindings,
} from '../key';
import {
  NewUserRequest,
  PasswordResetConfirmationRequest,
  PasswordResetRequest,
  User,
  UserServiceError,
  UpdatePassword,
} from '../models';
import {
  Credentials,
  OrganisationRepository,
  UserRepository,
} from '../repositories';
import {PasswordHasher} from '../services';
import {EmailSenderService} from '../services/email.service';
import {MyMyUserService, MyUserService} from '../services/user.service';
import {CountSchema} from '@loopback/repository/dist/common-types';
import {getWhereSchemaFor} from '@loopback/openapi-v3/dist/filter-schema';

export const UserProfileSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {type: 'string'},
    email: {type: 'string'},
    telephone: {type: 'string'},
    name: {type: 'string'},
    firstname: {type: 'string'},
    lastname: {type: 'string'},
  },
};
const CredentialsSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};

export class UserController {
  constructor(
    @repository(OrganisationRepository) orgRepo: OrganisationRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public myUserService: MyMyUserService,
    @service(MyUserService)
    private userService: MyUserService,
    @service(EmailSenderService)
    public emailService: EmailSenderService,
  ) {}

  @post('/users', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NewUserRequest, {title: 'NewUserRequest'}),
        },
      },
    })
    newUserRequest: NewUserRequest,
  ): Promise<User> {
    try {
      return await this.userService.createUser(newUserRequest);
    } catch (ex) {
      if (ex.detail.includes('already exists')) {
        throw new HttpErrors.BadRequest(
          JSON.stringify({code: UserServiceError.EMAIL_ALREADY_PRESENT}),
        );
      }
      throw ex;
    }
  }

  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              property: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody() credentials: Credentials,
  ): Promise<{token: string}> {
    const user = await this.myUserService.verifyCredentials(credentials);
    const userProfile = this.myUserService.convertToUserProfile(user);
    const token = await this.jwtService.generateToken(userProfile as any);

    return {token};
  }

  @patch('/users/me')
  @authenticate('jwt')
  async updateMe(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            partial: true,
          }),
        },
      },
    })
    user: User,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<UserProfile> {
    await this.userRepository.updateById(currentUserProfile.id, user);
    return new User(user).toUserProfile();
  }

  @get('/users/me', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: UserProfileSchema,
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async me(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<UserProfile> {
    currentUserProfile.id = currentUserProfile[securityId];
    const user = await this.userRepository.findById(currentUserProfile.id, {
      include: [
        {
          relation: 'roles',
        },
        {
          relation: 'orgUserLinks',
          scope: {
            include: [
              {
                relation: 'organisation',
              },
            ],
          },
        },
      ],
    });
    delete (currentUserProfile as any)[securityId];
    currentUserProfile = user.toUserProfile(currentUserProfile);
    return currentUserProfile;
  }

  @patch('/users/credentials/reset')
  async resetCred(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PasswordResetRequest, {
            title: 'PasswordReset',
          }),
        },
      },
    })
    reset: PasswordResetRequest,
  ) {
    await this.userService.passwordReset(reset);
  }

  @patch('/users/credentials/otp')
  async validOTP(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PasswordResetConfirmationRequest, {
            title: 'PasswordResetConfirmation',
          }),
        },
      },
    })
    request: PasswordResetConfirmationRequest,
  ): Promise<void> {
    return this.userService.validPasswordReset(
      request.email,
      request.otp,
      request.new,
    );
  }

  @patch('/users/factor/sms')
  async setSMSAuthFactor() {}

  @patch('/users/me/credentials', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'PATCH Password',
      },
    },
  })
  @authenticate('jwt')
  async postMeCredentials(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UpdatePassword),
        },
      },
    })
    update: UpdatePassword,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<void> {
    await this.userService.updatePassword(currentUserProfile, update);
  }

  @get('/users/refresh')
  @authenticate('jwt')
  async refreshToken(
    @inject(SecurityBindings.USER)
    currentUserProfil: UserProfile,
  ): Promise<object> {
    const token = await this.jwtService.generateToken(currentUserProfil);
    return {token};
  }

  @get('/users/credentials/validate', {
    responses: {},
  })
  async validateAccount(
    @param.query.string('email') id: string,
    @param.query.string('otp') otp: string,
  ): Promise<object> {
    await this.userService.validActivationCode(id, otp);
    return {msg: 'ok'};
  }

  @del('/users/me', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Your account DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteMe(
    @inject(SecurityBindings.USER)
    currentUserProfil: UserProfile,
  ): Promise<void> {
    return this.userRepository.deleteById(currentUserProfil[securityId]);
  }

  // SECTION POUR ADMIN
  @get('/users/count', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'User model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(User)) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.count(where);
  }

  @get('/users', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of EntryTicket model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: UserProfileSchema,
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async find(
    @param.query.object('filter') filter?: Filter<User>,
  ): Promise<User[]> {
    return (
      await this.userRepository.find({
        where: filter?.where,
        limit: filter?.limit,
        offset: filter?.offset,
        skip: filter?.skip,
        order: filter?.order,
        include: [
          {
            relation: 'roles',
            scope: {
              fields: {},
            },
          },
          {
            relation: 'userCredentials',
            scope: {
              //fields: {
              // id: true,
              // activationCode: true
              //}
            },
          },
        ],
      })
    ).map((profil) => {
      return profil;
    });
  }

  @get('/users/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Country model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async findById(
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(User))
    filter?: Filter<User>,
  ): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  @patch('/users/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Country PATCH success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            partial: true,
            includeRelations: true,
          }),
        },
      },
    })
    country: User,
  ): Promise<void> {
    country.id = id;
    const originalRole = await this.userRepository.roleMappings(id).find();
    if (country.roles) {
      const newRole = country.roles.filter(
        (role) => originalRole.findIndex((r2) => role.role === r2.role) === -1,
      );
      const deleteRole = originalRole.filter(
        (role) => country.roles.findIndex((r2) => role.role === r2.role) === -1,
      );
      console.log('NEW ROLE', newRole);
      console.log('DELTE ROLE', deleteRole);
      for (const x of newRole) {
        await this.userRepository.roleMappings(id).create({
          role: x.role,
        });
      }
      for (const x of deleteRole) {
        await this.userRepository.roleMappings(id).delete({role: x.role});
      }
    }
    const ret = await this.userRepository.update(
      new User(_.omit(country, 'roles')),
    );
    console.log(ret);
  }

  @del('/users/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Country DELETE success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.userRepository.deleteById(id);
  }
}
