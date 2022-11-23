import {Entity, model, property, hasOne, hasMany} from '@loopback/repository';
import {UserCredentials} from './usercredentials.model';
import {UserRoleMapping} from './user-role-mapping.model';
import {OrgUserLink} from './org-user-link.model';
import {UserProfile} from '@loopback/security';
import {OrganisationInvitation} from './organisation-invitation.model';
import {HttpErrors} from '@loopback/rest';

@model({
  settings: {
    indexes: {
      uniqueEmail: {
        keys: {
          email: 1,
        },
        options: {
          unique: true,
        },
      },
    },
  },
})
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: false,
    default: 'user',
  })
  type: string;

  @hasMany(() => OrgUserLink)
  organisations?: OrgUserLink[];

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
  })
  thumbnail?: string;

  @property({
    type: 'string',
  })
  phone: string;

  @property({
    type: 'string',
  })
  phoneActivationCode: string;

  @property({
    type: 'string',
  })
  firstName?: string;

  @property({
    type: 'string',
  })
  lastName?: string;

  @property({
    type: 'boolean',
    required: false,
    jsonSchema: {nullable: true},
  })
  blocked: boolean;

  // compte valide jusqu'a cette date
  @property({required: false, jsonSchema: {nullable: true}})
  validUntil?: number;

  @hasOne(() => UserCredentials)
  userCredentials: UserCredentials;

  @property()
  extraFields: {
    [id: string]: unknown;
  };

  @hasMany(() => OrganisationInvitation)
  organisationInvitations: OrganisationInvitation[];

  @hasMany(() => OrgUserLink)
  orgUserLinks: OrgUserLink[];
  @hasMany(() => UserRoleMapping)
  roles: UserRoleMapping[];

  constructor(data?: Partial<User>) {
    super(data);
  }

  toUserProfile(profile: UserProfile = {} as any): UserProfile {
    profile.email = this.email;
    profile.name = (this?.firstName ?? '') + ' ' + (this?.lastName ?? '');
    profile.lastname = this.lastName;
    profile.firstname = this.firstName;
    profile.telephone = this.phone;
    profile.thumbnail = this.thumbnail;
    profile.extraFields = this.extraFields;
    profile.organisations = (this.orgUserLinks ?? []).map(
      (x) => x.organisation,
    );
    return profile;
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;

@model()
export class Error<T> {
  code: number;
  data?: T;
}

export enum UserServiceError {
  INVALID_EMAIL = 0,
  INVALID_PASSWORD = 1,
  NO_CREDENTIALS = 2,
  NOT_VALIDATE_EMAIL = 3,
  ALREADY_VALIDATE = 4,
  BLOCKED_ACCOUNT = 5,
  EXPIRED_ACCOUNT = 6,
  EXPIRED_PASSWORD = 7,

  EMAIL_ALREADY_PRESENT = 8,
  ORGANISATION_DONT_EXIST = 9,
  USER_ALREADY_ORGANISATION = 10,

  INVALID_PASSWORD_FORMAT = 11,

  NOT_MANAGER = 12,
}

export function throwError(error: number, data = {}) {
  throw new HttpErrors.Unauthorized(JSON.stringify({code: error, data: data}));
}

@model()
export class PasswordConfig {
  @property()
  min: number;
  @property()
  max: number;
  @property()
  upperLetter: boolean;
  @property()
  symbol: boolean;
}

@model()
export class UpdatePassword {
  @property()
  old: string;
  @property()
  new: string;
}

@model()
export class NewUserRequest extends User {
  @property({
    type: 'string',
    required: true,
  })
  password: string;
}

@model()
export class PasswordResetRequest {
  @property()
  email: string;
  @property()
  factor: string;
  @property()
  data: string;
}

@model()
export class PasswordResetConfirmationRequest {
  @property()
  otp: string;
  @property()
  new: string;
  @property()
  email: string;
}

@model()
export class AcceptedInvitation {
  @property()
  email: string;
  @property()
  otp: string;
  @property()
  password: string;
  @property()
  contract: boolean;
}
