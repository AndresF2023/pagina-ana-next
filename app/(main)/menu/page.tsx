import Link from "next/link";

const secciones = [
  {
    href: "/ejercicios",
    titulo: "Ejercicios",
    descripcion: "Biblioteca de ejercicios con videos y notas personalizadas.",
    icono: "🎾",
  },
  {
    href: "/jugadores",
    titulo: "Jugadores/as",
    descripcion: "Perfiles, correcciones técnicas y calendario de torneos.",
    icono: "👤",
  },
  {
    href: "/planificacion",
    titulo: "Planificación",
    descripcion: "Planificación de entrenamientos diarios, semanales y mensuales.",
    icono: "📋",
  },
];

export default function MenuPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">¿Qué querés gestionar?</h1>
        <p className="text-slate-500">Seleccioná una sección para comenzar.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3 w-full max-w-3xl">
        {secciones.map(({ href, titulo, descripcion, icono }) => (
          <Link
            key={href}
            href={href}
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
