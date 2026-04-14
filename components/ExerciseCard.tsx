"use client";

import { useCallback, useRef, useTransition } from "react";
import { deleteExercise, updateNotes } from "@/app/actions";
import { getEmbedUrl, getYouTubeThumbnail } from "@/lib/video";
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
  const [isPending, startTransition] = useTransition();
  const embedUrl = getEmbedUrl(exercise.videoUrl);
  const thumbnailUrl = getYouTubeThumbnail(exercise.videoUrl);

  const debouncedSave = useRef(
    debounce((notes: string) => {
      startTransition(() => {
        updateNotes(exercise.id, notes);
      });
    }, 450)
  ).current;

  const handleDelete = useCallback(() => {
    if (!confirm(`¿Eliminar "${exercise.title}"?`)) return;
    startTransition(() => {
      deleteExercise(exercise.id);
    });
  }, [exercise.id, exercise.title]);

  return (
    <article className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Video */}
      <div className="aspect-video bg-black">
        {embedUrl ? (
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
          <img
            src={thumbnailUrl}
            alt={`Miniatura de ${exercise.title}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            Sin vista previa disponible
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">
            {exercise.title}
          </h3>
          <p className="text-slate-500 text-sm">{exercise.description}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Indicaciones para este ejercicio
          </label>
          <textarea
            defaultValue={exercise.notes}
            rows={4}
            placeholder="Ej: Mantener rodillas flexionadas y terminar el golpe arriba"
            onChange={(e) => debouncedSave(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Abrir video ↗
          </a>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ml-auto"
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </article>
  );
}
