"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "@/app/login/actions";

export default function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
    });
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={pending}
      className="text-sm text-white/80 hover:text-white border border-white/30 hover:border-white/60 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
    >
      {pending ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
