"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { deleteExercise, updateNotes, updateExercise } from "@/app/actions";
import { getEmbedUrl, getYouTubeThumbnail, isDirectVideo } from "@/lib/video";
import { CATEGORIES } from "@/lib/types";
import type { Exercise } from "@/lib/types";

interface Props {
  exercise: Exercise;
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export default function ExerciseCard({ exercise }: Props) {
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isNotesPending, startNotesTransition] = useTransition();
  const [isSavePending, startSaveTransition] = useTransition();
  const [notesSaved, setNotesSaved] = useState(false);

  // Estado de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(exercise.title);
  const [editDescription, setEditDescription] = useState(exercise.description);
  const [editCategory, setEditCategory] = useState(exercise.category ?? "");
  const [editError, setEditError] = useState<string | null>(null);

  // Estado para galería de fotos
  const [photoIndex, setPhotoIndex] = useState(0);

  const embedUrl = getEmbedUrl(exercise.videoUrl);
  const thumbnailUrl = getYouTubeThumbnail(exercise.videoUrl);
  const directVideo = isDirectVideo(exercise.videoUrl);
  const hasVideo = !!exercise.videoUrl;
  const hasPhotos = exercise.imageUrls && exercise.imageUrls.length > 0;

  const debouncedSave = useRef(
    debounce((notes: string) => {
      startNotesTransition(async () => {
        await updateNotes(exercise.id, notes);
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      });
    }, 450)
  ).current;

  const handleDelete = useCallback(() => {
    if (!confirm(`¿Eliminar "${exercise.title}"?`)) return;
    startDeleteTransition(() => {
      deleteExercise(exercise.id);
    });
  }, [exercise.id, exercise.title]);

  function handleSaveEdit() {
    if (!editTitle.trim() || !editDescription.trim()) {
      setEditError("Completá el nombre y la descripción.");
      return;
    }
    setEditError(null);
    startSaveTransition(async () => {
      try {
        await updateExercise(exercise.id, editTitle, editDescription, editCategory);
        setIsEditing(false);
      } catch (err) {
        setEditError(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  function handleCancelEdit() {
    setEditTitle(exercise.title);
    setEditDescription(exercise.description);
    setEditCategory(exercise.category ?? "");
    setEditError(null);
    setIsEditing(false);
  }

  return (
    <article className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

      {/* Área multimedia */}
      {hasVideo && (
        <div className="aspect-video bg-black">
          {directVideo ? (
            <video src={exercise.videoUrl} controls className="w-full h-full object-contain" />
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              title={exercise.title}
              loading="lazy"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              className="w-full h-full border-0"
            />
          ) : thumbnailUrl ? (
            <img src={thumbnailUrl} alt={`Miniatura de ${exercise.title}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              Sin vista previa disponible
            </div>
          )}
        </div>
      )}

      {!hasVideo && hasPhotos && (
        <div className="aspect-video bg-slate-100 relative overflow-hidden">
          <img
            src={exercise.imageUrls[photoIndex]}
            alt={`${exercise.title} - foto ${photoIndex + 1}`}
            className="w-full h-full object-cover"
          />
          {exercise.imageUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setPhotoIndex((i) => (i - 1 + exercise.imageUrls.length) % exercise.imageUrls.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setPhotoIndex((i) => (i + 1) % exercise.imageUrls.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                ›
              </button>
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                {photoIndex + 1} / {exercise.imageUrls.length}
              </span>
            </>
          )}
        </div>
      )}

      {/* Contenido */}
      <div className="p-5 flex flex-col gap-3">

        {isEditing ? (
          /* Modo edición */
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Nombre</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Descripción</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Categoría</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white"
              >
                <option value="">Sin categoría</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {editError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{editError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavePending}
                className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium px-4 py-1.5 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isSavePending ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-sm text-slate-500 hover:text-slate-700 px-4 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* Vista normal */
          <div>
            {(exercise.category ?? editCategory) && (
              <span className="inline-block text-xs font-medium bg-sky-50 text-sky-600 border border-sky-100 rounded-full px-2.5 py-0.5 mb-2">
                {exercise.category}
              </span>
            )}
            <h3 className="font-semibold text-slate-800 text-base mb-1">{exercise.title}</h3>
            <p className="text-slate-500 text-sm">{exercise.description}</p>
          </div>
        )}

        {/* Indicaciones (siempre visibles, autosave) */}
        {!isEditing && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Indicaciones</label>
              {isNotesPending && <span className="text-xs text-slate-400">Guardando...</span>}
              {notesSaved && !isNotesPending && <span className="text-xs text-green-600">Guardado</span>}
            </div>
            <textarea
              defaultValue={exercise.notes}
              rows={4}
              placeholder="Ej: Mantener rodillas flexionadas y terminar el golpe arriba"
              onChange={(e) => debouncedSave(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 resize-none"
            />
          </div>
        )}

        {/* Acciones */}
        {!isEditing && (
          <div className="flex items-center gap-3 flex-wrap">
            {hasVideo && (
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-600 hover:text-sky-700 hover:underline"
              >
                Abrir video ↗
              </a>
            )}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm text-slate-600 hover:text-slate-800 hover:underline cursor-pointer"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeletePending}
              className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ml-auto"
            >
              {isDeletePending ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
