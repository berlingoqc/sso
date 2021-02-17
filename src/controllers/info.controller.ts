import {
  SSOBindings,
  EmailBindings,
  TokenServiceBindings,
  PasswordHasherBindings,
} from '../key';
import {SSOSettings} from '../settings';
import {inject} from '@loopback/core';
import {get} from '@loopback/rest';
import {model, property, repository} from '@loopback/repository';
import {Transport} from 'nodemailer';
import {PasswordConfig, ExtraField} from '../models';
import {ExtraFieldRepository} from '../repositories';

@model()
export class SSOFullSettings {
  @property()
  sso: SSOSettings;

  @property()
  email: any;

  @property()
  emailFrom: string;

  @property()
  emailRedirect: string;

  @property()
  tokenExpiresIn: string;

  @property()
  password: PasswordConfig;

  @property()
  userExtraFields: ExtraField[];
}

export class InfoController {
  constructor(
    @inject(SSOBindings.SETTINGS)
    private settings: SSOSettings,
    @inject(EmailBindings.TRANSPORTER)
    private emailTransporter: Transport,
    @inject(EmailBindings.REDIRECT_EMAIL_VALIDATION)
    private emailRedirect: string,
    @inject(PasswordHasherBindings.PASSWORD_CONFIG)
    private passwordConfig: PasswordConfig,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
    private tokenExpiresIn: string,
    @inject(EmailBindings.EMAIL_FROM)
    private emailFrom: string,
    @repository(ExtraFieldRepository)
    private extraFieldRepository: ExtraFieldRepository,
  ) {}

  @get('/info/sso', {
    responses: {
      '200': {
        description: '',
        content: {
          'application/json': {schema: SSOFullSettings},
        },
      },
    },
  })
  async getInfoSSO(): Promise<SSOFullSettings> {
    const transporter = {
      host: (this.emailTransporter as any).host,
      auth: {
        user: (this.emailTransporter as any).auth.user,
      },
    };
    const extraField = await this.extraFieldRepository.find();
    return {
      sso: this.settings,
      email: transporter,
      emailRedirect: this.emailRedirect,
      tokenExpiresIn: this.tokenExpiresIn,
      password: this.passwordConfig,
      emailFrom: this.emailFrom,
      userExtraFields: extraField,
    };
  }
}
