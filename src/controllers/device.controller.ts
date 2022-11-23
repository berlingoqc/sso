import {TokenServiceBindings} from '@berlingoqc/lb-extensions';
import {TokenService} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {post, requestBody} from '@loopback/openapi-v3';
import {model, property} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {UserServiceBindings} from '../key';
import {Credentials} from '../repositories';
import {MyMyUserService} from '../services/user.service';


@model()
export class TokenRequest {
    @property()
    ttl?: number;
}

export type DeviceCredentials = Credentials & TokenRequest;

export class DeviceController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public myUserService: MyMyUserService,
  ) {}

  @post('/devices/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              property: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody() credentials: DeviceCredentials,
  ): Promise<{token: string}> {
    const user = await this.myUserService.verifyCredentials(credentials);
    if (user.type === 'device') {
      const userProfile = this.myUserService.convertToUserProfile(user, credentials.ttl);
      const token = await this.jwtService.generateToken(userProfile as any);
      return {token};
    }
    throw new HttpErrors['401']('not allowed');
  }
}
