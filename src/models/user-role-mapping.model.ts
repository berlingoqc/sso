import { model, property, Entity } from '@loopback/repository';

@model()
export class UserRoleMapping extends Entity {
  @property({
    id: true,
    generated: true
  })
  id: number;

  @property()
  userId: string;

  @property()
  orgUserLinkId: number;

  @property()
  role: string;

  constructor(data?: Partial<UserRoleMapping>) {
    super(data);
  }
}

export interface UserRoleMappingRelations {
  // describe navigational properties here
}

export type UserRoleMappingWithRelations = UserRoleMapping & UserRoleMappingRelations;
