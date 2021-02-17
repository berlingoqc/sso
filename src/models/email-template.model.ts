import {Entity, model, property} from '@loopback/repository';

@model()
export class EmailTemplate extends Entity {
  @property({
    id: true,
  })
  key: string;

  @property()
  title: string; // DoT template for title

  @property()
  description: string; // Description of the template

  @property()
  template: string; // DoT template for body

  @property()
  args: {[id: string]: string}; // Args expected to received to correctly render the template

  constructor(data?: Partial<EmailTemplate>) {
    super(data);
  }
}

export interface EmailTemplateRelations {
  // describe navigational properties here
}

export type EmailTemplateWithRelations = EmailTemplate & EmailTemplateRelations;
