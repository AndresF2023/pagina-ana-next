"use client";

import { useRef, useState, useTransition } from "react";
import { createPlanificacion, deletePlanificacion } from "@/app/(main)/planificacion/actions";
import type { Planificacion, TipoPlanificacion } from "@/lib/types";
import { TIPOS_PLANIFICACION } from "@/lib/types";

const LABELS: Record<TipoPlanificacion, string> = {
  diaria: "Diaria",
  semanal: "Semanal",
  mensual: "Mensual",
};

export default function PlanificacionSection({ inicial }: { inicial: Planificacion[] }) {
  const [planes, setPlanes] = useState(inicial);
  const [tipo, setTipo] = useState<TipoPlanificacion>("diaria");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const planesFiltrados = planes.filter((p) => p.tipo === tipo);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const titulo = String(formData.get("titulo") ?? "").trim();
    const fecha = String(formData.get("fecha") ?? "").trim();
    if (!titulo || !fecha) {
      setError("Completá título y fecha.");
      return;
    }
    startTransition(async () => {
      try {
        await createPlanificacion(formData);
        const contenido = String(formData.get("contenido") ?? "").trim();
        setPlanes((prev) => [
          { id: Date.now().toString(), tipo, titulo, fecha, contenido, created_at: new Date().toISOString() },
          ...prev,
        ]);
        formRef.current?.reset();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      await deletePlanificacion(id);
      setPlanes((prev) => prev.filter((p) => p.id !== id));
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Formulario */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Nueva planificación</h2>
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-slate-700">Tipo</label>
              <select
                name="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoPlanificacion)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white"
              >
                {TIPOS_PLANIFICACION.map((t) => (
                  <option key={t} value={t}>{LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-slate-700">Fecha</label>
              <input
                name="fecha"
                type="date"
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Título</label>
            <input
              name="titulo"
              type="text"
              placeholder="Ej: Semana de preparación física"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Contenido</label>
            <textarea
              name="contenido"
              rows={4}
              placeholder="Describí los ejercicios, objetivos y actividades del período..."
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">Planificación guardada correctamente.</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="self-start bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? "Guardando..." : "Guardar planificación"}
          </button>
        </form>
      </div>

      {/* Lista */}
      <section>
        <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl w-fit">
          {TIPOS_PLANIFICACION.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${
                tipo === t
                  ? "bg-white text-slate-800 shadow-sm font-medium"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {LABELS[t]}
            </button>
          ))}
        </div>

        {planesFiltrados.length === 0 ? (
          <p className="text-slate-400 border border-dashed border-slate-200 rounded-2xl px-5 py-8 text-center text-sm">
            No hay planificaciones {LABELS[tipo].toLowerCase()}s todavía.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {planesFiltrados.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{p.titulo}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(p.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isPendingDelete}
                    onClick={() => handleDelete(p.id)}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    Eliminar
                  </button>
                </div>
                {p.contenido && (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{p.contenido}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
