import { Entity, model, property } from '@loopback/repository';

@model()
export class UserCredentials extends Entity {

  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
  })
  password: string;

  // clé a valider, quand vide compte activé
  @property()
  activationCode: string;

  @property()
  passwordResetCode: string;

  // mot de passe valide jusqu'a cette date
  @property()
  validUntil: number;

  @property({
    type: 'string',
    required: true
  })
  userId: string;

  constructor(data?: Partial<UserCredentials>) {
    super(data);
  }
}

export interface UserCredentialsRelations {
  // describe navigational properties here
}

export type UserCredentialsWithRelations = UserCredentials & UserCredentialsRelations;
