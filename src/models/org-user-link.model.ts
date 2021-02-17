import {Entity, model, property, belongsTo, hasMany} from '@loopback/repository';
import {User} from './user.model';
import {Organisation} from './organisation.model';
import {UserRoleMapping} from './user-role-mapping.model';

@model()
export class OrgUserLink extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @belongsTo(() => User, {name: 'user'})
  userId: string;

  @belongsTo(() => Organisation)
  organisationId: string;

  user?: User;
  organisation?: Organisation;

  @hasMany(() => UserRoleMapping)
  userRoleMappings: UserRoleMapping[];

  constructor(data?: Partial<OrgUserLink>) {
    super(data);
  }
}

export interface OrgUserLinkRelations {
  // describe navigational properties here
}

export type OrgUserLinkWithRelations = OrgUserLink & OrgUserLinkRelations;
