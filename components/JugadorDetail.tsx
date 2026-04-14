"use client";

import { useRef, useState, useTransition } from "react";
import { updateJugador, addTorneo, deleteTorneo } from "@/app/(main)/jugadores/actions";
import type { Jugador, Torneo } from "@/lib/types";

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export default function JugadorDetail({ jugador, torneos }: { jugador: Jugador; torneos: Torneo[] }) {
  const [torneoList, setTorneoList] = useState(torneos);
  const [torneoError, setTorneoError] = useState<string | null>(null);
  const [perfilSaved, setPerfilSaved] = useState(false);
  const [correccionesSaved, setCorreccionesSaved] = useState(false);
  const [isPendingTorneo, startTorneoTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const torneoFormRef = useRef<HTMLFormElement>(null);

  const debouncedSavePerfil = useRef(
    debounce((value: string) => {
      updateJugador(jugador.id, "perfil", value).then(() => {
        setPerfilSaved(true);
        setTimeout(() => setPerfilSaved(false), 2000);
      });
    }, 450)
  ).current;

  const debouncedSaveCorrecciones = useRef(
    debounce((value: string) => {
      updateJugador(jugador.id, "correcciones_tecnicas", value).then(() => {
        setCorreccionesSaved(true);
        setTimeout(() => setCorreccionesSaved(false), 2000);
      });
    }, 450)
  ).current;

  function handleAddTorneo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTorneoError(null);
    const formData = new FormData(e.currentTarget);
    const nombre = String(formData.get("nombre") ?? "").trim();
    const fecha = String(formData.get("fecha") ?? "").trim();
    if (!nombre || !fecha) {
      setTorneoError("Completá nombre y fecha del torneo.");
      return;
    }
    startTorneoTransition(async () => {
      try {
        await addTorneo(jugador.id, formData);
        torneoFormRef.current?.reset();
        // Refresh list optimistically
        const lugar = String(formData.get("lugar") ?? "").trim();
        setTorneoList((prev) => [
          ...prev,
          { id: Date.now().toString(), jugador_id: jugador.id, nombre, fecha, lugar, created_at: new Date().toISOString() },
        ].sort((a, b) => a.fecha.localeCompare(b.fecha)));
      } catch (err) {
        setTorneoError(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  function handleDeleteTorneo(id: string) {
    startDeleteTransition(async () => {
      await deleteTorneo(id, jugador.id);
      setTorneoList((prev) => prev.filter((t) => t.id !== id));
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Perfil */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800">Perfil del jugador/a</h2>
          {perfilSaved && <span className="text-xs text-green-600">Guardado</span>}
        </div>
        <textarea
          defaultValue={jugador.perfil}
          rows={4}
          placeholder="Descripción general del jugador/a, estilo de juego, nivel..."
          onChange={(e) => debouncedSavePerfil(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 resize-none"
        />
      </div>

      {/* Correcciones técnicas */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800">Correcciones técnicas</h2>
          {correccionesSaved && <span className="text-xs text-green-600">Guardado</span>}
        </div>
        <textarea
          defaultValue={jugador.correcciones_tecnicas}
          rows={4}
          placeholder="Aspectos técnicos a trabajar, correcciones pendientes..."
          onChange={(e) => debouncedSaveCorrecciones(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 resize-none"
        />
      </div>

      {/* Calendario de torneos */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Calendario de torneos</h2>

        {/* Formulario agregar torneo */}
        <form ref={torneoFormRef} onSubmit={handleAddTorneo} noValidate className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-slate-700">Torneo</label>
              <input
                name="nombre"
                type="text"
                placeholder="Ej: Torneo Nacional"
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Fecha</label>
              <input
                name="fecha"
                type="date"
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-slate-700">Lugar (opcional)</label>
              <input
                name="lugar"
                type="text"
                placeholder="Ej: Buenos Aires"
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>
          </div>
          {torneoError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{torneoError}</p>
          )}
          <button
            type="submit"
            disabled={isPendingTorneo}
            className="self-start bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isPendingTorneo ? "Guardando..." : "Agregar torneo"}
          </button>
        </form>

        {/* Lista de torneos */}
        {torneoList.length === 0 ? (
          <p className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-xl py-6">
            Sin torneos cargados todavía.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {torneoList.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(t.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    {t.lugar && ` · ${t.lugar}`}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPendingDelete}
                  onClick={() => handleDeleteTorneo(t.id)}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
