"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionUsername } from "@/components/app-shell";
import { LoadingScreen } from "@/components/loading-screen";
import { SETTINGS_CARD_CLASS } from "@/components/settings-styles";
import { UserDeleteDialog } from "@/components/user-delete-dialog";
import { UserEditDialog } from "@/components/user-edit-dialog";
import { UserViewDialog } from "@/components/user-view-dialog";
import { UsersAdminSearch } from "@/components/users-admin-search";
import { UsersAdminTable } from "@/components/users-admin-table";
import type { RolItem, UsuarioItem } from "@/components/users-types";

function parseUsuarios(body: unknown): UsuarioItem[] {
  if (!Array.isArray(body)) {
    return [];
  }

  return body.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const row = item as Record<string, unknown>;
    const id = typeof row.id === "number" ? row.id : Number(row.id);
    const username = typeof row.username === "string" ? row.username : "";
    const roles = Array.isArray(row.roles)
      ? row.roles.filter((role): role is string => typeof role === "string")
      : [];

    if (!Number.isFinite(id) || !username) {
      return [];
    }

    return [{ id, username, roles }];
  });
}

function parseRoles(body: unknown): RolItem[] {
  if (!Array.isArray(body)) {
    return [];
  }

  return body.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const row = item as Record<string, unknown>;
    const code = typeof row.code === "string" ? row.code : "";
    const name = typeof row.name === "string" ? row.name : code;
    const permissions = Array.isArray(row.permissions)
      ? row.permissions.filter((permission): permission is string => typeof permission === "string")
      : [];

    if (!code) {
      return [];
    }

    return [{ code, name, permissions }];
  });
}

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as { message?: unknown; error?: unknown } | null;
  if (typeof body?.message === "string") {
    return body.message;
  }
  if (Array.isArray(body?.message) && typeof body.message[0] === "string") {
    return body.message[0];
  }
  if (typeof body?.error === "string") {
    return body.error;
  }
  return null;
}

type CargaUsuarios =
  | { estado: "no-autorizado" }
  | { estado: "error" }
  | { estado: "ok"; usuarios: UsuarioItem[]; roles: RolItem[] };

async function cargarUsuarios(): Promise<CargaUsuarios> {
  const [usuariosResponse, rolesResponse] = await Promise.all([
    fetch("/api/usuarios"),
    fetch("/api/roles"),
  ]);

  if (usuariosResponse.status === 401 || rolesResponse.status === 401) {
    return { estado: "no-autorizado" };
  }

  if (!usuariosResponse.ok) {
    return { estado: "error" };
  }

  return {
    estado: "ok",
    usuarios: parseUsuarios(await usuariosResponse.json()),
    roles: rolesResponse.ok ? parseRoles(await rolesResponse.json()) : [],
  };
}

export function UsersAdminCard() {
  const router = useRouter();
  const sessionUsername = useSessionUsername();
  const [usuarios, setUsuarios] = useState<UsuarioItem[] | null>(null);
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<UsuarioItem | null>(null);
  const [editing, setEditing] = useState<UsuarioItem | null>(null);
  const [deleting, setDeleting] = useState<UsuarioItem | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    void cargarUsuarios().then((carga) => {
      if (!activo) {
        return;
      }

      if (carga.estado === "no-autorizado") {
        router.replace("/login");
        return;
      }

      if (carga.estado === "error") {
        setError("No se pudieron cargar los usuarios.");
        setUsuarios([]);
        return;
      }

      setUsuarios(carga.usuarios);
      setRoles(carga.roles);
      setError(null);
    });

    return () => {
      activo = false;
    };
  }, [router]);

  const visibles = useMemo(() => {
    if (!usuarios) {
      return [];
    }

    const needle = query.trim().toLowerCase();
    if (!needle) {
      return usuarios;
    }

    return usuarios.filter((usuario) => {
      const rolesText = usuario.roles.join(" ").toLowerCase();
      return usuario.username.toLowerCase().includes(needle) || rolesText.includes(needle);
    });
  }, [usuarios, query]);

  async function saveRoles(nextRoles: string[]) {
    if (!editing) {
      return;
    }

    setPending(true);
    setActionError(null);
    const response = await fetch(`/api/usuarios/${editing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roles: nextRoles }),
    });
    setPending(false);

    if (response.status === 401) {
      router.replace("/login");
      return;
    }

    if (!response.ok) {
      setActionError((await readError(response)) ?? "No se pudieron guardar los roles.");
      return;
    }

    const updated = parseUsuarios([await response.json()])[0];
    setUsuarios((current) =>
      (current ?? []).map((usuario) => (usuario.id === editing.id ? (updated ?? { ...usuario, roles: nextRoles }) : usuario)),
    );
    setEditing(null);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }

    setPending(true);
    setActionError(null);
    const response = await fetch(`/api/usuarios/${deleting.id}`, { method: "DELETE" });
    setPending(false);

    if (response.status === 401) {
      router.replace("/login");
      return;
    }

    if (!response.ok) {
      setActionError((await readError(response)) ?? "No se pudo eliminar el usuario.");
      return;
    }

    setUsuarios((current) => (current ?? []).filter((usuario) => usuario.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <section className={SETTINGS_CARD_CLASS} aria-labelledby="usuarios-admin">
      <h2 id="usuarios-admin" className="text-base font-semibold">
        Usuarios
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Consultá las cuentas registradas, cambiá roles o eliminá usuarios sin datos financieros.
      </p>

      {!usuarios && !error ? (
        <LoadingScreen label="Cargando usuarios…" className="py-10" />
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {usuarios ? (
        <div className="mt-4 flex flex-col gap-4">
          <UsersAdminSearch value={query} onChange={setQuery} />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {visibles.length === 1
              ? "1 usuario encontrado"
              : `${visibles.length} usuarios encontrados`}
          </p>
          <UsersAdminTable
            usuarios={visibles}
            sessionUsername={sessionUsername}
            onView={setViewing}
            onEdit={(usuario) => {
              setActionError(null);
              setEditing(usuario);
            }}
            onDelete={(usuario) => {
              setActionError(null);
              setDeleting(usuario);
            }}
          />
        </div>
      ) : null}

      {viewing ? <UserViewDialog usuario={viewing} onClose={() => setViewing(null)} /> : null}
      {editing ? (
        <UserEditDialog
          usuario={editing}
          roles={roles}
          pending={pending}
          error={actionError}
          onClose={() => {
            if (!pending) {
              setEditing(null);
              setActionError(null);
            }
          }}
          onSave={saveRoles}
        />
      ) : null}
      {deleting ? (
        <UserDeleteDialog
          usuario={deleting}
          pending={pending}
          error={actionError}
          onClose={() => {
            if (!pending) {
              setDeleting(null);
              setActionError(null);
            }
          }}
          onConfirm={() => {
            void confirmDelete();
          }}
        />
      ) : null}
    </section>
  );
}
