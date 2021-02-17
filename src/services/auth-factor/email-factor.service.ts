import {bind, BindingScope, service} from '@loopback/core';
import {BaseAuthFactor} from './ifactor.service';
import {EmailSenderService} from '../email.service';

@bind({scope: BindingScope.SINGLETON})
export class EmailAuthFactor implements BaseAuthFactor {
  constructor(
    @service(EmailSenderService)
    private emailService: EmailSenderService,
  ) {}

  async sendFactorMessage(addr: string, otp: string): Promise<void> {
    await this.emailService.sendMailTemplate(addr, 'OTP', {
      otp,
    });
  }
}
