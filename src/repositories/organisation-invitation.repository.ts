import { DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import { PgsqlDataSource } from '../datasources';
import { inject, Getter} from '@loopback/core';
import { OrganisationInvitation, OrganisationInvitationRelations, Organisation, User} from '../models';
import {OrganisationRepository} from './organisation.repository';
import {UserRepository} from './user.repository';

export class OrganisationInvitationRepository extends DefaultCrudRepository<
  OrganisationInvitation,
  typeof OrganisationInvitation.prototype.id,
  OrganisationInvitationRelations
  > {

  public readonly organisation: BelongsToAccessor<Organisation, typeof OrganisationInvitation.prototype.id>;

  public readonly user: BelongsToAccessor<User, typeof OrganisationInvitation.prototype.id>;

  constructor(
    @inject('datasources.pgsql') dataSource: PgsqlDataSource, @repository.getter('OrganisationRepository') protected organisationRepositoryGetter: Getter<OrganisationRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(OrganisationInvitation, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
    this.organisation = this.createBelongsToAccessorFor('organisation', organisationRepositoryGetter,);
    this.registerInclusionResolver('organisation', this.organisation.inclusionResolver);
  }
}
