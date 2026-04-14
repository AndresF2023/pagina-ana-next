"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Jugador, Torneo } from "@/lib/types";

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

export async function updateJugador(id: string, field: "perfil" | "correcciones_tecnicas", value: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("jugadores").update({ [field]: value }).eq("id", id);
  if (error) throw new Error("Error al guardar.");
  revalidatePath(`/jugadores/${id}`);
}

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
  const lugar = String(formData.get("lugar") ?? "").trim();
  if (!nombre || !fecha) throw new Error("Completá nombre y fecha del torneo.");

  const supabase = await createClient();
  const { error } = await supabase.from("torneos").insert({ jugador_id: jugadorId, nombre, fecha, lugar });
  if (error) throw new Error("Error al guardar el torneo.");
  revalidatePath(`/jugadores/${jugadorId}`);
}

export async function deleteTorneo(id: string, jugadorId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("torneos").delete().eq("id", id);
  if (error) throw new Error("Error al eliminar el torneo.");
  revalidatePath(`/jugadores/${jugadorId}`);
}
