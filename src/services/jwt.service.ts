
import { inject } from '@loopback/context';
import { HttpErrors } from '@loopback/rest';
import { promisify } from 'util';
import { TokenService } from '@loopback/authentication';
import { UserProfile, securityId } from '@loopback/security';
import { TokenServiceBindings } from './../key';
import { repository } from '@loopback/repository';
import { UserRoleMappingRepository } from '../repositories';
import { User } from '../models';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class JWTService implements TokenService {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SECRET)
    private jwtSecret: string,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
    private jwtExpiresIn: string,
    @repository('UserRoleMappingRepository')
    private roleRepo: UserRoleMappingRepository
  ) { }

  async verifyToken(token: string): Promise<UserProfile> {
    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : 'token' is null`,
      );
    }

    let userProfile: UserProfile;

    try {
      // decode user profile from token
      const decodedToken = await verifyAsync(token, this.jwtSecret);
      // don't copy over  token field 'iat' and 'exp', nor 'email' to user profile
      userProfile = Object.assign(
        { [securityId]: '', name: '' },
        {
          [securityId]: decodedToken.id,
          name: decodedToken.name,
          id: decodedToken.id,
          roles: decodedToken.roles
        },
      );
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : ${error.message}`,
      );
    }
    return userProfile;
  }

  async generateToken(userProfile: any): Promise<string> {
    if (!userProfile) {
      throw new HttpErrors.Unauthorized(
        'Error generating token : userProfile is null',
      );
    }
    const roles = await this.roleRepo.find({
      where: {
        userId: userProfile.id
      }
    })
    console.log(userProfile);
    // get le roles associer au user et l'ajoute dans le truc
    const userInfoForToken = {
      id: userProfile[securityId],
      name: 'Mon nom',
      email: userProfile.email,
      roles: roles.map(x => x.role)
    };
    // Generate a JSON Web Token
    let token: string;
    try {
      token = await signAsync(userInfoForToken, this.jwtSecret, {
        expiresIn: Number(this.jwtExpiresIn),
      });
    } catch (error) {
      throw new HttpErrors.Unauthorized(`Error encoding token : ${error}`);
    }

    return token;
  }
}
