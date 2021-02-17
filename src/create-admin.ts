#!/usr/bin/env node

import { StarterApplication } from './application';
import { UserRepository, UserRoleMappingRepository, ExtraFieldRepository } from './repositories';
import { PasswordHasherBindings } from './key';
import { RoleService } from './services/role.service';
import { MyUserService } from './services/user.service';

const help = `Argument de la commande: USER PASSWORD et la variable d'environement DB_URL doit correspondre à l'url de la bd postgresql`

async function createAdminApp(email: string, password: string) {
  if (!email || !password) {
    throw 'Email ou mot de passe invalide\n\n' + help;
  }
  const app = new StarterApplication();
  await app.boot();

  const nullT = {} as any;

  const userRepo = await app.getRepository(UserRepository);
  const roleRepo = await app.getRepository(UserRoleMappingRepository);

  const passwordHasher = await app.get(PasswordHasherBindings.PASSWORD_HASHER);
  const passwordConfig = await app.get(PasswordHasherBindings.PASSWORD_CONFIG);

  const roleService = new RoleService(nullT, roleRepo);
  const userService = new MyUserService(userRepo, nullT, nullT, nullT, passwordHasher, passwordConfig, nullT, nullT, nullT, nullT, roleService);

  await userService.createAdmin({
    email,
    password
  } as any);

  process.exit(0);
}

createAdminApp(process.argv[2], process.argv[3]);


