import {DefaultCrudRepository} from '@loopback/repository';
import {UserRoleMapping, UserRoleMappingRelations} from '../models';
import {PgsqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class UserRoleMappingRepository extends DefaultCrudRepository<
  UserRoleMapping,
  typeof UserRoleMapping.prototype.id,
  UserRoleMappingRelations
> {
  constructor(
    @inject('datasources.pgsql') dataSource: PgsqlDataSource,
  ) {
    super(UserRoleMapping, dataSource);
  }
}
