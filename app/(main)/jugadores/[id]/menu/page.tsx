import Link from "next/link";
import { getJugador } from "../../actions";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const seccionesJugador = [
  { seccion: "perfil",        titulo: "Perfil",            descripcion: "Tu perfil, modelos, identidad y estilo de juego.", icono: "👤" },
  { seccion: "objetivos",     titulo: "Objetivos",          descripcion: "Tus metas a corto y largo plazo.", icono: "🎯" },
  { seccion: "evaluaciones",  titulo: "Evaluaciones",       descripcion: "Evaluaciones físicas y kinésicas en PDF.", icono: "📊" },
  { seccion: "asistencias",   titulo: "Asistencias",        descripcion: "Registro de presencias a los entrenamientos.", icono: "📅" },
  { seccion: "bienestar",     titulo: "Bienestar",          descripcion: "Seguimiento de tu bienestar subjetivo.", icono: "❤️" },
  { seccion: "torneos",       titulo: "Torneos",            descripcion: "Calendario de torneos y competencias.", icono: "🏆" },
];

const seccionesStaff = [
  { seccion: "perfil",        titulo: "Perfil",            descripcion: "Perfil, modelos, identidad y estilo de juego.", icono: "👤" },
  { seccion: "objetivos",     titulo: "Objetivos",          descripcion: "Metas a corto y largo plazo.", icono: "🎯" },
  { seccion: "correcciones",  titulo: "Correcciones",       descripcion: "Correcciones técnicas y biomecánicas.", icono: "🔧" },
  { seccion: "evaluaciones",  titulo: "Evaluaciones",       descripcion: "Evaluaciones físicas y kinésicas en PDF.", icono: "📊" },
  { seccion: "asistencias",   titulo: "Asistencias",        descripcion: "Registro de presencias a los entrenamientos.", icono: "📅" },
  { seccion: "bienestar",     titulo: "Bienestar",          descripcion: "Seguimiento del bienestar subjetivo.", icono: "❤️" },
  { seccion: "torneos",       titulo: "Torneos",            descripcion: "Calendario de torneos y competencias.", icono: "🏆" },
  { seccion: "acceso",        titulo: "Acceso",             descripcion: "Gestión de cuenta y acceso del jugador/a.", icono: "🔑" },
];

export const dynamic = "force-dynamic";

export default async function JugadorMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jugador = await getJugador(id);
  if (!jugador) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isStaff = user?.user_metadata?.role !== "jugador";

  const secciones = isStaff ? seccionesStaff : seccionesJugador;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          {isStaff ? `${jugador.nombre} ${jugador.apellido}` : `Hola, ${jugador.nombre} ${jugador.apellido}`}
        </h1>
        <p className="text-slate-500">
          {isStaff ? "Seleccioná una sección para ver o editar." : "Seleccioná una sección para ver tu información."}
        </p>
      </div>

      <div className={`grid gap-3 sm:gap-5 w-full max-w-3xl ${isStaff ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
        {secciones.map(({ seccion, titulo, descripcion, icono }) => (
          <Link
            key={seccion}
            href={`/jugadores/${id}?seccion=${seccion}`}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col items-center text-center gap-2 sm:gap-3 hover:border-sky-400 hover:shadow-md transition-all"
          >
            <span className="text-3xl sm:text-4xl">{icono}</span>
            <span className="text-sm sm:text-base font-semibold text-slate-800 leading-tight">{titulo}</span>
            <span className="text-xs sm:text-sm text-slate-500 hidden sm:block">{descripcion}</span>
          </Link>
        ))}
      </div>

      {isStaff && (
        <Link href="/jugadores" className="text-sm text-sky-600 hover:text-sky-700 hover:underline">
          ← Volver a jugadores/as
        </Link>
      )}
    </div>
  );
}
