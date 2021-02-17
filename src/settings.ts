import {property, model} from '@loopback/repository';

@model()
export class SSOSettings {
  @property()
  publicCreation = true; // Allow the creation of account publicly
  @property()
  multiFactor = true; // Allow of multifactor authorization
  @property()
  accountValidation = true; // Send email or sms for account validation
  @property.array('string')
  defaultRoles: string[] = [];
}
