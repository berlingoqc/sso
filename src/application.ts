import { BootMixin } from '@loopback/boot';
import { ApplicationConfig, Getter } from '@loopback/core';
import { RepositoryMixin } from '@loopback/repository';
import { RestApplication } from '@loopback/rest';
import { ServiceMixin } from '@loopback/service-proxy';
import {
  TokenServiceBindings,
  PasswordHasherBindings,
  UserServiceBindings,
  EmailBindings,
  SMSBindings,
  OTPBindings,
  SSOBindings,
} from './key';
import { JWTService, BcryptHasher } from './services';
import { MyMyUserService, MyUserService } from './services/user.service';

import { SSOSettings } from './settings';
import { PasswordConfig } from './models';

import { MetricsComponent } from '@loopback/metrics';

import { AlbAuthMixin } from '@berlingoqc/lb-extensions';

export class StarterApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(AlbAuthMixin(RestApplication))),
) {
  constructor(
    options: ApplicationConfig = {
      pkg: {},
      dirname: __dirname,
      strategy: 'local',
    },
  ) {
    super(options);

    this.setUpBindings();

    this.component(MetricsComponent);
  }

  setUpBindings(): void {
    console.log('DB_URL', process.env.DB_URL);

    const settingsEnv = process.env.SSO_SETTINGS;
    let settings = new SSOSettings();
    if (settingsEnv) {
      settings = JSON.parse(settingsEnv);
    }
    this.bind(SSOBindings.SETTINGS).to(settings as any);

    const passwordConfigEnv = process.env.PASSWORD_CONFIG;
    let passwordConfig: PasswordConfig;
    if (!passwordConfigEnv) {
      passwordConfig = {
        max: 16,
        min: 8,
        symbol: false,
        upperLetter: true,
      };
    } else {
      passwordConfig = JSON.parse(passwordConfigEnv) as PasswordConfig;
    }

    this.bind(PasswordHasherBindings.PASSWORD_CONFIG).to(passwordConfig);

    this.bind('datasources.config.pgsql').to({
      name: 'pgsql',
      connector: 'postgresql',
      url: process.env.DB_URL ?? '',
    });

    this.bind(EmailBindings.TRANSPORTER).to({
      type: process.env.EMAIL_TYPE ?? 'smtp',
      host: process.env.EMAIL_HOST ?? 'smtp.sendgrid.net',
      port: process.env.EMAIL_PORT ?? 465,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
      },
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    } as any);

    this.bind(EmailBindings.REDIRECT_EMAIL_VALIDATION).to(
      process.env.EMAIL_REDIRECT ?? '',
    );

    this.bind(EmailBindings.EMAIL_FROM).to(
      process.env.EMAIL_FROM ?? '"Default" <info@berlingoqc.com>',
    );

    this.bind(SMSBindings.SETTINGS).to({
      accountSid: process.env.SMS_SID ?? '',
      authToken: process.env.SMS_TOKEN ?? '',
      sendingNumber: process.env.SMS_NUMBER ?? '',
    });

    this.bind(OTPBindings.SECRET).to(process.env.OTP_SECRET ?? '');

    this.bind(TokenServiceBindings.TOKEN_SECRET).to(
      process.env.JWT_SECRET ?? '',
    );
    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(
      process.env.JWT_TTL ?? '',
    );
    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);

    this.bind(PasswordHasherBindings.ROUNDS).to(10);
    this.bind(PasswordHasherBindings.PASSWORD_HASHER).toClass(BcryptHasher);
    this.bind(UserServiceBindings.USER_SERVICE).toClass(MyMyUserService);
  }
}
