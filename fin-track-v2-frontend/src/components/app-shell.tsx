"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { Chatbot } from "@/components/chatbot";
import { DisplaySettingsProvider } from "@/components/display-settings";
import { Header } from "@/components/header";
import { MovementDialog, type MovementDraft } from "@/components/movement-dialog";
import { Sidebar } from "@/components/sidebar";
import type { Movimiento, TipoMovimiento } from "@/lib/finance";

type MovementContextValue = {
  openMovement: (input?: TipoMovimiento | Movimiento) => void;
  removeMovement: (id: number) => Promise<string | null>;
  refresh: () => void;
  revision: number;
};

const MovementContext = createContext<MovementContextValue | null>(null);
const AdminContext = createContext(false);
const UsernameContext = createContext("");

export function useAdministrador() {
  return useContext(AdminContext);
}

export function useSessionUsername() {
  return useContext(UsernameContext);
}

export function useMovement() {
  const value = useContext(MovementContext);

  if (!value) {
    throw new Error("El registro de movimientos no está disponible.");
  }

  return value;
}

export function AppShell({
  username,
  administrador = false,
  children,
}: {
  username: string;
  administrador?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<MovementDraft | null>(null);
  const [revision, setRevision] = useState(0);

  function refresh() {
    setRevision((current) => current + 1);
  }

  function openMovement(input?: TipoMovimiento | Movimiento) {
    if (input && typeof input === "object") {
      setDraft({ mode: "edit", movimiento: input });
      return;
    }

    setDraft({ mode: "create", tipo: input ?? "egreso" });
  }

  async function removeMovement(id: number) {
    const response = await fetch(`/api/finanzas/${id}`, { method: "DELETE" });

    if (response.status === 401) {
      router.replace("/login");
      return null;
    }

    if (!response.ok) {
      return "No se pudo eliminar el movimiento.";
    }

    refresh();
    return null;
  }

  return (
    <DisplaySettingsProvider>
    <UsernameContext.Provider value={username}>
    <AdminContext.Provider value={administrador}>
    <MovementContext.Provider
      value={{
        openMovement,
        removeMovement,
        refresh,
        revision,
      }}
    >
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header username={username} />
          <div className="flex flex-1 flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] xl:pb-0">
            {children}
          </div>
          <BottomNav onCreate={() => openMovement("egreso")} />
          <Chatbot />
        </div>
      </div>
      {draft ? (
        <MovementDialog
          draft={draft}
          administrador={administrador}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            refresh();
          }}
        />
      ) : null}
    </MovementContext.Provider>
    </AdminContext.Provider>
    </UsernameContext.Provider>
    </DisplaySettingsProvider>
  );
}
