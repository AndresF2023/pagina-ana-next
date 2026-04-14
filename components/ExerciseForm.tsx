"use client";

import { useRef, useState, useTransition } from "react";
import { createExercise } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import { CATEGORIES } from "@/lib/types";

type VideoMode = "url" | "file";

const MAX_FILE_SIZE_MB = 200;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function ExerciseForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [videoMode, setVideoMode] = useState<VideoMode>("url");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    if (videoMode === "file") {
      const file = formData.get("videoFile") as File | null;
      if (!file || file.size === 0) {
        setError("Seleccioná un archivo de video antes de guardar.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`El video no puede superar los ${MAX_FILE_SIZE_MB} MB.`);
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() ?? "mp4";
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("videos")
          .upload(filename, file, { contentType: file.type });

        if (uploadError) throw new Error(`Error al subir el video: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from("videos")
          .getPublicUrl(filename);

        formData.set("videoUrl", publicUrl);
        formData.delete("videoFile");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir el video.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    startTransition(async () => {
      try {
        await createExercise(formData);
        formRef.current?.reset();
        setVideoMode("url");
        setSelectedFile(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  const isLoading = uploading || isPending;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Agregar ejercicio
      </h2>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Nombre del ejercicio
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="Ej: Saque con objetivo"
            required
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="¿Qué se trabaja en este ejercicio?"
            required
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-sm font-medium text-slate-700">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Video</span>

          {/* Selector de modo */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => { setVideoMode("url"); setSelectedFile(null); }}
              className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${
                videoMode === "url"
                  ? "bg-white text-slate-800 shadow-sm font-medium"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              YouTube / Vimeo
            </button>
            <button
              type="button"
              onClick={() => { setVideoMode("file"); setSelectedFile(null); }}
              className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${
                videoMode === "file"
                  ? "bg-white text-slate-800 shadow-sm font-medium"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Subir video propio
            </button>
          </div>

          {videoMode === "url" ? (
            <input
              name="videoUrl"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              required
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          ) : (
            <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors ${selectedFile ? "border-blue-400 bg-blue-50/40" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"}`}>
              <svg className={`w-7 h-7 ${selectedFile ? "text-blue-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {selectedFile ? (
                <span className="text-sm text-blue-700 font-medium text-center break-all px-2">{selectedFile}</span>
              ) : (
                <>
                  <span className="text-sm text-slate-500">Hacé clic para seleccionar un video</span>
                  <span className="text-xs text-slate-400">MP4, MOV, WebM</span>
                </>
              )}
              <input
                name="videoFile"
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={(e) => setSelectedFile(e.target.files?.[0]?.name ?? null)}
              />
            </label>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            Ejercicio guardado correctamente.
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="self-start bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {uploading ? "Subiendo video..." : isPending ? "Guardando..." : "Guardar ejercicio"}
        </button>
      </form>
    </div>
  );
}
