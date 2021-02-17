import { BaseAuthFactor } from './ifactor.service';
import { inject, bind, BindingScope } from '@loopback/core';
import { SMSBindings } from '../../key';
import { repository } from '@loopback/repository';
import { UserRepository } from '../../repositories';

export interface SMSSettings {
  accountSid: string;
  authToken: string;
  sendingNumber: string;
}

@bind({ scope: BindingScope.SINGLETON })
export class SMSAuthFactor implements BaseAuthFactor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;

  constructor(
    @inject(SMSBindings.SETTINGS)
    private settings: SMSSettings,
    @repository(UserRepository) public userRepository: UserRepository,
  ) {
    //this.client = require('twilio')(settings.accountSid, settings.authToken);
  }

  async sendFactorMessage(addr: string, otp: string): Promise<void> {
    const x = await this.userRepository.findOne({
      where: {
        email: addr,
      },
    });
    if (x?.phone) {
      const message = await this.client.messages.create({
        body: 'Votre code de validation ' + otp,
        from: this.settings.sendingNumber,
        to: x?.phone,
      });
      console.log(message.sid);
    }
  }
}
