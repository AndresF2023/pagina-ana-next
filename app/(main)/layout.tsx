import { createClient } from "@/utils/supabase/server";
import Nav from "@/components/Nav";
import SignOutButton from "@/components/SignOutButton";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;
  const isStaff = role !== "jugador";
  const isAdmin = role !== "jugador" && role !== "staff";

  return (
    <>
      <header className="bg-gradient-to-r from-sky-400 to-sky-600 text-white px-4">
        <div className="max-w-5xl mx-auto flex flex-row items-center justify-between py-3 sm:py-4 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/club.png" alt="Logo Club" width={36} height={36} className="rounded-full sm:w-11 sm:h-11" />
            <span className="text-lg sm:text-2xl font-bold">Tenis del 9</span>
          </div>
          {isStaff && <Nav isAdmin={isAdmin} />}
          <div className="shrink-0"><SignOutButton /></div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {children}
      </main>
    </>
  );
}
