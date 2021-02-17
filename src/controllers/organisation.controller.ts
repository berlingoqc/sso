import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {OPERATION_SECURITY_SPEC} from '@berlingoqc/lb-extensions';
import {Organisation, OrgUserLink, User, Role} from '../models';
import {OrganisationRepository, OrgUserLinkRepository} from '../repositories';
import {OrganisationService} from '../services/organisation.service';
const uuidv1 = require('uuid/v1');

export class OrganisationController {
  constructor(
    @service(OrganisationService)
    public orgService: OrganisationService,
    @repository(OrganisationRepository)
    public organisationRepository: OrganisationRepository,
    @repository(OrgUserLinkRepository)
    public orgUserLinkRepo: OrgUserLinkRepository,
  ) {}

  @post('/organisations', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Organisation model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(Organisation)},
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Organisation, {
            title: 'NewOrganisation',
            exclude: ['id'],
          }),
        },
      },
    })
    organisation: Organisation,
  ): Promise<Organisation> {
    organisation.id = uuidv1();
    return this.organisationRepository.create(organisation);
  }

  @get('/organisations', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Organisation model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Organisation, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN', 'ORG_USER_MANAGER'],
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(Organisation))
    filter?: Filter<Organisation>,
  ): Promise<Organisation[]> {
    return this.organisationRepository.find(filter);
  }

  @patch('/organisations', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Organisation PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Organisation, {partial: true}),
        },
      },
    })
    organisation: Organisation,
    @param.query.object('where', getWhereSchemaFor(Organisation))
    where?: Where<Organisation>,
  ): Promise<Count> {
    return this.organisationRepository.updateAll(organisation, where);
  }

  @get('/organisations/{id}/user/count', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'User model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ORG_USER_MANAGER', 'ADMIN'],
  })
  async count(
    @param.path.string('id') orgId: string,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    @param.query.object('where', getWhereSchemaFor(User)) where?: Where<User>,
  ): Promise<Count> {
    return this.orgService.getUsersCount(orgId, where);
  }

  @get('/organisations/{id}/user', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: '',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(User),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ORG_USER_MANAGER', 'ADMIN'],
  })
  async getOrgUser(
    @param.path.string('id') orgId: string,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    @param.query.object('filter', getFilterSchemaFor(User))
    filter?: Filter<User>,
  ): Promise<User[]> {
    // TODO valider qu'on n'a bien accès à cette organisation
    return this.orgService.getUsers(currentUserProfile, orgId, filter);
  }

  @get('/organisations/{id}/role', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: '',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Role),
          },
        },
      },
    },
  })
  async getOrgRole(@param.path.string('id') id: string): Promise<Role[]> {
    return this.orgService.getAvailableRole(id);
  }

  @post('/organisations/{id}/user', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: '',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
    },
  })
  @authorize({
    allowedRoles: ['USER_ORG_MANAGER'],
  })
  async addUserToOrg(
    @param.path.string('id') id: string,
    @param.query.string('userid') userid: string,
  ): Promise<OrgUserLink> {
    const item = await this.orgUserLinkRepo.find({
      where: {
        organisationId: id,
      },
    });
    if (item.length > 0) {
      throw new Error('Already here');
    }
    const link = new OrgUserLink();
    link.organisationId = id;
    link.userId = userid;
    return this.orgUserLinkRepo.create(link);
  }

  @get('/organisations/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Organisation model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Organisation, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN', 'ORG_USER_MANAGER'],
  })
  async findById(
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Organisation))
    filter?: Filter<Organisation>,
  ): Promise<Organisation> {
    return this.organisationRepository.findById(id, filter);
  }

  @patch('/organisations/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Organisation PATCH success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Organisation, {partial: true}),
        },
      },
    })
    organisation: Organisation,
  ): Promise<void> {
    await this.organisationRepository.updateById(id, organisation);
  }

  @put('/organisations/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Organisation PUT success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() organisation: Organisation,
  ): Promise<void> {
    await this.organisationRepository.replaceById(id, organisation);
  }

  @del('/organisations/{id}', {
    responses: {
      '204': {
        description: 'Organisation DELETE success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.organisationRepository.deleteById(id);
  }
}
