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
  if (error) throw new Error("Error al cargar el bienestar.");
  return data as Bienestar[];
}

export async function addBienestar(
  jugadorId: string,
  fecha: string,
  valor: number,
  nota: string
): Promise<void> {
  if (!fecha) throw new Error("Seleccioná una fecha.");
  if (valor < 1 || valor > 10) throw new Error("El valor debe estar entre 1 y 10.");
  const supabase = await createClient();
  const { error } = await supabase.from("bienestar").insert({ jugador_id: jugadorId, fecha, valor, nota });
  if (error) throw new Error("Error al guardar el bienestar.");
  revalidatePath(`/jugadores/${jugadorId}`);
}

export async function deleteBienestar(id: string, jugadorId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("bienestar").delete().eq("id", id);
  if (error) throw new Error("Error al eliminar el registro.");
  revalidatePath(`/jugadores/${jugadorId}`);
}

// ── Cuentas de acceso ──────────────────────────────────────────────────────

export async function createPlayerAccount(jugadorId: string, email: string, password: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role === "jugador") throw new Error("No autorizado.");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    user_metadata: { role: "jugador", jugador_id: jugadorId },
    email_confirm: true,
  });
  if (error) throw new Error(`Error al crear la cuenta: ${error.message}`);

  const { error: updateError } = await supabase
    .from("jugadores")
    .update({ user_id: data.user.id })
    .eq("id", jugadorId);

  if (updateError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error("Error al vincular la cuenta.");
  }

  revalidatePath(`/jugadores/${jugadorId}`);
}

export async function deletePlayerAccount(jugadorId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role === "jugador") throw new Error("No autorizado.");

  const { data: jugador } = await supabase
    .from("jugadores")
    .select("user_id")
    .eq("id", jugadorId)
    .single();

  if (!jugador?.user_id) throw new Error("Este jugador no tiene cuenta activa.");

  await supabase.from("jugadores").update({ user_id: null }).eq("id", jugadorId);
  await createAdminClient().auth.admin.deleteUser(jugador.user_id);

  revalidatePath(`/jugadores/${jugadorId}`);
}
