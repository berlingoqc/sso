import {bind, BindingScope, service} from '@loopback/core';
import {Count, repository, Filter} from '@loopback/repository';
import {UserProfile} from '@loopback/security';
import {User, Organisation, Role, UserServiceError} from '../models';
import {OrganisationRepository, RoleRepository} from '../repositories';
import {InvitationService} from './invitation.service';
import {MyUserService} from './user.service';
import {HttpErrors} from '@loopback/rest';
import {OrgUserLinkRepository} from '../repositories/org-user-link.repository';

const {v1: uuidv1} = require('uuid');

@bind({scope: BindingScope.TRANSIENT})
export class OrganisationService {
  constructor(
    @repository(RoleRepository)
    public roleRepository: RoleRepository,
    @repository(OrgUserLinkRepository)
    public orgUserLinkRepo: OrgUserLinkRepository,
    @repository(OrganisationRepository)
    public organisationRepository: OrganisationRepository,
    @service(InvitationService)
    public invitationService: InvitationService,
    @service(MyUserService)
    public userService: MyUserService,
  ) {}

  async createOrganisation(organisation: Organisation): Promise<Organisation> {
    organisation.id = uuidv1();
    if (organisation.managerId) {
      organisation = await this.organisationRepository.create(organisation);

      const user = await this.invitationService.inviteUserToOrganisation(
        organisation.managerId as string,
        organisation.id,
      );

      organisation.managerId = user.id;
      return this.organisationRepository.save(organisation);
    } else {
      throw new Error('no manager id set');
    }
  }

  // Retourne la liste des rôles disponibles pour une organisation donné
  async getAvailableRole(orgId: string): Promise<Role[]> {
    const org = await this.organisationRepository.findById(orgId);
    return this.roleRepository.find({
      where: {
        or: [
          {
            orgId: org.id,
          },
          {
            orgType: org.type,
          },
        ],
      },
    });
  }

  async getUsersCount(orgId: string, where?: any): Promise<Count> {
    return this.orgUserLinkRepo.count({
      organisationId: orgId,
    });
  }

  async getUsers(
    currentUserProfile: UserProfile,
    orgId: string,
    filter?: Filter<User>,
  ): Promise<User[]> {
    const data = await this.organisationRepository.findOne({
      where: {
        id: orgId,
        managerId: currentUserProfile.id,
      },
      include: [
        {
          relation: 'users',
          scope: {
            limit: filter?.limit,
            offset: filter?.offset,
            skip: filter?.skip,
            order: filter?.order,
            include: [
              {
                relation: 'user',
                scope: {
                  include: [
                    {
                      relation: 'userCredentials',
                    },
                  ],
                },
              },
              {
                relation: 'userRoleMappings',
              },
            ],
          },
        },
      ],
    });
    if (data) {
      return data.users.map((userLink) => {
        const user = userLink.user as User;
        user.roles = userLink.userRoleMappings;
        return user;
      });
    }
    throw new HttpErrors.Unauthorized(
      JSON.stringify({code: UserServiceError.NOT_MANAGER}),
    );
  }
}
