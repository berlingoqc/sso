import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
  model,
  property,
  FilterExcludingWhere,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import {EmailTemplate} from '../models';
import {EmailTemplateRepository} from '../repositories';
import {RenderEmail, EmailSenderService} from '../services/email.service';
import {service} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';

@model()
export class RenderEmailRequest {
  @property()
  name: string;
  @property()
  data: {[id: string]: unknown};
  @property()
  titleData: {[id: string]: unknown};
}

@model()
export class SendMailRequest {
  @property()
  to: string;
  @property()
  template: string;
  @property()
  data: any;
  @property()
  titleData: any;
}

export class TemplateController {
  constructor(
    @repository(EmailTemplateRepository)
    public emailTemplateRepository: EmailTemplateRepository,
    @service(EmailSenderService)
    public emailSenderService: EmailSenderService,
  ) {}

  @post('/email-templates/sender', {
    responses: {
      '200': {
        description: 'Send email template to the wild',
        content: {'application/json': {schema: getModelSchemaRef(RenderEmail)}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN', 'ORG_USER_MANAGER'],
  })
  async sendEmail(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SendMailRequest),
        },
      },
    })
    data: SendMailRequest,
  ): Promise<RenderEmail> {
    const {template} = await this.emailSenderService.sendMailTemplate(
      data.to,
      data.template,
      data.data,
      data.titleData,
    );
    return template;
  }

  @post('/email-templates/render', {
    responses: {
      '200': {
        description: 'Render email template',
        content: {'application/json': {schema: getModelSchemaRef(RenderEmail)}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN'],
  })
  async renderEmail(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RenderEmailRequest),
        },
      },
    })
    data: RenderEmailRequest,
  ): Promise<RenderEmail> {
    return this.emailSenderService.renderTemplate(
      data.name,
      data.data,
      data.titleData,
    );
  }

  @post('/email-templates', {
    responses: {
      '200': {
        description: 'EmailTemplate model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(EmailTemplate)},
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN', 'ORG_USER_MANAGER'],
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(EmailTemplate, {
            title: 'NewEmailTemplate',
          }),
        },
      },
    })
    emailTemplate: EmailTemplate,
  ): Promise<EmailTemplate> {
    return this.emailTemplateRepository.create(emailTemplate);
  }

  @get('/email-templates/count', {
    responses: {
      '200': {
        description: 'EmailTemplate model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN', 'ORG_USER_MANAGER'],
  })
  async count(
    @param.where(EmailTemplate) where?: Where<EmailTemplate>,
  ): Promise<Count> {
    return this.emailTemplateRepository.count(where);
  }

  @get('/email-templates', {
    responses: {
      '200': {
        description: 'Array of EmailTemplate model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(EmailTemplate, {includeRelations: true}),
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
    @param.filter(EmailTemplate) filter?: Filter<EmailTemplate>,
  ): Promise<EmailTemplate[]> {
    return this.emailTemplateRepository.find(filter);
  }

  @patch('/email-templates', {
    responses: {
      '200': {
        description: 'EmailTemplate PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN', 'ORG_USER_MANAGER'],
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(EmailTemplate, {partial: true}),
        },
      },
    })
    emailTemplate: EmailTemplate,
    @param.where(EmailTemplate) where?: Where<EmailTemplate>,
  ): Promise<Count> {
    return this.emailTemplateRepository.updateAll(emailTemplate, where);
  }

  @get('/email-templates/{id}', {
    responses: {
      '200': {
        description: 'EmailTemplate model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(EmailTemplate, {includeRelations: true}),
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
    @param.filter(EmailTemplate, {exclude: 'where'})
    filter?: FilterExcludingWhere<EmailTemplate>,
  ): Promise<EmailTemplate> {
    return this.emailTemplateRepository.findById(id, filter);
  }

  @patch('/email-templates/{id}', {
    responses: {
      '204': {
        description: 'EmailTemplate PATCH success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN', 'ORG_USER_MANAGER'],
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(EmailTemplate, {partial: true}),
        },
      },
    })
    emailTemplate: EmailTemplate,
  ): Promise<void> {
    await this.emailTemplateRepository.updateById(id, emailTemplate);
  }

  @put('/email-templates/{id}', {
    responses: {
      '204': {
        description: 'EmailTemplate PUT success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN', 'ORG_USER_MANAGER'],
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() emailTemplate: EmailTemplate,
  ): Promise<void> {
    await this.emailTemplateRepository.replaceById(id, emailTemplate);
  }

  @del('/email-templates/{id}', {
    responses: {
      '204': {
        description: 'EmailTemplate DELETE success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['ADMIN', 'ORG_USER_MANAGER'],
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.emailTemplateRepository.deleteById(id);
  }
}
