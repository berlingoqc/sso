import {
  DefaultCrudRepository,
  repository,
  HasOneRepositoryFactory,
  HasManyRepositoryFactory,
} from '@loopback/repository';
import {
  User,
  UserRelations,
  UserCredentials,
  UserRoleMapping,
  OrganisationInvitation,
  OrgUserLink,
} from '../models';
import { PgsqlDataSource } from '../datasources';
import { inject, Getter } from '@loopback/core';
import { UserCredentialsRepository } from './usercredentials.repository';
import { UserRoleMappingRepository } from './user-role-mapping.repository';
import { OrganisationInvitationRepository } from './organisation-invitation.repository';
import { OrgUserLinkRepository } from './org-user-link.repository';

export type Credentials = {
  email: string;
  password: string;
};

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
  > {
  public readonly userCredentials: HasOneRepositoryFactory<
    UserCredentials,
    typeof User.prototype.id
  >;
  public readonly roleMappings: HasManyRepositoryFactory<
    UserRoleMapping,
    typeof User.prototype.id
  >;

  public readonly organisationInvitations: HasManyRepositoryFactory<
    OrganisationInvitation,
    typeof User.prototype.id
  >;

  public readonly orgUserLinks: HasManyRepositoryFactory<
    OrgUserLink,
    typeof User.prototype.id
  >;

  constructor(
    @inject('datasources.pgsql') dataSource: PgsqlDataSource,
    @repository.getter('UserCredentialsRepository')
    protected userCredentialsRepositoryGetter: Getter<
      UserCredentialsRepository
    >,
    @repository.getter('UserRoleMappingRepository')
    protected userRoleRepositoryGetter: Getter<UserRoleMappingRepository>,
    @repository.getter('OrganisationInvitationRepository')
    protected organisationInvitationRepositoryGetter: Getter<
      OrganisationInvitationRepository
    >,
    @repository.getter('OrgUserLinkRepository')
    protected orgUserLinkRepositoryGetter: Getter<OrgUserLinkRepository>,
  ) {
    super(User, dataSource);
    this.orgUserLinks = this.createHasManyRepositoryFactoryFor(
      'orgUserLinks',
      orgUserLinkRepositoryGetter,
    );
    this.registerInclusionResolver(
      'orgUserLinks',
      this.orgUserLinks.inclusionResolver,
    );
    this.organisationInvitations = this.createHasManyRepositoryFactoryFor(
      'organisationInvitations',
      organisationInvitationRepositoryGetter,
    );
    this.registerInclusionResolver(
      'organisationInvitations',
      this.organisationInvitations.inclusionResolver,
    );
    this.userCredentials = this.createHasOneRepositoryFactoryFor(
      'userCredentials',
      userCredentialsRepositoryGetter,
    );
    this.registerInclusionResolver('userCredentials', this.userCredentials.inclusionResolver);

    this.roleMappings = this.createHasManyRepositoryFactoryFor(
      'roles',
      userRoleRepositoryGetter,
    );
    this.registerInclusionResolver(
      'roles',
      this.roleMappings.inclusionResolver,
    );
  }
  async findCredentials(
    userId: typeof User.prototype.id,
  ): Promise<UserCredentials | undefined> {
    try {
      return await this.userCredentials(userId).get();
    } catch (err) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }
}
