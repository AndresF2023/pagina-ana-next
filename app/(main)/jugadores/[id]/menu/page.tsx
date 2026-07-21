import Link from "next/link";
import { getJugador } from "../../actions";
import { notFound } from "next/navigation";

const secciones = [
  { anchor: "perfil",        titulo: "Perfil",            descripcion: "Tu descripción general, nivel y estilo de juego.", icono: "👤" },
  { anchor: "objetivos",     titulo: "Objetivos",          descripcion: "Tus metas a corto y largo plazo.", icono: "🎯" },
  { anchor: "modelos",       titulo: "Modelos a seguir",   descripcion: "Jugadores/as de referencia que te inspiran.", icono: "⭐" },
  { anchor: "identidad",     titulo: "Identidad",          descripcion: "Tu identidad conceptual y ejecutoria.", icono: "💡" },
  { anchor: "estilo",        titulo: "Estilo de juego",    descripcion: "Tus características y patrones habituales.", icono: "🎾" },
  { anchor: "evaluaciones",  titulo: "Evaluaciones",       descripcion: "Evaluaciones físicas y kinésicas en PDF.", icono: "📊" },
  { anchor: "asistencias",   titulo: "Asistencias",        descripcion: "Registro de presencias a los entrenamientos.", icono: "📅" },
  { anchor: "bienestar",     titulo: "Bienestar",          descripcion: "Seguimiento de tu bienestar subjetivo.", icono: "❤️" },
  { anchor: "torneos",       titulo: "Torneos",            descripcion: "Calendario de torneos y competencias.", icono: "🏆" },
];

export const dynamic = "force-dynamic";

export default async function JugadorMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jugador = await getJugador(id);
  if (!jugador) notFound();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Hola, {jugador.nombre} {jugador.apellido}
        </h1>
        <p className="text-slate-500">Seleccioná una sección para ver tu información.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3 w-full max-w-3xl">
        {secciones.map(({ anchor, titulo, descripcion, icono }) => (
          <Link
            key={anchor}
            href={`/jugadores/${id}#${anchor}`}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center gap-3 hover:border-sky-400 hover:shadow-md transition-all"
          >
            <span className="text-4xl">{icono}</span>
            <span className="text-base font-semibold text-slate-800">{titulo}</span>
            <span className="text-sm text-slate-500">{descripcion}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
