"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/ejercicios", label: "Ejercicios" },
  { href: "/jugadores", label: "Jugadores/as" },
  { href: "/planificacion", label: "Planificación" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 flex-wrap justify-center">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${
            pathname.startsWith(href)
              ? "bg-white/25 text-white font-semibold"
              : "text-sky-100 hover:bg-white/10"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
