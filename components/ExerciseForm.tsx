"use client";

import { useRef, useState, useTransition } from "react";
import { createExercise } from "@/app/actions";

export default function ExerciseForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createExercise(formData);
        formRef.current?.reset();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Agregar ejercicio
      </h2>
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <label htmlFor="videoUrl" className="text-sm font-medium text-slate-700">
            URL del video (YouTube o Vimeo)
          </label>
          <input
            id="videoUrl"
            name="videoUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            required
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
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
          disabled={isPending}
          className="self-start bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando..." : "Guardar ejercicio"}
        </button>
      </form>
    </div>
  );
}
