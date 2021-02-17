import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Organisation} from './organisation.model';
import {User} from './user.model';

@model()
export class OrganisationInvitation extends Entity {
  @property({
    id: true,
    generated: true,
  })
  id: number;

  @belongsTo(() => Organisation)
  organisationId: string;

  @belongsTo(() => User)
  userId: string;

  @property()
  response: string;

  constructor(data?: Partial<OrganisationInvitation>) {
    super(data);
  }
}

export interface OrganisationInvitationRelations {
  // describe navigational properties here
}

export type OrganisationInvitationWithRelations = OrganisationInvitation &
  OrganisationInvitationRelations;
