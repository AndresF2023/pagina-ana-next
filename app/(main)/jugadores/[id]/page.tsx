import Link from "next/link";
import { notFound } from "next/navigation";
import { getJugador, getTorneos, getEvaluaciones, getAsistencias, getBienestar } from "../actions";
import JugadorDetail from "@/components/JugadorDetail";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function JugadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ seccion?: string }>;
}) {
  const { id } = await params;
  const { seccion } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isStaff = user?.user_metadata?.role !== "jugador";

  const [jugador, torneos, evaluaciones, asistencias, bienestar] = await Promise.all([
    getJugador(id),
    getTorneos(id),
    getEvaluaciones(id),
    getAsistencias(id),
    getBienestar(id),
  ]);

  if (!jugador) notFound();

  return (
    <>
      <div className="mb-6">
        {isStaff ? (
          <Link href="/jugadores" className="text-sm text-sky-600 hover:text-sky-700 hover:underline">
            ← Volver a jugadores/as
          </Link>
        ) : seccion ? (
          <Link href={`/jugadores/${id}/menu`} className="text-sm text-sky-600 hover:text-sky-700 hover:underline">
            ← Volver al menú
          </Link>
        ) : null}
        <h1 className="text-2xl font-bold text-slate-800 mt-2">
          {jugador.nombre} {jugador.apellido}
        </h1>
      </div>

      <JugadorDetail
        jugador={jugador}
        torneos={torneos}
        evaluaciones={evaluaciones}
        asistencias={asistencias}
        bienestar={bienestar}
        isStaff={isStaff}
        seccion={seccion}
      />
    </>
  );
}
