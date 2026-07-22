"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;
  if (!user || role === "jugador" || role === "staff") throw new Error("No autorizado.");
}

export async function getStaffAccounts(): Promise<{ id: string; email: string }[]> {
  await assertAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) return [];
  return data.users
    .filter((u) => u.user_metadata?.role === "staff")
    .map((u) => ({ id: u.id, email: u.email ?? "" }));
}

export async function createStaffAccount(
  email: string,
  password: string
): Promise<{ error: string } | null> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { role: "staff" },
      email_confirm: true,
    });
    if (error) return { error: `Error al crear la cuenta: ${error.message}` };
    return null;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error inesperado." };
  }
}

export async function deleteStaffAccount(userId: string): Promise<{ error: string } | null> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { error: `Error al eliminar la cuenta: ${error.message}` };
    return null;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error inesperado." };
  }
}
