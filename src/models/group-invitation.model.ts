import {Entity, model} from '@loopback/repository';

@model()
export class GroupInvitation extends Entity {
  constructor(data?: Partial<GroupInvitation>) {
    super(data);
  }
}

export interface GroupInvitationRelations {
  // describe navigational properties here
}

export type GroupInvitationWithRelations = GroupInvitation &
  GroupInvitationRelations;
