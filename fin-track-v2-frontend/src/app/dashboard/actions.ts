"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/session";

export async function logout() {
  await signOut();
  redirect("/login");
}
