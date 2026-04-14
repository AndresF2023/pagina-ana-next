import { signOut } from "@/app/login/actions";
import Nav from "@/components/Nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-gradient-to-r from-sky-400 to-sky-600 text-white px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between py-4 gap-3">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/club.png" alt="Logo Club" width={44} height={44} className="rounded-full" />
            <span className="text-2xl font-bold">Tenis del 9</span>
          </div>
          <Nav />
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-white/80 hover:text-white border border-white/30 hover:border-white/60 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
}
