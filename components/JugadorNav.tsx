"use client";

const links = [
  { href: "#perfil",       label: "Perfil" },
  { href: "#objetivos",    label: "Objetivos" },
  { href: "#modelos",      label: "Modelos" },
  { href: "#identidad",    label: "Identidad" },
  { href: "#estilo",       label: "Estilo de juego" },
  { href: "#evaluaciones", label: "Evaluaciones" },
  { href: "#asistencias",  label: "Asistencias" },
  { href: "#bienestar",    label: "Bienestar" },
  { href: "#torneos",      label: "Torneos" },
];

export default function JugadorNav() {
  return (
    <nav className="flex gap-1 flex-wrap justify-center">
      {links.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          className="text-sm px-4 py-1.5 rounded-lg transition-colors text-sky-100 hover:bg-white/10"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
