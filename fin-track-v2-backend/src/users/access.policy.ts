import { Policy } from '@nestjs/authorization';
import type { AppUser, PermissionCode } from './app-user.js';

function allows(user: AppUser | null, permission: PermissionCode) {
  return user?.permissions.includes(permission) === true;
}

@Policy()
export class AccessPolicy {
  readFinance(user: AppUser | null) {
    return allows(user, 'finance.read');
  }

  writeFinance(user: AppUser | null) {
    return allows(user, 'finance.write');
  }

  readUsers(user: AppUser | null) {
    return allows(user, 'users.read');
  }

  manageUsers(user: AppUser | null) {
    return allows(user, 'users.manage');
  }

  manageRates(user: AppUser | null) {
    return user?.roles.includes('admin') === true;
  }
}
