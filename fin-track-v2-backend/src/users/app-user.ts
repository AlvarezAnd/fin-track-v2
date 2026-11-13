import type { User } from './user.entity.js';

export const PERMISSIONS = [
  { code: 'finance.read', name: 'Ver finanzas' },
  { code: 'finance.write', name: 'Registrar movimientos' },
  { code: 'users.read', name: 'Ver usuarios' },
  { code: 'users.manage', name: 'Administrar usuarios' },
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number]['code'];

export const ROLES = [
  {
    code: 'admin',
    name: 'Administrador',
    permissions: ['finance.read', 'finance.write', 'users.read', 'users.manage'],
  },
  {
    code: 'viewer',
    name: 'Consulta',
    permissions: ['finance.read'],
  },
  {
    code: 'user',
    name: 'Usuario común',
    permissions: ['finance.read', 'finance.write', 'users.read'],
  },
] as const satisfies readonly {
  code: string;
  name: string;
  permissions: readonly PermissionCode[];
}[];

export type AppUser = {
  id: number;
  username: string;
  roles: string[];
  permissions: PermissionCode[];
};

export function toAppUser(user: User): AppUser {
  const permissions = new Set<PermissionCode>();

  for (const role of user.roles ?? []) {
    for (const permission of role.permissions ?? []) {
      permissions.add(permission.code as PermissionCode);
    }
  }

  return {
    id: user.id,
    username: user.username,
    roles: (user.roles ?? []).map((role) => role.code),
    permissions: [...permissions],
  };
}

export function presentUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    roles: (user.roles ?? []).map((role) => role.code),
  };
}
