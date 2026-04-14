"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Category, Exercise, ExerciseRow } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

const TABLE = "exercises";

function mapRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    videoUrl: row.video_url,
    notes: row.notes ?? "",
    category: (CATEGORIES as readonly string[]).includes(row.category ?? "")
      ? (row.category as Category)
      : null,
    createdAt: row.created_at,
  };
}

function toDbError(error: { message: string }, fallback: string): Error {
  console.error("[DB]", error.message);
  return new Error(`${fallback} (${error.message})`);
}

export async function getExercises(): Promise<Exercise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, title, description, video_url, notes, category, created_at")
    .order("created_at", { ascending: false });

  if (error) throw toDbError(error, "Error al cargar los ejercicios.");
  return (data as ExerciseRow[]).map(mapRow);
}

export async function createExercise(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "").trim();
  const category = (CATEGORIES as readonly string[]).includes(categoryRaw)
    ? (categoryRaw as Category)
    : null;

  if (!title || !description || !videoUrl) {
    throw new Error("Completa todos los campos.");
  }

  try {
    new URL(videoUrl);
  } catch {
    throw new Error("La URL del video no es válida.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from(TABLE).insert({
    title,
    description,
    video_url: videoUrl,
    notes: "",
    category,
  });

  if (error) throw toDbError(error, "Error al guardar el ejercicio.");
  revalidatePath("/");
}

export async function deleteExercise(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw toDbError(error, "Error al eliminar el ejercicio.");
  revalidatePath("/");
}

export async function updateNotes(id: string, notes: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ notes })
    .eq("id", id);
  if (error) throw toDbError(error, "Error al guardar las indicaciones.");
  revalidatePath("/");
}
