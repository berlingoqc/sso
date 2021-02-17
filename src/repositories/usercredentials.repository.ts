import { DefaultCrudRepository } from '@loopback/repository';
import { UserCredentials, UserCredentialsRelations } from '../models';
import { PgsqlDataSource } from '../datasources';
import { inject } from '@loopback/core';

export class UserCredentialsRepository extends DefaultCrudRepository<
  UserCredentials,
  typeof UserCredentials.prototype.id,
  UserCredentialsRelations
  > {
  constructor(
    @inject('datasources.pgsql') dataSource: PgsqlDataSource,
  ) {
    super(UserCredentials, dataSource);
  }
}
