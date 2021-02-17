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
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  User,
  OrgUserLink,
} from '../models';
import {UserRepository} from '../repositories';

export class UserOrgUserLinkController {
  constructor(
    @repository(UserRepository) protected userRepository: UserRepository,
  ) { }

  @get('/users/{id}/org-user-links', {
    responses: {
      '200': {
        description: 'Array of User has many OrgUserLink',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(OrgUserLink)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<OrgUserLink>,
  ): Promise<OrgUserLink[]> {
    return this.userRepository.orgUserLinks(id).find(filter);
  }

  @post('/users/{id}/org-user-links', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: getModelSchemaRef(OrgUserLink)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof User.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OrgUserLink, {
            title: 'NewOrgUserLinkInUser',
            exclude: ['id'],
            optional: ['userId']
          }),
        },
      },
    }) orgUserLink: Omit<OrgUserLink, 'id'>,
  ): Promise<OrgUserLink> {
    return this.userRepository.orgUserLinks(id).create(orgUserLink);
  }

  @patch('/users/{id}/org-user-links', {
    responses: {
      '200': {
        description: 'User.OrgUserLink PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OrgUserLink, {partial: true}),
        },
      },
    })
    orgUserLink: Partial<OrgUserLink>,
    @param.query.object('where', getWhereSchemaFor(OrgUserLink)) where?: Where<OrgUserLink>,
  ): Promise<Count> {
    return this.userRepository.orgUserLinks(id).patch(orgUserLink, where);
  }

  @del('/users/{id}/org-user-links', {
    responses: {
      '200': {
        description: 'User.OrgUserLink DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(OrgUserLink)) where?: Where<OrgUserLink>,
  ): Promise<Count> {
    return this.userRepository.orgUserLinks(id).delete(where);
  }
}
