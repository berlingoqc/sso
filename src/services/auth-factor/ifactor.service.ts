import {bind, BindingScope, service} from '@loopback/core';
import {SMSAuthFactor} from './sms-factor.service';
import {EmailAuthFactor} from './email-factor.service';

export interface BaseAuthFactor {
  sendFactorMessage(addr: string, otp: string): Promise<void>;
}

@bind({scope: BindingScope.SINGLETON})
export class AuthFactorSender {
  factors: {[id: string]: BaseAuthFactor} = {};

  constructor(
    @service(SMSAuthFactor) smsFactor: SMSAuthFactor,
    @service(EmailAuthFactor) emailFactor: EmailAuthFactor,
  ) {
    this.factors['textsms'] = smsFactor;
    this.factors['email'] = emailFactor;
  }

  sendFactorMessage(factor: string, addr: string, otp: string) {
    return this.factors[factor].sendFactorMessage(addr, otp);
  }
}
