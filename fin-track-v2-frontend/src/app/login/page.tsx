import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoadingScreen } from "@/components/loading-screen";
import { readSession } from "@/lib/session";
import { LoginForm } from "./login-form";

async function LoginScreen() {
  const session = await readSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Cargando…" />}>
      <LoginScreen />
    </Suspense>
  );
}
