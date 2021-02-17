import { Entity, model, property } from '@loopback/repository';

@model()
export class Role extends Entity {

  @property({
    id: true,
    generated: true
  })
  id: number;

  @property()
  name: string;

  @property()
  description: string;

  // Role qui est crée pour un type d'organisation , peut être utilisé par n'importe qu'elle
  // organisation qui est de ce type
  @property()
  orgType?: string;

  // Role qui est crée spécifiquement pour une organisation, peut seulement être utilisé dans cette
  // organisation
  @property()
  orgId?: string;

  constructor(data?: Partial<Role>) {
    super(data);
  }
}

export interface RoleRelations {
  // describe navigational properties here
}

export type RoleWithRelations = Role & RoleRelations;
