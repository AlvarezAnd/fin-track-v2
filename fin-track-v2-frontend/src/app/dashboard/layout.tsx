import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LoadingScreen } from "@/components/loading-screen";
import { readSession } from "@/lib/session";

async function DashboardShell({ children }: { children: ReactNode }) {
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell username={session.username} administrador={session.roles.includes("admin")}>
      {children}
    </AppShell>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingScreen label="Cargando…" />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
