"use client";

import { useRef, useState, useTransition } from "react";
import { createJugador } from "@/app/(main)/jugadores/actions";

export default function JugadorForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const nombre = String(formData.get("nombre") ?? "").trim();
    const apellido = String(formData.get("apellido") ?? "").trim();
    if (!nombre || !apellido) {
      setError("Completá nombre y apellido.");
      return;
    }
    startTransition(async () => {
      try {
        await createJugador(formData);
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
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Agregar jugador/a</h2>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="nombre" className="text-sm font-medium text-slate-700">Nombre</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ej: María"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="apellido" className="text-sm font-medium text-slate-700">Apellido</label>
            <input
              id="apellido"
              name="apellido"
              type="text"
              placeholder="Ej: García"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">Jugador/a guardado/a correctamente.</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="self-start bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando..." : "Agregar jugador/a"}
        </button>
      </form>
    </div>
  );
}
