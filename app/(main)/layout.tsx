import { createClient } from "@/utils/supabase/server";
import Nav from "@/components/Nav";
import SignOutButton from "@/components/SignOutButton";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isStaff = user?.user_metadata?.role !== "jugador";

  return (
    <>
      <header className="bg-gradient-to-r from-sky-400 to-sky-600 text-white px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between py-4 gap-3">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/club.png" alt="Logo Club" width={44} height={44} className="rounded-full" />
            <span className="text-2xl font-bold">Tenis del 9</span>
          </div>
          {isStaff && <Nav />}
          <SignOutButton />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
}
