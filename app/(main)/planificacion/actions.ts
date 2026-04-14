"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Planificacion, TipoPlanificacion } from "@/lib/types";
import { TIPOS_PLANIFICACION } from "@/lib/types";

export async function getPlanificaciones(tipo?: TipoPlanificacion): Promise<Planificacion[]> {
  const supabase = await createClient();
  let query = supabase.from("planificacion").select("*").order("fecha", { ascending: false });
  if (tipo) query = query.eq("tipo", tipo);
  const { data, error } = await query;
  if (error) throw new Error("Error al cargar la planificación.");
  return data as Planificacion[];
}

export async function createPlanificacion(formData: FormData): Promise<void> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const tipoRaw = String(formData.get("tipo") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  const contenido = String(formData.get("contenido") ?? "").trim();

  if (!titulo || !fecha) throw new Error("Completá título y fecha.");
  const tipo = (TIPOS_PLANIFICACION as readonly string[]).includes(tipoRaw)
    ? (tipoRaw as TipoPlanificacion)
    : "diaria";

  const supabase = await createClient();
  const { error } = await supabase.from("planificacion").insert({ titulo, tipo, fecha, contenido });
  if (error) throw new Error("Error al guardar la planificación.");
  revalidatePath("/planificacion");
}

export async function deletePlanificacion(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("planificacion").delete().eq("id", id);
  if (error) throw new Error("Error al eliminar.");
  revalidatePath("/planificacion");
}
