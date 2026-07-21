"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { Jugador, Torneo, Evaluacion, Asistencia, EstadoAsistencia, Bienestar } from "@/lib/types";

// ── Jugadores ──────────────────────────────────────────────────────────────

export async function getJugadores(): Promise<Jugador[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jugadores")
    .select("*")
    .order("apellido", { ascending: true });
  if (error) throw new Error("Error al cargar los jugadores.");
  return data as Jugador[];
}

export async function getJugador(id: string): Promise<Jugador | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jugadores")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Jugador;
}

export async function createJugador(formData: FormData): Promise<void> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  if (!nombre || !apellido) throw new Error("Completá nombre y apellido.");

  const supabase = await createClient();
  const { error } = await supabase.from("jugadores").insert({ nombre, apellido });
  if (error) throw new Error("Error al guardar el jugador.");
  revalidatePath("/jugadores");
}

export async function deleteJugador(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("jugadores").delete().eq("id", id);
  if (error) throw new Error("Error al eliminar el jugador.");
  revalidatePath("/jugadores");
}

export async function updateJugador(
  id: string,
  field: "perfil" | "correcciones_tecnicas" | "objetivos" | "modelos_a_seguir" | "identidad_conceptual" | "identidad_ejecutoria" | "estilo_caracteristicas" | "estilo_patrones",
  value: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("jugadores").update({ [field]: value }).eq("id", id);
  if (error) throw new Error("Error al guardar.");
  revalidatePath(`/jugadores/${id}`);
}

// ── Torneos ────────────────────────────────────────────────────────────────

export async function getTorneos(jugadorId: string): Promise<Torneo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("torneos")
    .select("*")
    .eq("jugador_id", jugadorId)
    .order("fecha", { ascending: true });
  if (error) throw new Error("Error al cargar los torneos.");
  return data as Torneo[];
}

export async function addTorneo(jugadorId: string, formData: FormData): Promise<void> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  const fecha_fin = String(formData.get("fecha_fin") ?? "").trim() || null;
  const lugar = String(formData.get("lugar") ?? "").trim();
  if (!nombre || !fecha) throw new Error("Completá nombre y fecha del torneo.");

  const supabase = await createClient();
  const { error } = await supabase.from("torneos").insert({ jugador_id: jugadorId, nombre, fecha, fecha_fin, lugar });
  if (error) throw new Error("Error al guardar el torneo.");
  revalidatePath(`/jugadores/${jugadorId}`);
}

export async function deleteTorneo(id: string, jugadorId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("torneos").delete().eq("id", id);
  if (error) throw new Error("Error al eliminar el torneo.");
  revalidatePath(`/jugadores/${jugadorId}`);
}

// ── Evaluaciones ───────────────────────────────────────────────────────────

export async function getEvaluaciones(jugadorId: string): Promise<Evaluacion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evaluaciones")
    .select("*")
    .eq("jugador_id", jugadorId)
    .order("fecha", { ascending: false });
  if (error) throw new Error("Error al cargar las evaluaciones.");
  return data as Evaluacion[];
}

export async function addEvaluacion(
  jugadorId: string,
  nombre: string,
  fecha: string,
  pdfUrl: string
): Promise<void> {
  if (!nombre || !fecha || !pdfUrl) throw new Error("Faltan datos de la evaluación.");
  const supabase = await createClient();
  const { error } = await supabase.from("evaluaciones").insert({ jugador_id: jugadorId, nombre, fecha, pdf_url: pdfUrl });
  if (error) throw new Error("Error al guardar la evaluación.");
  revalidatePath(`/jugadores/${jugadorId}`);
}

export async function deleteEvaluacion(id: string, jugadorId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("evaluaciones").delete().eq("id", id);
  if (error) throw new Error("Error al eliminar la evaluación.");
  revalidatePath(`/jugadores/${jugadorId}`);
}

// ── Asistencias ────────────────────────────────────────────────────────────

export async function getAsistencias(jugadorId: string): Promise<Asistencia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asistencias")
    .select("*")
    .eq("jugador_id", jugadorId)
    .order("fecha", { ascending: false });
  if (error) throw new Error("Error al cargar las asistencias.");
  return data as Asistencia[];
}

export async function addAsistencia(
  jugadorId: string,
  fecha: string,
  estado: string,
  nota: string
): Promise<void> {
  if (!fecha) throw new Error("Seleccioná una fecha.");
  const supabase = await createClient();
  const { error } = await supabase.from("asistencias").insert({ jugador_id: jugadorId, fecha, estado, nota });
  if (error) throw new Error("Error al guardar la asistencia.");
  revalidatePath(`/jugadores/${jugadorId}`);
}

export async function deleteAsistencia(id: string, jugadorId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("asistencias").delete().eq("id", id);
  if (error) throw new Error("Error al eliminar la asistencia.");
  revalidatePath(`/jugadores/${jugadorId}`);
}

// ── Bienestar subjetivo ────────────────────────────────────────────────────

export async function getBienestar(jugadorId: string): Promise<Bienestar[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bienestar")
    .select("*")
    .eq("jugador_id", jugadorId)
    .order("fecha", { ascending: false });
  if (error) return [];
  return data as Bienestar[];
}

export async function addBienestar(
  jugadorId: string,
  fecha: string,
  fatiga: number,
  dolor_muscular: number,
  nota_dolor: string,
  calidad_sueno: number,
  nota_sueno: string,
  estado_animico: number
): Promise<{ error: string } | null> {
  try {
    if (!fecha) return { error: "Seleccioná una fecha." };
    const supabase = await createClient();
    const { error } = await supabase.from("bienestar").insert({
      jugador_id: jugadorId,
      fecha,
      valor: 1,
      nota: "",
      fatiga,
      dolor_muscular,
      nota_dolor,
      calidad_sueno,
      nota_sueno,
      estado_animico,
    });
    if (error) {
      console.error("bienestar insert error:", JSON.stringify(error));
      return { error: "Error al guardar el bienestar." };
    }
    revalidatePath(`/jugadores/${jugadorId}`);
    return null;
  } catch {
    return { error: "Error inesperado al guardar el bienestar." };
  }
}

export async function deleteBienestar(id: string, jugadorId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("bienestar").delete().eq("id", id);
    if (error) console.error("Error al eliminar bienestar:", error);
    revalidatePath(`/jugadores/${jugadorId}`);
  } catch {
    // no propagamos el error para no crashear la UI
  }
}

// ── Cuentas de acceso ──────────────────────────────────────────────────────

export async function createPlayerAccount(
  jugadorId: string,
  email: string,
  password: string
): Promise<{ error: string } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role === "jugador") return { error: "No autorizado." };

    const admin = createAdminClient();

    // Intentar crear el usuario; si el email ya existe, buscarlo y reutilizarlo
    let authUserId: string;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { role: "jugador", jugador_id: jugadorId },
      email_confirm: true,
    });

    if (error) {
      if (!error.message.includes("already been registered")) {
        return { error: `Error al crear la cuenta: ${error.message}` };
      }
      // Email ya existe → buscar el usuario y reutilizarlo
      const { data: listData, error: listError } = await admin.auth.admin.listUsers();
      if (listError) return { error: "Error al verificar el usuario existente." };
      const existing = listData.users.find((u) => u.email === email);
      if (!existing) return { error: "No se pudo encontrar el usuario existente." };
      // Actualizar sus metadatos para vincularlo al nuevo jugador
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        user_metadata: { role: "jugador", jugador_id: jugadorId },
      });
      if (updateAuthError) return { error: `Error al actualizar la cuenta: ${updateAuthError.message}` };
      authUserId = existing.id;
    } else {
      authUserId = data.user.id;
    }

    const { error: updateError } = await supabase
      .from("jugadores")
      .update({ user_id: authUserId })
      .eq("id", jugadorId);

    if (updateError) {
      if (!error) await admin.auth.admin.deleteUser(authUserId);
      return { error: "Error al vincular la cuenta con el jugador." };
    }

    revalidatePath(`/jugadores/${jugadorId}`);
    return null;
  } catch {
    return { error: "Error inesperado al crear la cuenta." };
  }
}

export async function deletePlayerAccount(jugadorId: string): Promise<{ error: string } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role === "jugador") return { error: "No autorizado." };

    const { data: jugador } = await supabase
      .from("jugadores")
      .select("user_id")
      .eq("id", jugadorId)
      .single();

    if (!jugador?.user_id) return { error: "Este jugador no tiene cuenta activa." };

    await supabase.from("jugadores").update({ user_id: null }).eq("id", jugadorId);
    await createAdminClient().auth.admin.deleteUser(jugador.user_id);

    revalidatePath(`/jugadores/${jugadorId}`);
    return null;
  } catch {
    return { error: "Error inesperado al revocar el acceso." };
  }
}
