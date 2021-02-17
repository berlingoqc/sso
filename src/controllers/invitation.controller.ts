// Uncomment these imports to begin using these cool features!

import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import { service, inject } from '@loopback/core';
import {
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
  get,
  del,
} from '@loopback/rest';
import { AcceptedInvitation, User } from '../models';
import { InvitationService } from '../services';
import { SecurityBindings, UserProfile } from '@loopback/security';

// import {inject} from '@loopback/context';

export class InvitationController {
  constructor(
    @service(InvitationService) public invitationService: InvitationService,
  ) { }

  @patch('/invitation/users')
  async acceptInviteUser(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AcceptedInvitation),
        },
      },
    })
    request: AcceptedInvitation,
  ) {
    return this.invitationService.acceptInvitationUser(
      request.email,
      request.otp,
      request.password,
    );
  }

  @post('/invitation/users', {
    responses: {
      '200': {
        description: '',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async inviteUser(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User),
        },
      },
    })
    newUserRequest: User,
  ) {
    return this.invitationService.inviteUser(newUserRequest);
  }

  @post('/invitation/org/{id}', {
    responses: {
      '200': {
        description: '',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ORG_USER_MANAGER'],
  })
  async inviteUserToOrg(
    @param.path.string('id') id: string,
    @param.query.string('email') email: string,
  ): Promise<User> {
    return this.invitationService.inviteUserToOrganisation(email, id);
  }

  @patch('/invitation/org/{invitationId}')
  @authenticate('jwt')
  async responseOrgInvitation(
    @param.path.number('invitationId') invitationId: number,
    @param.query.boolean('response') response = false,
  ) {
    return this.invitationService.acceptOrganisationInvitation(
      invitationId,
      response,
    );
  }

  @get('/invitation/org/me')
  @authenticate('jwt')
  async getMyOrgInvitation(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ) {
    return this.invitationService.orgInvitationRepo.find({
      where: { userId: currentUserProfile.id },
      include: [
        {
          relation: 'organisation',
        },
      ],
    });
  }

  @get('/invitation/org/{id}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ORG_USER_MANAGER'],
  })
  async getOrganisationInvitation(@param.path.string('id') id: string) {
    return this.invitationService.orgInvitationRepo.find({
      where: {
        organisationId: id,
      },
      include: [
        {
          relation: 'user',
        },
      ],
    });
  }

  @del('/invitation/org/{id}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ORG_USER_MANAGER'],
  })
  async deleteInvitationOrg(@param.path.number('id') id: number) {
    return this.invitationService.orgInvitationRepo.deleteById(id);
  }
}
