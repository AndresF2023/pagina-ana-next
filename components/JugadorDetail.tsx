"use client";

import { useRef, useState, useTransition } from "react";
import {
  updateJugador,
  addTorneo, deleteTorneo,
  addEvaluacion, deleteEvaluacion,
  addAsistencia, deleteAsistencia,
  addBienestar, deleteBienestar,
  createPlayerAccount, deletePlayerAccount,
} from "@/app/(main)/jugadores/actions";
import { createClient } from "@/utils/supabase/client";
import { CATEGORIES } from "@/lib/types";
import type { Jugador, Torneo, Evaluacion, Asistencia, EstadoAsistencia, Bienestar } from "@/lib/types";

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function formatFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

const ESTADO_STYLES: Record<EstadoAsistencia, string> = {
  presente:    "bg-green-100 text-green-700",
  ausente:     "bg-red-100 text-red-700",
  tarde:       "bg-amber-100 text-amber-700",
  competencia: "bg-blue-100 text-blue-700",
};

const ESTADO_LABELS: Record<EstadoAsistencia, string> = {
  presente:    "Presente",
  ausente:     "Ausente",
  tarde:       "Tarde",
  competencia: "Competencia",
};

// tipo "inverso": 1=bien (verde), 10=mal (rojo) — fatiga, dolor
// tipo "normal": 1=mal (rojo), 10=bien (verde) — sueño, ánimo
function colorMetrica(v: number, tipo: "inverso" | "normal") {
  const bajo = v <= 3; const medio = v <= 6;
  if (tipo === "inverso") {
    if (bajo) return "bg-green-100 text-green-700 border-green-200";
    if (medio) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  }
  if (bajo) return "bg-red-100 text-red-700 border-red-200";
  if (medio) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-green-100 text-green-700 border-green-200";
}

function btnColorMetrica(v: number, tipo: "inverso" | "normal") {
  const bajo = v <= 3; const medio = v <= 6;
  if (tipo === "inverso") {
    if (bajo) return "bg-green-50 text-green-600 border-green-200 hover:bg-green-100";
    if (medio) return "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100";
    return "bg-red-50 text-red-600 border-red-200 hover:bg-red-100";
  }
  if (bajo) return "bg-red-50 text-red-600 border-red-200 hover:bg-red-100";
  if (medio) return "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100";
  return "bg-green-50 text-green-600 border-green-200 hover:bg-green-100";
}

function MetricaBotones({ label, desc, value, onChange, tipo }: {
  label: string; desc: string; value: number | null;
  onChange: (v: number) => void; tipo: "inverso" | "normal";
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <div className="flex gap-1 flex-wrap">
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
              value === n ? "bg-sky-600 text-white border-sky-600" : btnColorMetrica(n, tipo)
            }`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Helpers calendario ────────────────────────────────────────────────────
const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_ES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const HOY_STR = new Date().toISOString().slice(0, 10);

function buildCells(year: number, month: number): (number | null)[] {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function mkDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function JugadorDetail({
  jugador, torneos, evaluaciones, asistencias, bienestar, isStaff, seccion,
}: {
  jugador: Jugador;
  torneos: Torneo[];
  evaluaciones: Evaluacion[];
  asistencias: Asistencia[];
  bienestar: Bienestar[];
  isStaff: boolean;
  seccion?: string;
}) {
  // Cuando hay una sección activa y el usuario es jugador, solo se muestra esa sección
  const mostrar = (id: string) => isStaff || !seccion || seccion === id;
  // ── Torneos ──────────────────────────────────────────────────────────────
  const [torneoList, setTorneoList] = useState(torneos);
  const [torneoError, setTorneoError] = useState<string | null>(null);
  const [isPendingTorneo, startTorneoTransition] = useTransition();
  const [isPendingDeleteTorneo, startDeleteTorneoTransition] = useTransition();
  const torneoFormRef = useRef<HTMLFormElement>(null);
  const [vistaTorneo, setVistaTorneo] = useState<"lista" | "calendario">("lista");
  const [calTorneoDate, setCalTorneoDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [diaTorneoSel, setDiaTorneoSel] = useState<string | null>(null);

  // ── Autosave campos ───────────────────────────────────────────────────────
  const [perfilSaved, setPerfilSaved] = useState(false);
  const [correccionesSaved, setCorreccionesSaved] = useState(false);
  const [objetivosSaved, setObjetivosSaved] = useState(false);
  const [modelosSaved, setModelosSaved] = useState(false);
  const [identidadConceptualSaved, setIdentidadConceptualSaved] = useState(false);
  const [identidadEjecutoriaSaved, setIdentidadEjecutoriaSaved] = useState(false);
  const [estiloCaracteristicasSaved, setEstiloCaracteristicasSaved] = useState(false);
  const [estiloPatronesSaved, setEstiloPatronesSaved] = useState(false);

  const debouncedSavePerfil = useRef(debounce((v: string) => {
    updateJugador(jugador.id, "perfil", v).then(() => { setPerfilSaved(true); setTimeout(() => setPerfilSaved(false), 2000); });
  }, 450)).current;

  const debouncedSaveCorrecciones = useRef(debounce((v: string) => {
    updateJugador(jugador.id, "correcciones_tecnicas", v).then(() => { setCorreccionesSaved(true); setTimeout(() => setCorreccionesSaved(false), 2000); });
  }, 450)).current;

  const debouncedSaveObjetivos = useRef(debounce((v: string) => {
    updateJugador(jugador.id, "objetivos", v).then(() => { setObjetivosSaved(true); setTimeout(() => setObjetivosSaved(false), 2000); });
  }, 450)).current;

  const debouncedSaveModelos = useRef(debounce((v: string) => {
    updateJugador(jugador.id, "modelos_a_seguir", v).then(() => { setModelosSaved(true); setTimeout(() => setModelosSaved(false), 2000); });
  }, 450)).current;

  const debouncedSaveIdentidadConceptual = useRef(debounce((v: string) => {
    updateJugador(jugador.id, "identidad_conceptual", v).then(() => { setIdentidadConceptualSaved(true); setTimeout(() => setIdentidadConceptualSaved(false), 2000); });
  }, 450)).current;

  const debouncedSaveIdentidadEjecutoria = useRef(debounce((v: string) => {
    updateJugador(jugador.id, "identidad_ejecutoria", v).then(() => { setIdentidadEjecutoriaSaved(true); setTimeout(() => setIdentidadEjecutoriaSaved(false), 2000); });
  }, 450)).current;

  const debouncedSaveEstiloCaracteristicas = useRef(debounce((v: string) => {
    updateJugador(jugador.id, "estilo_caracteristicas", v).then(() => { setEstiloCaracteristicasSaved(true); setTimeout(() => setEstiloCaracteristicasSaved(false), 2000); });
  }, 450)).current;

  const debouncedSaveEstiloPatrones = useRef(debounce((v: string) => {
    updateJugador(jugador.id, "estilo_patrones", v).then(() => { setEstiloPatronesSaved(true); setTimeout(() => setEstiloPatronesSaved(false), 2000); });
  }, 450)).current;

  // ── Evaluaciones ──────────────────────────────────────────────────────────
  const [evalList, setEvalList] = useState(evaluaciones);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [isPendingEval, startEvalTransition] = useTransition();
  const [isPendingDeleteEval, startDeleteEvalTransition] = useTransition();
  const [selectedPdfName, setSelectedPdfName] = useState<string | null>(null);
  const evalFormRef = useRef<HTMLFormElement>(null);

  async function handleAddEvaluacion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEvalError(null);
    const formData = new FormData(e.currentTarget);
    const nombre = String(formData.get("nombre") ?? "").trim();
    const fecha = String(formData.get("fecha") ?? "").trim();
    const file = formData.get("pdfFile") as File | null;

    if (!nombre || !fecha) { setEvalError("Completá el nombre y la fecha."); return; }
    if (!file || file.size === 0) { setEvalError("Seleccioná un archivo PDF."); return; }
    if (file.size > 20 * 1024 * 1024) { setEvalError("El PDF no puede superar los 20 MB."); return; }

    setUploadingPdf(true);
    try {
      const supabase = createClient();
      const filename = `eval-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(filename, file, { contentType: "application/pdf" });
      if (uploadError) throw new Error(`Error al subir el PDF: ${uploadError.message}`);
      const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(filename);
      setUploadingPdf(false);

      startEvalTransition(async () => {
        try {
          await addEvaluacion(jugador.id, nombre, fecha, publicUrl);
          evalFormRef.current?.reset();
          setSelectedPdfName(null);
          setEvalList(prev => [{ id: Date.now().toString(), jugador_id: jugador.id, nombre, fecha, pdf_url: publicUrl, created_at: new Date().toISOString() }, ...prev]);
        } catch (err) {
          setEvalError(err instanceof Error ? err.message : "Error al guardar.");
        }
      });
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : "Error al subir el PDF.");
      setUploadingPdf(false);
    }
  }

  function handleDeleteEval(id: string) {
    startDeleteEvalTransition(async () => {
      await deleteEvaluacion(id, jugador.id);
      setEvalList(prev => prev.filter(e => e.id !== id));
    });
  }

  // ── Asistencias ───────────────────────────────────────────────────────────
  const [asistenciaList, setAsistenciaList] = useState(asistencias);
  const [asistenciaError, setAsistenciaError] = useState<string | null>(null);
  const [isPendingAsistencia, startAsistenciaTransition] = useTransition();
  const [isPendingDeleteAsistencia, startDeleteAsistenciaTransition] = useTransition();
  const asistenciaFormRef = useRef<HTMLFormElement>(null);
  const [vistaAsistencia, setVistaAsistencia] = useState<"lista" | "calendario">("lista");
  const [calAsistenciaDate, setCalAsistenciaDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [diaAsistenciaSel, setDiaAsistenciaSel] = useState<string | null>(null);

  function handleAddAsistencia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAsistenciaError(null);
    const formData = new FormData(e.currentTarget);
    const fecha = String(formData.get("fecha") ?? "").trim();
    const estado = String(formData.get("estado") ?? "presente") as EstadoAsistencia;
    const nota = String(formData.get("nota") ?? "").trim();

    if (!fecha) { setAsistenciaError("Seleccioná una fecha."); return; }

    startAsistenciaTransition(async () => {
      try {
        await addAsistencia(jugador.id, fecha, estado, nota);
        asistenciaFormRef.current?.reset();
        setAsistenciaList(prev => [{ id: Date.now().toString(), jugador_id: jugador.id, fecha, estado, nota, created_at: new Date().toISOString() }, ...prev]);
      } catch (err) {
        setAsistenciaError(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  function handleDeleteAsistencia(id: string) {
    startDeleteAsistenciaTransition(async () => {
      await deleteAsistencia(id, jugador.id);
      setAsistenciaList(prev => prev.filter(a => a.id !== id));
    });
  }

  // ── Bienestar subjetivo ───────────────────────────────────────────────────
  const [bienestarList, setBienestarList] = useState(bienestar);
  const [bienestarError, setBienestarError] = useState<string | null>(null);
  const [bFatiga, setBFatiga] = useState<number | null>(null);
  const [bDolor, setBDolor] = useState<number | null>(null);
  const [bSueno, setBSueno] = useState<number | null>(null);
  const [bAnimico, setBAnimico] = useState<number | null>(null);
  const [isPendingBienestar, startBienestarTransition] = useTransition();
  const [isPendingDeleteBienestar, startDeleteBienestarTransition] = useTransition();
  const bienestarFormRef = useRef<HTMLFormElement>(null);

  function handleAddBienestar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBienestarError(null);
    const formData = new FormData(e.currentTarget);
    const fecha = String(formData.get("fecha") ?? "").trim();
    const nota_dolor = String(formData.get("nota_dolor") ?? "").trim();
    const nota_sueno = String(formData.get("nota_sueno") ?? "").trim();

    if (!fecha) { setBienestarError("Seleccioná una fecha."); return; }
    if (!bFatiga) { setBienestarError("Indicá tu nivel de fatiga."); return; }
    if (!bDolor) { setBienestarError("Indicá tu nivel de dolor muscular."); return; }
    if (!bSueno) { setBienestarError("Indicá la calidad de tu sueño."); return; }
    if (!bAnimico) { setBienestarError("Indicá tu estado anímico."); return; }

    startBienestarTransition(async () => {
      try {
        await addBienestar(jugador.id, fecha, bFatiga, bDolor, nota_dolor, bSueno, nota_sueno, bAnimico);
        bienestarFormRef.current?.reset();
        setBFatiga(null); setBDolor(null); setBSueno(null); setBAnimico(null);
        setBienestarList(prev => [{
          id: Date.now().toString(),
          jugador_id: jugador.id,
          fecha,
          valor: 0,
          nota: "",
          fatiga: bFatiga,
          dolor_muscular: bDolor,
          nota_dolor,
          calidad_sueno: bSueno,
          nota_sueno,
          estado_animico: bAnimico,
          created_at: new Date().toISOString(),
        }, ...prev]);
      } catch (err) {
        setBienestarError(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  function handleDeleteBienestar(id: string) {
    startDeleteBienestarTransition(async () => {
      await deleteBienestar(id, jugador.id);
      setBienestarList(prev => prev.filter(b => b.id !== id));
    });
  }

  // ── Cuenta de acceso ──────────────────────────────────────────────────────
  const [hasAccount, setHasAccount] = useState(!!jugador.user_id);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [isPendingAccount, startAccountTransition] = useTransition();
  const accountFormRef = useRef<HTMLFormElement>(null);

  function handleCreateAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAccountError(null); setAccountSuccess(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) { setAccountError("Completá email y contraseña."); return; }
    startAccountTransition(async () => {
      const result = await createPlayerAccount(jugador.id, email, password);
      if (result?.error) {
        setAccountError(result.error);
      } else {
        setHasAccount(true);
        setAccountSuccess(`Cuenta creada para ${email}`);
        accountFormRef.current?.reset();
      }
    });
  }

  function handleDeleteAccount() {
    setAccountError(null); setAccountSuccess(null);
    startAccountTransition(async () => {
      const result = await deletePlayerAccount(jugador.id);
      if (result?.error) {
        setAccountError(result.error);
      } else {
        setHasAccount(false);
      }
    });
  }

  // ── Helpers de UI ─────────────────────────────────────────────────────────
  const card = "bg-white border border-slate-200 rounded-2xl shadow-sm p-6";
  const inputClass = "border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500";
  const btnPrimary = "self-start bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col gap-8">

      {/* ── Perfil ── */}
      {mostrar("perfil") && (
        <div id="perfil" className={card}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">Perfil del jugador/a</h2>
            {isStaff && perfilSaved && <span className="text-xs text-green-600">Guardado</span>}
          </div>
          {isStaff ? (
            <textarea defaultValue={jugador.perfil} rows={4}
              placeholder="Descripción general del jugador/a, estilo de juego, nivel..."
              onChange={(e) => debouncedSavePerfil(e.target.value)}
              className={`w-full ${inputClass} resize-none`} />
          ) : (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {jugador.perfil || <span className="text-slate-400 italic">Sin información.</span>}
            </p>
          )}
        </div>
      )}

      {/* ── Correcciones técnicas y biomecánicas (solo staff) ── */}
      {isStaff && (
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">Correcciones técnicas y biomecánicas</h2>
            {correccionesSaved && <span className="text-xs text-green-600">Guardado</span>}
          </div>
          <textarea defaultValue={jugador.correcciones_tecnicas} rows={4}
            placeholder="Aspectos técnicos a trabajar, correcciones pendientes..."
            onChange={(e) => debouncedSaveCorrecciones(e.target.value)}
            className={`w-full ${inputClass} resize-none`} />
        </div>
      )}

      {/* ── Objetivos ── */}
      {mostrar("objetivos") && (
        <div id="objetivos" className={card}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">Objetivos</h2>
            {isStaff && objetivosSaved && <span className="text-xs text-green-600">Guardado</span>}
          </div>
          {isStaff ? (
            <textarea defaultValue={jugador.objetivos} rows={4}
              placeholder="Objetivos a corto y largo plazo del jugador/a..."
              onChange={(e) => debouncedSaveObjetivos(e.target.value)}
              className={`w-full ${inputClass} resize-none`} />
          ) : (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {jugador.objetivos || <span className="text-slate-400 italic">Sin información.</span>}
            </p>
          )}
        </div>
      )}

      {/* ── Modelos a seguir ── */}
      {mostrar("modelos") && (
        <div id="modelos" className={card}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">Modelos a seguir</h2>
            {isStaff && modelosSaved && <span className="text-xs text-green-600">Guardado</span>}
          </div>
          {isStaff ? (
            <textarea defaultValue={jugador.modelos_a_seguir} rows={3}
              placeholder="Jugadores/as de referencia que inspiran al jugador/a..."
              onChange={(e) => debouncedSaveModelos(e.target.value)}
              className={`w-full ${inputClass} resize-none`} />
          ) : (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {jugador.modelos_a_seguir || <span className="text-slate-400 italic">Sin información.</span>}
            </p>
          )}
        </div>
      )}

      {/* ── Identidad conceptual + ejecutoria ── */}
      {mostrar("identidad") && (
        <>
          <div id="identidad" className={card}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-800">Identidad conceptual</h2>
              {isStaff && identidadConceptualSaved && <span className="text-xs text-green-600">Guardado</span>}
            </div>
            {isStaff ? (
              <textarea defaultValue={jugador.identidad_conceptual} rows={4}
                placeholder="Concepto de juego, mentalidad, valores deportivos..."
                onChange={(e) => debouncedSaveIdentidadConceptual(e.target.value)}
                className={`w-full ${inputClass} resize-none`} />
            ) : (
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {jugador.identidad_conceptual || <span className="text-slate-400 italic">Sin información.</span>}
              </p>
            )}
          </div>
          <div className={card}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-800">Identidad ejecutoria</h2>
              {isStaff && identidadEjecutoriaSaved && <span className="text-xs text-green-600">Guardado</span>}
            </div>
            {isStaff ? (
              <textarea defaultValue={jugador.identidad_ejecutoria} rows={4}
                placeholder="Forma de ejecutar, golpes característicos, automatismos..."
                onChange={(e) => debouncedSaveIdentidadEjecutoria(e.target.value)}
                className={`w-full ${inputClass} resize-none`} />
            ) : (
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {jugador.identidad_ejecutoria || <span className="text-slate-400 italic">Sin información.</span>}
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Estilo de juego ── */}
      {mostrar("estilo") && (
        <div id="estilo" className={card}>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Estilo de juego</h2>
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Características</label>
                {isStaff && estiloCaracteristicasSaved && <span className="text-xs text-green-600">Guardado</span>}
              </div>
              {isStaff ? (
                <textarea defaultValue={jugador.estilo_caracteristicas} rows={3}
                  placeholder="Características generales del estilo de juego..."
                  onChange={(e) => debouncedSaveEstiloCaracteristicas(e.target.value)}
                  className={`w-full ${inputClass} resize-none`} />
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {jugador.estilo_caracteristicas || <span className="text-slate-400 italic">Sin información.</span>}
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Patrones</label>
                {isStaff && estiloPatronesSaved && <span className="text-xs text-green-600">Guardado</span>}
              </div>
              {isStaff ? (
                <textarea defaultValue={jugador.estilo_patrones} rows={3}
                  placeholder="Patrones de juego habituales, secuencias tácticas..."
                  onChange={(e) => debouncedSaveEstiloPatrones(e.target.value)}
                  className={`w-full ${inputClass} resize-none`} />
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {jugador.estilo_patrones || <span className="text-slate-400 italic">Sin información.</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Evaluaciones físicas/kinésicas ── */}
      {mostrar("evaluaciones") && <div id="evaluaciones" className={card}>
        <h2 className="text-base font-semibold text-slate-800 mb-4">Evaluaciones físicas/kinésicas</h2>

        {isStaff && (
          <form ref={evalFormRef} onSubmit={handleAddEvaluacion} noValidate className="flex flex-col gap-3 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-sm font-medium text-slate-700">Nombre de la evaluación</label>
                <input name="nombre" type="text" placeholder="Ej: Test de fuerza explosiva" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Fecha</label>
                <input name="fecha" type="date" className={inputClass} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Archivo PDF</label>
              <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors ${selectedPdfName ? "border-sky-400 bg-sky-50/40" : "border-slate-200 hover:border-sky-400 hover:bg-sky-50/40"}`}>
                <svg className={`w-5 h-5 shrink-0 ${selectedPdfName ? "text-sky-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className={`text-sm ${selectedPdfName ? "text-sky-700 font-medium" : "text-slate-500"}`}>
                  {selectedPdfName ?? "Seleccioná un PDF · máx 20 MB"}
                </span>
                <input name="pdfFile" type="file" accept=".pdf,application/pdf" className="sr-only"
                  onChange={(e) => setSelectedPdfName(e.target.files?.[0]?.name ?? null)} />
              </label>
            </div>
            {evalError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{evalError}</p>}
            <button type="submit" disabled={uploadingPdf || isPendingEval} className={btnPrimary}>
              {uploadingPdf ? "Subiendo PDF..." : isPendingEval ? "Guardando..." : "Agregar evaluación"}
            </button>
          </form>
        )}

        {evalList.length === 0 ? (
          <p className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-xl py-6">Sin evaluaciones cargadas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {evalList.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{ev.nombre}</p>
                  <p className="text-xs text-slate-500">{formatFecha(ev.fecha)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <a href={ev.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-sky-600 hover:text-sky-700 hover:underline">Ver PDF ↗</a>
                  {isStaff && (
                    <button type="button" disabled={isPendingDeleteEval}
                      onClick={() => handleDeleteEval(ev.id)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50">
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* ── Asistencias ── */}
      {mostrar("asistencias") && <div id="asistencias" className={card}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-semibold text-slate-800">Asistencias</h2>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {(["lista","calendario"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setVistaAsistencia(v)}
                className={`text-sm px-3 py-1 rounded-lg transition-colors ${vistaAsistencia === v ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
                {v === "lista" ? "Lista" : "Calendario"}
              </button>
            ))}
          </div>
        </div>

        {isStaff && (
          <form ref={asistenciaFormRef} onSubmit={handleAddAsistencia} noValidate className="flex flex-col gap-3 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Fecha</label>
                <input name="fecha" type="date" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Estado</label>
                <select name="estado" defaultValue="presente" className={`${inputClass} bg-white`}>
                  <option value="presente">Presente</option>
                  <option value="ausente">Ausente</option>
                  <option value="tarde">Tarde</option>
                  <option value="competencia">Competencia</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-sm font-medium text-slate-700">Nota (opcional)</label>
                <input name="nota" type="text" placeholder="Ej: Llegó 10 minutos tarde" className={inputClass} />
              </div>
            </div>
            {asistenciaError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{asistenciaError}</p>}
            <button type="submit" disabled={isPendingAsistencia} className={btnPrimary}>
              {isPendingAsistencia ? "Guardando..." : "Registrar asistencia"}
            </button>
          </form>
        )}

        {/* Lista */}
        {vistaAsistencia === "lista" && (
          asistenciaList.length === 0 ? (
            <p className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-xl py-6">Sin asistencias registradas.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {asistenciaList.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_STYLES[a.estado as EstadoAsistencia]}`}>
                      {ESTADO_LABELS[a.estado as EstadoAsistencia]}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{formatFecha(a.fecha)}</p>
                      {a.nota && <p className="text-xs text-slate-500">{a.nota}</p>}
                    </div>
                  </div>
                  {isStaff && (
                    <button type="button" disabled={isPendingDeleteAsistencia}
                      onClick={() => handleDeleteAsistencia(a.id)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50">
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Calendario */}
        {vistaAsistencia === "calendario" && (() => {
          const year = calAsistenciaDate.getFullYear();
          const month = calAsistenciaDate.getMonth();
          const cells = buildCells(year, month);
          const selPlanes = diaAsistenciaSel ? asistenciaList.filter(a => a.fecha === diaAsistenciaSel) : [];
          return (
            <div className="flex flex-col gap-4">
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                  <button type="button" onClick={() => { setCalAsistenciaDate(new Date(year, month - 1, 1)); setDiaAsistenciaSel(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-600 text-lg">‹</button>
                  <span className="text-sm font-semibold text-slate-800">{MESES_ES[month]} {year}</span>
                  <button type="button" onClick={() => { setCalAsistenciaDate(new Date(year, month + 1, 1)); setDiaAsistenciaSel(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-600 text-lg">›</button>
                </div>
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {DIAS_ES.map(d => <div key={d} className="py-2 text-center text-xs font-medium text-slate-400">{d}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {cells.map((day, i) => {
                    if (!day) return <div key={i} className="min-h-[56px] border-b border-r border-slate-50" />;
                    const dateStr = mkDate(year, month, day);
                    const dayItems = asistenciaList.filter(a => a.fecha === dateStr);
                    const isHoy = dateStr === HOY_STR;
                    const isSel = dateStr === diaAsistenciaSel;
                    return (
                      <button key={i} type="button" onClick={() => setDiaAsistenciaSel(isSel ? null : dateStr)}
                        className={`min-h-[56px] p-1.5 border-b border-r border-slate-100 text-left transition-colors cursor-pointer flex flex-col gap-1 ${isSel ? "bg-sky-50" : "hover:bg-slate-50"}`}>
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isHoy ? "bg-sky-600 text-white" : "text-slate-700"}`}>{day}</span>
                        <div className="flex flex-col gap-0.5 w-full">
                          {dayItems.map(a => (
                            <span key={a.id} className={`text-[10px] px-1 py-0.5 rounded font-medium truncate ${ESTADO_STYLES[a.estado as EstadoAsistencia]}`}>
                              {ESTADO_LABELS[a.estado as EstadoAsistencia]}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3 px-5 py-3 border-t border-slate-100">
                  {(["presente","ausente","tarde","competencia"] as EstadoAsistencia[]).map(e => (
                    <div key={e} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${e === "presente" ? "bg-green-500" : e === "ausente" ? "bg-red-500" : e === "tarde" ? "bg-amber-500" : "bg-blue-500"}`} />
                      <span className="text-xs text-slate-500">{ESTADO_LABELS[e]}</span>
                    </div>
                  ))}
                </div>
              </div>
              {diaAsistenciaSel && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">{formatFecha(diaAsistenciaSel)}</h4>
                  {selPlanes.length === 0 ? (
                    <p className="text-slate-400 text-sm">Sin registros para este día.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selPlanes.map(a => (
                        <div key={a.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_STYLES[a.estado as EstadoAsistencia]}`}>{ESTADO_LABELS[a.estado as EstadoAsistencia]}</span>
                            {a.nota && <p className="text-xs text-slate-500">{a.nota}</p>}
                          </div>
                          {isStaff && (
                            <button type="button" disabled={isPendingDeleteAsistencia} onClick={() => handleDeleteAsistencia(a.id)}
                              className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50">Eliminar</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>}

      {/* ── Bienestar subjetivo ── */}
      {mostrar("bienestar") && <div id="bienestar" className={card}>
        <h2 className="text-base font-semibold text-slate-800 mb-4">Bienestar subjetivo</h2>

        {/* Formulario: solo jugador */}
        {!isStaff && (
          <form ref={bienestarFormRef} onSubmit={handleAddBienestar} noValidate className="flex flex-col gap-5 mb-6 border-b border-slate-100 pb-6">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Fecha</label>
              <input name="fecha" type="date" className={`${inputClass} max-w-[200px]`} />
            </div>

            <MetricaBotones
              label="Fatiga"
              desc="1 = nada de fatiga · 10 = muy fatigado"
              value={bFatiga}
              onChange={setBFatiga}
              tipo="inverso"
            />

            <div className="flex flex-col gap-2">
              <MetricaBotones
                label="Dolor muscular"
                desc="1 = nada de dolor · 10 = mucho dolor"
                value={bDolor}
                onChange={setBDolor}
                tipo="inverso"
              />
              <input
                name="nota_dolor"
                type="text"
                placeholder="Zona con dolor (opcional, ej: espalda baja)"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <MetricaBotones
                label="Calidad del sueño"
                desc="1 = muy mal sueño · 10 = excelente"
                value={bSueno}
                onChange={setBSueno}
                tipo="normal"
              />
              <input
                name="nota_sueno"
                type="text"
                placeholder="Horas de sueño (opcional, ej: 8hs)"
                className={inputClass}
              />
            </div>

            <MetricaBotones
              label="Estado anímico"
              desc="1 = bajo · 10 = excelente"
              value={bAnimico}
              onChange={setBAnimico}
              tipo="normal"
            />

            {bienestarError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{bienestarError}</p>
            )}
            <button type="submit" disabled={isPendingBienestar} className={btnPrimary}>
              {isPendingBienestar ? "Guardando..." : "Registrar bienestar"}
            </button>
          </form>
        )}

        {/* Historial */}
        {bienestarList.length === 0 ? (
          <p className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-xl py-6">Sin registros de bienestar.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {bienestarList.map((b) => (
              <div key={b.id} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-800">{formatFecha(b.fecha)}</p>
                  {isStaff && (
                    <button type="button" disabled={isPendingDeleteBienestar}
                      onClick={() => handleDeleteBienestar(b.id)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50">
                      Eliminar
                    </button>
                  )}
                </div>
                {b.fatiga != null ? (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { label: "Fatiga", val: b.fatiga, tipo: "inverso" },
                        { label: "Dolor", val: b.dolor_muscular!, tipo: "inverso" },
                        { label: "Sueño", val: b.calidad_sueno!, tipo: "normal" },
                        { label: "Ánimo", val: b.estado_animico!, tipo: "normal" },
                      ] as const).map(({ label, val, tipo }) => (
                        <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorMetrica(val, tipo)}`}>
                          <span className="text-lg font-bold">{val}</span>
                          <span className="text-xs font-medium">{label}</span>
                        </div>
                      ))}
                    </div>
                    {(b.nota_dolor || b.nota_sueno) && (
                      <div className="flex flex-col gap-0.5">
                        {b.nota_dolor && <p className="text-xs text-slate-500">Dolor en: {b.nota_dolor}</p>}
                        {b.nota_sueno && <p className="text-xs text-slate-500">Horas de sueño: {b.nota_sueno}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Registro antiguo: solo muestra el valor general */
                  <div className="flex items-center gap-2">
                    <span className={`w-9 h-9 rounded-xl text-sm font-bold border flex items-center justify-center shrink-0 ${colorMetrica(b.valor, "normal")}`}>
                      {b.valor}
                    </span>
                    {b.nota && <p className="text-xs text-slate-500">{b.nota}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* ── Calendario de torneos ── */}
      {mostrar("torneos") && <div id="torneos" className={card}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-semibold text-slate-800">Calendario de torneos</h2>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {(["lista","calendario"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setVistaTorneo(v)}
                className={`text-sm px-3 py-1 rounded-lg transition-colors ${vistaTorneo === v ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
                {v === "lista" ? "Lista" : "Calendario"}
              </button>
            ))}
          </div>
        </div>

        {isStaff && (
          <form ref={torneoFormRef} onSubmit={(e) => {
            e.preventDefault();
            setTorneoError(null);
            const formData = new FormData(e.currentTarget);
            const nombre = String(formData.get("nombre") ?? "").trim();
            const fecha = String(formData.get("fecha") ?? "").trim();
            if (!nombre || !fecha) { setTorneoError("Completá nombre y fecha del torneo."); return; }
            startTorneoTransition(async () => {
              try {
                await addTorneo(jugador.id, formData);
                torneoFormRef.current?.reset();
                const lugar = String(formData.get("lugar") ?? "").trim();
                const fecha_fin = String(formData.get("fecha_fin") ?? "").trim() || null;
                setTorneoList(prev => [...prev, { id: Date.now().toString(), jugador_id: jugador.id, nombre, fecha, fecha_fin, lugar, created_at: new Date().toISOString() }].sort((a, b) => a.fecha.localeCompare(b.fecha)));
              } catch (err) { setTorneoError(err instanceof Error ? err.message : "Error al guardar."); }
            });
          }} noValidate className="flex flex-col gap-3 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-sm font-medium text-slate-700">Torneo</label>
                <input name="nombre" type="text" placeholder="Ej: Torneo Nacional" className={inputClass} />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Fecha inicio</label>
                  <input name="fecha" type="date" className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Fecha límite</label>
                  <input name="fecha_fin" type="date" className={inputClass} />
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-sm font-medium text-slate-700">Lugar (opcional)</label>
                <input name="lugar" type="text" placeholder="Ej: Buenos Aires" className={inputClass} />
              </div>
            </div>
            {torneoError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{torneoError}</p>}
            <button type="submit" disabled={isPendingTorneo} className={btnPrimary}>
              {isPendingTorneo ? "Guardando..." : "Agregar torneo"}
            </button>
          </form>
        )}

        {/* Lista */}
        {vistaTorneo === "lista" && (
          torneoList.length === 0 ? (
            <p className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-xl py-6">Sin torneos cargados todavía.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {torneoList.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {formatFecha(t.fecha)}{t.fecha_fin && ` → ${formatFecha(t.fecha_fin)}`}{t.lugar && ` · ${t.lugar}`}
                    </p>
                  </div>
                  {isStaff && (
                    <button type="button" disabled={isPendingDeleteTorneo}
                      onClick={() => { startDeleteTorneoTransition(async () => { await deleteTorneo(t.id, jugador.id); setTorneoList(prev => prev.filter(x => x.id !== t.id)); }); }}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50">
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Calendario */}
        {vistaTorneo === "calendario" && (() => {
          const year = calTorneoDate.getFullYear();
          const month = calTorneoDate.getMonth();
          const cells = buildCells(year, month);
          const selTorneos = diaTorneoSel ? torneoList.filter(t => diaTorneoSel >= t.fecha && diaTorneoSel <= (t.fecha_fin ?? t.fecha)) : [];
          return (
            <div className="flex flex-col gap-4">
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                  <button type="button" onClick={() => { setCalTorneoDate(new Date(year, month - 1, 1)); setDiaTorneoSel(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-600 text-lg">‹</button>
                  <span className="text-sm font-semibold text-slate-800">{MESES_ES[month]} {year}</span>
                  <button type="button" onClick={() => { setCalTorneoDate(new Date(year, month + 1, 1)); setDiaTorneoSel(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-600 text-lg">›</button>
                </div>
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {DIAS_ES.map(d => <div key={d} className="py-2 text-center text-xs font-medium text-slate-400">{d}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {cells.map((day, i) => {
                    if (!day) return <div key={i} className="min-h-[64px] border-b border-r border-slate-50" />;
                    const dateStr = mkDate(year, month, day);
                    const dayTorneos = torneoList.filter(t => dateStr >= t.fecha && dateStr <= (t.fecha_fin ?? t.fecha));
                    const isStart = torneoList.some(t => t.fecha === dateStr);
                    const isHoy = dateStr === HOY_STR;
                    const isSel = dateStr === diaTorneoSel;
                    return (
                      <button key={i} type="button" onClick={() => setDiaTorneoSel(isSel ? null : dateStr)}
                        className={`min-h-[64px] p-1.5 border-b border-r border-slate-100 text-left transition-colors cursor-pointer flex flex-col gap-1 ${isSel ? "bg-sky-50" : dayTorneos.length > 0 ? "bg-sky-50/40 hover:bg-sky-50" : "hover:bg-slate-50"}`}>
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isHoy ? "bg-sky-600 text-white" : "text-slate-700"}`}>{day}</span>
                        <div className="flex flex-col gap-0.5 w-full">
                          {isStart && dayTorneos.slice(0, 2).map(t => (
                            <span key={t.id} className="text-[10px] px-1 py-0.5 rounded bg-sky-100 text-sky-700 font-medium truncate">{t.nombre}</span>
                          ))}
                          {!isStart && dayTorneos.length > 0 && (
                            <span className="w-full h-1 rounded bg-sky-200 mt-1" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {diaTorneoSel && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">{formatFecha(diaTorneoSel)}</h4>
                  {selTorneos.length === 0 ? (
                    <p className="text-slate-400 text-sm">Sin torneos para este día.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selTorneos.map(t => (
                        <div key={t.id} className="flex items-center justify-between bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{t.nombre}</p>
                            <p className="text-xs text-slate-500">
                              {formatFecha(t.fecha)}{t.fecha_fin && ` → ${formatFecha(t.fecha_fin)}`}{t.lugar && ` · ${t.lugar}`}
                            </p>
                          </div>
                          {isStaff && (
                            <button type="button" disabled={isPendingDeleteTorneo}
                              onClick={() => { startDeleteTorneoTransition(async () => { await deleteTorneo(t.id, jugador.id); setTorneoList(prev => prev.filter(x => x.id !== t.id)); setDiaTorneoSel(null); }); }}
                              className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50">Eliminar</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>}

      {/* ── Gestión de acceso (solo staff) ── */}
      {isStaff && (
        <div className={card}>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Acceso del jugador/a</h2>

          {accountError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{accountError}</p>}
          {accountSuccess && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4">{accountSuccess}</p>}

          {hasAccount ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Cuenta activa</span>
                <span className="text-sm text-slate-500">El jugador/a puede iniciar sesión</span>
              </div>
              <button type="button" disabled={isPendingAccount} onClick={handleDeleteAccount}
                className="text-sm text-red-500 hover:text-red-700 hover:underline disabled:opacity-50 cursor-pointer">
                {isPendingAccount ? "Revocando..." : "Revocar acceso"}
              </button>
            </div>
          ) : (
            <form ref={accountFormRef} onSubmit={handleCreateAccount} noValidate className="flex flex-col gap-3">
              <p className="text-sm text-slate-500">Creá una cuenta para que este jugador/a pueda acceder a su perfil.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input name="email" type="email" placeholder="jugador@email.com" className={inputClass} />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-slate-700">Contraseña</label>
                  <input name="password" type="password" placeholder="Mínimo 6 caracteres" className={inputClass} />
                </div>
              </div>
              <button type="submit" disabled={isPendingAccount} className={btnPrimary}>
                {isPendingAccount ? "Creando..." : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
