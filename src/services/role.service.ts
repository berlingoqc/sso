import { bind, BindingScope } from "@loopback/core";
import { repository } from "@loopback/repository";
import { RoleRepository, UserRoleMappingRepository } from "../repositories";
import { UserRoleMapping } from "../models";

@bind({ scope: BindingScope.TRANSIENT })
export class RoleService {

  constructor(
    @repository(RoleRepository)
    private roleRepo: RoleRepository,
    @repository(UserRoleMappingRepository)
    private userRoleMappingRepository: UserRoleMappingRepository
  ) {

  }

  async addRoleToUser(userId: string, roleName: string): Promise<UserRoleMapping> {
    return this.userRoleMappingRepository.create({ userId, role: roleName })
  }
}
