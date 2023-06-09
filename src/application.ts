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
import { SSOApplicationComponent } from './component';

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

    this.component(MetricsComponent);
    this.component(SSOApplicationComponent);
  }

}
