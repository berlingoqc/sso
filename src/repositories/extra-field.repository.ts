import {DefaultCrudRepository} from '@loopback/repository';
import {ExtraField, ExtraFieldRelations} from '../models';
import {PgsqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class ExtraFieldRepository extends DefaultCrudRepository<
  ExtraField,
  typeof ExtraField.prototype.id,
  ExtraFieldRelations
> {
  constructor(
    @inject('datasources.pgsql') dataSource: PgsqlDataSource,
  ) {
    super(ExtraField, dataSource);
  }
}
