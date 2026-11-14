export type UsuarioItem = {
  id: number;
  username: string;
  roles: string[];
};

export type RolItem = {
  code: string;
  name: string;
  permissions: string[];
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  user: "Usuario común",
  viewer: "Consulta",
};

export function labelRoles(roles: string[]) {
  if (roles.length === 0) {
    return "Sin rol";
  }

  return roles.map((role) => ROLE_LABELS[role] ?? role).join(", ");
}
