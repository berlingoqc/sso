import { DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory } from '@loopback/repository';
import { Organisation, OrganisationRelations, User, OrgUserLink } from '../models';
import { PgsqlDataSource } from '../datasources';
import { inject, Getter } from '@loopback/core';
import { UserRepository } from './user.repository';
import { OrgUserLinkRepository } from './org-user-link.repository';

export class OrganisationRepository extends DefaultCrudRepository<
  Organisation,
  typeof Organisation.prototype.id,
  OrganisationRelations
  > {


  public readonly manager: BelongsToAccessor<User, typeof Organisation.prototype.id>;
  public readonly users: HasManyRepositoryFactory<OrgUserLink, typeof OrgUserLink.prototype.id>;

  constructor(
    @inject('datasources.pgsql') dataSource: PgsqlDataSource,
    @repository.getter('UserRepository') userRepoGetter: Getter<UserRepository>,
    @repository.getter('OrgUserLinkRepository') userLinkRepoGetter: Getter<OrgUserLinkRepository>,
  ) {
    super(Organisation, dataSource);

    this.manager = this.createBelongsToAccessorFor('manager', userRepoGetter);
    this.registerInclusionResolver('manager', this.manager.inclusionResolver);

    this.users = this.createHasManyRepositoryFactoryFor('users', userLinkRepoGetter);
    this.registerInclusionResolver('users', this.users.inclusionResolver);
  }
}
