"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Exercise, ExerciseRow } from "@/lib/types";

const TABLE = "exercises";

function mapRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    videoUrl: row.video_url,
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

export async function getExercises(): Promise<Exercise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, title, description, video_url, notes, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ExerciseRow[]).map(mapRow);
}

export async function createExercise(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();

  if (!title || !description || !videoUrl) {
    throw new Error("Completa todos los campos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from(TABLE).insert({
    title,
    description,
    video_url: videoUrl,
    notes: "",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteExercise(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function updateNotes(id: string, notes: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ notes })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
