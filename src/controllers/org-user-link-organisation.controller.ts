import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  OrgUserLink,
  Organisation,
} from '../models';
import {OrgUserLinkRepository} from '../repositories';

export class OrgUserLinkOrganisationController {
  constructor(
    @repository(OrgUserLinkRepository)
    public orgUserLinkRepository: OrgUserLinkRepository,
  ) { }

  @get('/org-user-links/{id}/organisation', {
    responses: {
      '200': {
        description: 'Organisation belonging to OrgUserLink',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Organisation)},
          },
        },
      },
    },
  })
  async getOrganisation(
    @param.path.number('id') id: typeof OrgUserLink.prototype.id,
  ): Promise<Organisation> {
    return this.orgUserLinkRepository.organisation(id);
  }
}
