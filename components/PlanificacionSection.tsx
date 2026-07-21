"use client";

import { useRef, useState, useTransition } from "react";
import { createPlanificacion, deletePlanificacion } from "@/app/(main)/planificacion/actions";
import type { Exercise, Planificacion, TipoPlanificacion } from "@/lib/types";
import { TIPOS_PLANIFICACION } from "@/lib/types";
import { getEmbedUrl, getYouTubeThumbnail, isDirectVideo } from "@/lib/video";

const LABELS: Record<TipoPlanificacion, string> = {
  diaria: "Diaria",
  semanal: "Semanal",
  mensual: "Mensual",
};

const TIPO_DOT: Record<TipoPlanificacion, string> = {
  diaria: "bg-sky-500",
  semanal: "bg-violet-500",
  mensual: "bg-emerald-500",
};

const TIPO_BADGE: Record<TipoPlanificacion, string> = {
  diaria: "bg-sky-50 text-sky-700 border-sky-100",
  semanal: "bg-violet-50 text-violet-700 border-violet-100",
  mensual: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

type Vista = "lista" | "calendario";

// ── Ejercicio inline (read-only) ───────────────────────────────────────────────
function EjercicioPreview({ exercise }: { exercise: Exercise }) {
  const [expanded, setExpanded] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const embedUrl = getEmbedUrl(exercise.videoUrl);
  const thumbnailUrl = getYouTubeThumbnail(exercise.videoUrl);
  const directVideo = isDirectVideo(exercise.videoUrl);
  const hasVideo = !!exercise.videoUrl;
  const hasPhotos = exercise.imageUrls && exercise.imageUrls.length > 0;

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      {/* Cabecera siempre visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {exercise.category && (
            <span className="shrink-0 text-xs font-medium bg-sky-50 text-sky-600 border border-sky-100 rounded-full px-2 py-0.5">
              {exercise.category}
            </span>
          )}
          <span className="text-sm font-medium text-slate-700 truncate">{exercise.title}</span>
        </div>
        <svg
          className={`shrink-0 w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Contenido expandido */}
      {expanded && (
        <div className="border-t border-slate-100">
          {/* Video */}
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
              ) : null}
            </div>
          )}

          {/* Fotos (solo si no hay video) */}
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
                    onClick={(e) => { e.stopPropagation(); setPhotoIndex((i) => (i - 1 + exercise.imageUrls.length) % exercise.imageUrls.length); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                  >‹</button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPhotoIndex((i) => (i + 1) % exercise.imageUrls.length); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                  >›</button>
                  <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                    {photoIndex + 1} / {exercise.imageUrls.length}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Descripción y notas */}
          <div className="px-4 py-3 flex flex-col gap-2">
            {exercise.description && (
              <p className="text-sm text-slate-600">{exercise.description}</p>
            )}
            {exercise.notes && (
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-slate-500 mb-1">Indicaciones</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{exercise.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ejercicios adjuntos en un plan ─────────────────────────────────────────────
function EjerciciosAdjuntos({ ids, ejercicios }: { ids: string[]; ejercicios: Exercise[] }) {
  const adjuntos = ids.map((id) => ejercicios.find((e) => e.id === id)).filter(Boolean) as Exercise[];
  if (adjuntos.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Ejercicios adjuntos ({adjuntos.length})
      </p>
      <div className="flex flex-col gap-1.5">
        {adjuntos.map((ex) => (
          <EjercicioPreview key={ex.id} exercise={ex} />
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function PlanificacionSection({
  inicial,
  ejercicios,
}: {
  inicial: Planificacion[];
  ejercicios: Exercise[];
}) {
  const [planes, setPlanes] = useState(inicial);
  const [tipo, setTipo] = useState<TipoPlanificacion>("diaria");
  const [vista, setVista] = useState<Vista>("lista");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Estado del picker de ejercicios
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [ejercicioSearch, setEjercicioSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // Estado del calendario
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const planesFiltrados = planes.filter((p) => p.tipo === tipo);

  const filteredPicker = ejercicios.filter((ex) => {
    const q = ejercicioSearch.toLowerCase();
    return (
      ex.title.toLowerCase().includes(q) ||
      (ex.category ?? "").toLowerCase().includes(q)
    );
  });

  function toggleEjercicio(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

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
        const tipoForm = String(formData.get("tipo") ?? "diaria") as TipoPlanificacion;
        setPlanes((prev) => [
          {
            id: Date.now().toString(),
            tipo: tipoForm,
            titulo,
            fecha,
            contenido,
            ejercicio_ids: [...selectedIds],
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        formRef.current?.reset();
        setSelectedIds([]);
        setEjercicioSearch("");
        setShowPicker(false);
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
      setDiaSeleccionado(null);
    });
  }

  // ── Lógica del calendario ──────────────────────────────────────────────────
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function toDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function planesEnDia(day: number) {
    return planes.filter((p) => p.fecha === toDateStr(day));
  }

  const planesDiaSeleccionado = diaSeleccionado
    ? planes.filter((p) => p.fecha === diaSeleccionado)
    : [];

  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-8">

      {/* ── Formulario ── */}
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

          {/* ── Selector de ejercicios ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Ejercicios de la biblioteca
                {selectedIds.length > 0 && (
                  <span className="ml-2 text-xs font-semibold bg-sky-100 text-sky-700 rounded-full px-2 py-0.5">
                    {selectedIds.length} seleccionado{selectedIds.length > 1 ? "s" : ""}
                  </span>
                )}
              </label>
              {ejercicios.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPicker((v) => !v)}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium cursor-pointer"
                >
                  {showPicker ? "Cerrar ▲" : "Seleccionar ▼"}
                </button>
              )}
            </div>

            {/* Chips de ejercicios seleccionados */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedIds.map((id) => {
                  const ex = ejercicios.find((e) => e.id === id);
                  if (!ex) return null;
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1 text-xs bg-sky-50 text-sky-700 border border-sky-100 rounded-full px-2.5 py-1"
                    >
                      {ex.title}
                      <button
                        type="button"
                        onClick={() => setSelectedIds((prev) => prev.filter((i) => i !== id))}
                        className="ml-0.5 text-sky-400 hover:text-sky-700 cursor-pointer leading-none"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Panel de búsqueda */}
            {showPicker && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o categoría..."
                    value={ejercicioSearch}
                    onChange={(e) => setEjercicioSearch(e.target.value)}
                    className="w-full text-sm bg-transparent placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {filteredPicker.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">Sin resultados.</p>
                  ) : (
                    filteredPicker.map((ex) => {
                      const isSelected = selectedIds.includes(ex.id);
                      return (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => toggleEjercicio(ex.id)}
                          className={`w-full text-left flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer ${
                            isSelected ? "bg-sky-50 hover:bg-sky-100" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {ex.category && (
                              <span className="shrink-0 text-xs text-sky-500 font-medium">{ex.category}</span>
                            )}
                            <span className="text-sm text-slate-700 truncate">{ex.title}</span>
                          </div>
                          <span
                            className={`shrink-0 ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-sky-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isSelected ? "✓ Adjunto" : "+ Adjuntar"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <input type="hidden" name="ejercicio_ids" value={JSON.stringify(selectedIds)} />
          </div>

          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">Planificación guardada correctamente.</p>}

          <button
            type="submit"
            disabled={isPending}
            className="self-start bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? "Guardando..." : "Guardar planificación"}
          </button>
        </form>
      </div>

      {/* ── Toggle vista ── */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          {vista === "lista" && (
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              {TIPOS_PLANIFICACION.map((t) => (
                <button key={t} type="button" onClick={() => setTipo(t)}
                  className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${tipo === t ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
                  {LABELS[t]}
                </button>
              ))}
            </div>
          )}
          {vista === "calendario" && <div />}

          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            <button type="button" onClick={() => setVista("lista")}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${vista === "lista" ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Lista
            </button>
            <button type="button" onClick={() => setVista("calendario")}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${vista === "calendario" ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendario
            </button>
          </div>
        </div>

        {/* ── Vista Lista ── */}
        {vista === "lista" && (
          planesFiltrados.length === 0 ? (
            <p className="text-slate-400 border border-dashed border-slate-200 rounded-2xl px-5 py-8 text-center text-sm">
              No hay planificaciones {LABELS[tipo].toLowerCase()}s todavía.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {planesFiltrados.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${TIPO_BADGE[p.tipo]}`}>{LABELS[p.tipo]}</span>
                        <p className="font-semibold text-slate-800">{p.titulo}</p>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(p.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <button type="button" disabled={isPendingDelete} onClick={() => handleDelete(p.id)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50 whitespace-nowrap">
                      Eliminar
                    </button>
                  </div>
                  {p.contenido && <p className="text-sm text-slate-600 whitespace-pre-wrap">{p.contenido}</p>}
                  <EjerciciosAdjuntos ids={p.ejercicio_ids ?? []} ejercicios={ejercicios} />
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Vista Calendario ── */}
        {vista === "calendario" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Navegación de mes */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <button type="button" onClick={() => { setCalendarDate(new Date(year, month - 1, 1)); setDiaSeleccionado(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-600">
                  ‹
                </button>
                <h3 className="text-sm font-semibold text-slate-800">{MESES[month]} {year}</h3>
                <button type="button" onClick={() => { setCalendarDate(new Date(year, month + 1, 1)); setDiaSeleccionado(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-600">
                  ›
                </button>
              </div>

              {/* Cabecera días */}
              <div className="grid grid-cols-7 border-b border-slate-100">
                {DIAS.map((d) => (
                  <div key={d} className="py-2 text-center text-xs font-medium text-slate-400">{d}</div>
                ))}
              </div>

              {/* Grilla días */}
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  if (!day) return <div key={i} className="min-h-[64px] border-b border-r border-slate-50 last:border-r-0" />;

                  const dateStr = toDateStr(day);
                  const dayPlanes = planesEnDia(day);
                  const isHoy = dateStr === hoyStr;
                  const isSelected = dateStr === diaSeleccionado;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDiaSeleccionado(isSelected ? null : dateStr)}
                      className={`min-h-[64px] p-1.5 border-b border-r border-slate-100 last:border-r-0 text-left transition-colors cursor-pointer flex flex-col gap-1
                        ${isSelected ? "bg-sky-50" : "hover:bg-slate-50"}`}
                    >
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                        ${isHoy ? "bg-sky-600 text-white" : "text-slate-700"}`}>
                        {day}
                      </span>
                      <div className="flex flex-col gap-0.5 w-full">
                        {dayPlanes.slice(0, 2).map((p) => (
                          <span key={p.id} className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate font-medium
                            ${TIPO_BADGE[p.tipo]}`}>
                            {p.titulo}
                          </span>
                        ))}
                        {dayPlanes.length > 2 && (
                          <span className="text-[10px] text-slate-400 px-1">+{dayPlanes.length - 2} más</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="flex gap-4 px-5 py-3 border-t border-slate-100">
                {TIPOS_PLANIFICACION.map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${TIPO_DOT[t]}`} />
                    <span className="text-xs text-slate-500">{LABELS[t]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel del día seleccionado */}
            {diaSeleccionado && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">
                  {new Date(diaSeleccionado + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </h4>
                {planesDiaSeleccionado.length === 0 ? (
                  <p className="text-slate-400 text-sm">Sin planificaciones para este día.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {planesDiaSeleccionado.map((p) => (
                      <div key={p.id} className="border border-slate-100 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TIPO_BADGE[p.tipo]}`}>{LABELS[p.tipo]}</span>
                            <p className="font-semibold text-slate-800 text-sm">{p.titulo}</p>
                          </div>
                          <button type="button" disabled={isPendingDelete} onClick={() => handleDelete(p.id)}
                            className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0">
                            Eliminar
                          </button>
                        </div>
                        {p.contenido && <p className="text-sm text-slate-600 whitespace-pre-wrap mt-2">{p.contenido}</p>}
                        <EjerciciosAdjuntos ids={p.ejercicio_ids ?? []} ejercicios={ejercicios} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
