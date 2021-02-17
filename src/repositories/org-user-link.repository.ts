import {
  DefaultCrudRepository,
  BelongsToAccessor,
  repository, HasManyRepositoryFactory} from '@loopback/repository';
import {OrgUserLink, OrgUserLinkRelations, User, Organisation, UserRoleMapping} from '../models';
import {PgsqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {UserRepository} from './user.repository';
import {OrganisationRepository} from './organisation.repository';
import {UserRoleMappingRepository} from './user-role-mapping.repository';

export class OrgUserLinkRepository extends DefaultCrudRepository<
  OrgUserLink,
  typeof OrgUserLink.prototype.id,
  OrgUserLinkRelations
> {
  public user: BelongsToAccessor<User, typeof OrgUserLink.prototype.id>;

  public readonly organisation: BelongsToAccessor<
    Organisation,
    typeof OrgUserLink.prototype.id
  >;

  public readonly userRoleMappings: HasManyRepositoryFactory<UserRoleMapping, typeof OrgUserLink.prototype.id>;

  constructor(
    @inject('datasources.pgsql') dataSource: PgsqlDataSource,
    @repository.getter('UserRepository') userRepoGetter: Getter<UserRepository>,
    @repository.getter('OrganisationRepository')
    protected organisationRepositoryGetter: Getter<OrganisationRepository>, @repository.getter('UserRoleMappingRepository') protected userRoleMappingRepositoryGetter: Getter<UserRoleMappingRepository>,
  ) {
    super(OrgUserLink, dataSource);
    this.userRoleMappings = this.createHasManyRepositoryFactoryFor('userRoleMappings', userRoleMappingRepositoryGetter,);
    this.registerInclusionResolver('userRoleMappings', this.userRoleMappings.inclusionResolver);
    this.organisation = this.createBelongsToAccessorFor(
      'organisation',
      organisationRepositoryGetter,
    );
    this.registerInclusionResolver(
      'organisation',
      this.organisation.inclusionResolver,
    );

    this.user = this.createBelongsToAccessorFor('user', userRepoGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
