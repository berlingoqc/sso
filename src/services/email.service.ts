import * as mailer from 'nodemailer';
import {inject, bind, BindingScope} from '@loopback/core';
import {EmailBindings} from '../key';
import {repository, model, property} from '@loopback/repository';
import {EmailTemplateRepository} from '../repositories';

import * as dot from 'dot';
import {EmailTemplate} from '../models';

export type EmailTemplateIDs = 'INVITE_USER' | 'CONFIRM_ACCOUNT' | 'OTP';

@model()
export class RenderEmail {
  @property()
  title: string;
  @property()
  body: string;
}

@bind({scope: BindingScope.SINGLETON})
export class EmailSenderService {
  transporter: mailer.Transporter;

  constructor(
    @inject(EmailBindings.TRANSPORTER) public transport: mailer.Transport,
    @inject(EmailBindings.EMAIL_FROM) public emailFrom: string,
    @inject(EmailBindings.REDIRECT_EMAIL_VALIDATION) public redirect: string,
    @repository(EmailTemplateRepository)
    public emailTemplateRepo: EmailTemplateRepository,
  ) {
    console.log(redirect);
    this.transporter = mailer.createTransport(transport);
  }

  async sendMail(option: mailer.SendMailOptions): Promise<any> {
    if (!option.from) {
      option.from = this.emailFrom;
    }
    const info = await this.transporter.sendMail(option);
    return info;
  }

  // Send a email from a template save in the database
  async sendMailTemplate(
    to: string,
    templateName: string,
    data: any,
    titleData?: any,
  ): Promise<{template: RenderEmail; sendData: any}> {
    const template = await this.renderTemplate(templateName, data, titleData);
    const sendData = await this.transporter.sendMail({
      to: to,
      from: this.emailFrom,
      subject: template.title,
      html: template.body,
    });
    return {template, sendData};
  }

  async renderTemplate(
    templateName: string,
    data: any,
    titleData: any,
  ): Promise<RenderEmail> {
    const template = await this.emailTemplateRepo.findById(templateName);
    const templateBody = dot.template(template.template)(data);
    const templateHeader = dot.template(template.title)(titleData);
    return {title: templateHeader, body: templateBody};
  }
}
