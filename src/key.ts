import { BindingKey } from '@loopback/context';
import { PasswordHasher } from './services/hash.password.bcryptjs';
import { TokenService, UserService } from '@loopback/authentication';
import { User, PasswordConfig } from './models';
import { Credentials } from './repositories';

import { Transport } from 'nodemailer';
import { SMSSettings } from './services/auth-factor/sms-factor.service';

export namespace SSOBindings {
  export const SETTINGS = BindingKey.create<string>('sso.settings');
}

export namespace TokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>(
    'authentication.jwt.secret',
  );
  export const TOKEN_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.expires.in.seconds',
  );
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.authentication.jwt.tokenservice',
  );
}

export namespace OTPBindings {
  export const SECRET = BindingKey.create<string>('otp.secret');
}

export namespace EmailBindings {
  export const TRANSPORTER = BindingKey.create<Transport>('email.transport');
  export const EMAIL_FROM = BindingKey.create<string>('email.from');

  export const REDIRECT_EMAIL_VALIDATION = BindingKey.create<string>(
    'email.redirect',
  );
}

export namespace SMSBindings {
  export const SETTINGS = BindingKey.create<SMSSettings>('sms.settings');
}

export namespace PasswordHasherBindings {
  export const PASSWORD_HASHER = BindingKey.create<PasswordHasher>(
    'services.hasher',
  );
  export const ROUNDS = BindingKey.create<number>('services.hasher.round');

  export const PASSWORD_CONFIG = BindingKey.create<PasswordConfig>(
    'services.password-config',
  );
}

export namespace UserServiceBindings {
  export const USER_SERVICE = BindingKey.create<UserService<User, Credentials>>(
    'services.user.service',
  );
}
