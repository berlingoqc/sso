import {model, property, belongsTo, hasMany} from '@loopback/repository';
import {User} from './user.model';
import {OrgUserLink} from './org-user-link.model';
import {StaticRessource} from './ressource.model';
import {ExtraField} from './extra-field.model';

@model()
export class Organisation extends StaticRessource {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
  })
  type: string;

  @property()
  extraFields: ExtraField;

  @belongsTo(() => User, {name: 'manager'})
  managerId?: string;

  @hasMany(() => OrgUserLink)
  users: OrgUserLink[];

  constructor(data?: Partial<Organisation>) {
    super(data);
  }
}

export interface OrganisationRelations {
  // describe navigational properties here
  manager?: User;
}

export type OrganisationWithRelations = Organisation & OrganisationRelations;
