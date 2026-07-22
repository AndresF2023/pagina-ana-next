"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const staffLinks = [
  { href: "/ejercicios", label: "Biblioteca" },
  { href: "/jugadores", label: "Jugadores/as" },
  { href: "/planificacion", label: "Planificación" },
];

export default function Nav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...staffLinks, { href: "/admin", label: "Admin" }] : staffLinks;

  return (
    <nav className="flex gap-1 flex-wrap justify-center">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-xs sm:text-sm px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg transition-colors ${
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
