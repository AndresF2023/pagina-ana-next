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
  const role = user?.user_metadata?.role;
  const isStaff = role !== "jugador";
  const canEdit = role !== "jugador" && role !== "staff";

  const jugador = await getJugador(id);
  if (!jugador) notFound();

  const [torneos, evaluaciones, asistencias, bienestar] = await Promise.all([
    getTorneos(id).catch(() => []),
    getEvaluaciones(id).catch((e: unknown) => { console.error("getEvaluaciones:", e); return []; }),
    getAsistencias(id).catch((e: unknown) => { console.error("getAsistencias:", e); return []; }),
    getBienestar(id).catch(() => []),
  ]);

  return (
    <>
      <div className="mb-6">
        {seccion ? (
          <Link href={`/jugadores/${id}/menu`} className="text-sm text-sky-600 hover:text-sky-700 hover:underline">
            ← Volver al menú
          </Link>
        ) : isStaff ? (
          <Link href="/jugadores" className="text-sm text-sky-600 hover:text-sky-700 hover:underline">
            ← Volver a jugadores/as
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
        canEdit={canEdit}
        seccion={seccion}
      />
    </>
  );
}
