import {DefaultCrudRepository} from '@loopback/repository';
import {EmailTemplate, EmailTemplateRelations} from '../models';
import {PgsqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class EmailTemplateRepository extends DefaultCrudRepository<
  EmailTemplate,
  typeof EmailTemplate.prototype.key,
  EmailTemplateRelations
> {
  constructor(
    @inject('datasources.pgsql') dataSource: PgsqlDataSource,
  ) {
    super(EmailTemplate, dataSource);
  }
}
