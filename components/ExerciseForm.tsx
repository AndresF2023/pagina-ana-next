"use client";

import { useRef, useState, useTransition } from "react";
import { createExercise } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import { CATEGORIES } from "@/lib/types";

type MediaMode = "video" | "photos" | "none";
type VideoMode = "url" | "file";

const MAX_VIDEO_MB = 200;
const MAX_VIDEO_SIZE = MAX_VIDEO_MB * 1024 * 1024;
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_SIZE = MAX_IMAGE_MB * 1024 * 1024;
const MAX_PHOTOS = 5;

export default function ExerciseForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const [mediaMode, setMediaMode] = useState<MediaMode>("video");
  const [videoMode, setVideoMode] = useState<VideoMode>("url");
  const [selectedVideoFile, setSelectedVideoFile] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > MAX_PHOTOS) {
      setError(`Podés subir hasta ${MAX_PHOTOS} fotos por ejercicio.`);
      return;
    }
    for (const f of files) {
      if (f.size > MAX_IMAGE_SIZE) {
        setError(`Cada foto no puede superar los ${MAX_IMAGE_MB} MB.`);
        return;
      }
    }
    setError(null);
    setSelectedImages(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  }

  function removeImage(index: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function resetMedia() {
    setSelectedVideoFile(null);
    setSelectedImages([]);
    setImagePreviews([]);
    setVideoMode("url");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!title || !description) {
      setError("Completá el nombre y la descripción.");
      return;
    }

    const supabase = createClient();

    // Subir video si corresponde
    if (mediaMode === "video") {
      if (videoMode === "file") {
        const file = formData.get("videoFile") as File | null;
        if (!file || file.size === 0) {
          setError("Seleccioná un archivo de video.");
          return;
        }
        if (file.size > MAX_VIDEO_SIZE) {
          setError(`El video no puede superar los ${MAX_VIDEO_MB} MB.`);
          return;
        }
        setUploading(true);
        try {
          const ext = file.name.split(".").pop() ?? "mp4";
          const filename = `video-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("videos")
            .upload(filename, file, { contentType: file.type });
          if (uploadError) throw new Error(`Error al subir el video: ${uploadError.message}`);
          const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(filename);
          formData.set("videoUrl", publicUrl);
          formData.delete("videoFile");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error al subir el video.");
          setUploading(false);
          return;
        }
        setUploading(false);
      }
      // videoUrl ya viene del input si es modo URL
      formData.set("imageUrls", "[]");
    }

    // Subir fotos si corresponde
    if (mediaMode === "photos") {
      if (selectedImages.length === 0) {
        setError("Seleccioná al menos una foto.");
        return;
      }
      setUploading(true);
      try {
        const imageUrls: string[] = [];
        for (const file of selectedImages) {
          const ext = file.name.split(".").pop() ?? "jpg";
          const filename = `img-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("videos")
            .upload(filename, file, { contentType: file.type });
          if (uploadError) throw new Error(`Error al subir foto: ${uploadError.message}`);
          const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(filename);
          imageUrls.push(publicUrl);
        }
        formData.set("imageUrls", JSON.stringify(imageUrls));
        formData.set("videoUrl", "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir las fotos.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Sin multimedia
    if (mediaMode === "none") {
      formData.set("videoUrl", "");
      formData.set("imageUrls", "[]");
    }

    startTransition(async () => {
      try {
        await createExercise(formData);
        formRef.current?.reset();
        resetMedia();
        setMediaMode("video");
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
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Agregar ejercicio</h2>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

        {/* Nombre */}
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">Nombre</label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="Ej: Saque con objetivo"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
          />
        </div>

        {/* Descripción */}
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">Descripción</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="¿Qué se trabaja en este ejercicio?"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 resize-none"
          />
        </div>

        {/* Categoría */}
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-sm font-medium text-slate-700">Categoría</label>
          <select
            id="category"
            name="category"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white"
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Tipo de contenido multimedia */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Contenido</span>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            {(["video", "photos", "none"] as MediaMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setMediaMode(mode); resetMedia(); }}
                className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${
                  mediaMode === mode
                    ? "bg-white text-slate-800 shadow-sm font-medium"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {mode === "video" ? "Video" : mode === "photos" ? "Fotos" : "Solo texto"}
              </button>
            ))}
          </div>

          {/* Video */}
          {mediaMode === "video" && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 p-1 bg-slate-50 border border-slate-100 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => { setVideoMode("url"); setSelectedVideoFile(null); }}
                  className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                    videoMode === "url"
                      ? "bg-white text-slate-800 shadow-sm font-medium"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  YouTube / Vimeo
                </button>
                <button
                  type="button"
                  onClick={() => { setVideoMode("file"); setSelectedVideoFile(null); }}
                  className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                    videoMode === "file"
                      ? "bg-white text-slate-800 shadow-sm font-medium"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Subir archivo
                </button>
              </div>

              {videoMode === "url" ? (
                <input
                  name="videoUrl"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                />
              ) : (
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors ${selectedVideoFile ? "border-sky-400 bg-sky-50/40" : "border-slate-200 hover:border-sky-400 hover:bg-sky-50/40"}`}>
                  <svg className={`w-7 h-7 ${selectedVideoFile ? "text-sky-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  {selectedVideoFile ? (
                    <span className="text-sm text-sky-700 font-medium text-center break-all px-2">{selectedVideoFile}</span>
                  ) : (
                    <>
                      <span className="text-sm text-slate-500">Hacé clic para seleccionar un video</span>
                      <span className="text-xs text-slate-400">MP4, MOV, WebM · máx {MAX_VIDEO_MB} MB</span>
                    </>
                  )}
                  <input
                    name="videoFile"
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    onChange={(e) => setSelectedVideoFile(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
              )}
            </div>
          )}

          {/* Fotos */}
          {mediaMode === "photos" && (
            <div className="flex flex-col gap-3">
              <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors ${selectedImages.length > 0 ? "border-sky-400 bg-sky-50/40" : "border-slate-200 hover:border-sky-400 hover:bg-sky-50/40"}`}>
                <svg className={`w-7 h-7 ${selectedImages.length > 0 ? "text-sky-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 3h18" />
                </svg>
                <span className="text-sm text-slate-500">Hacé clic para seleccionar fotos</span>
                <span className="text-xs text-slate-400">JPG, PNG, WebP · máx {MAX_IMAGE_MB} MB por foto · hasta {MAX_PHOTOS} fotos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleImageSelect}
                />
              </label>

              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Solo texto */}
          {mediaMode === "none" && (
            <p className="text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl px-4 py-3">
              Este ejercicio se guardará solo con texto, sin multimedia.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            Ejercicio guardado correctamente.
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="self-start bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {uploading ? "Subiendo..." : isPending ? "Guardando..." : "Guardar ejercicio"}
        </button>
      </form>
    </div>
  );
}
