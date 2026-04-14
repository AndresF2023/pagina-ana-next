import Link from "next/link";
import { notFound } from "next/navigation";
import { getJugador, getTorneos } from "../actions";
import JugadorDetail from "@/components/JugadorDetail";

export const dynamic = "force-dynamic";

export default async function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [jugador, torneos] = await Promise.all([
    getJugador(id),
    getTorneos(id),
  ]);

  if (!jugador) notFound();

  return (
    <>
      <div className="mb-6">
        <Link href="/jugadores" className="text-sm text-sky-600 hover:text-sky-700 hover:underline">
          ← Volver a jugadores/as
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">
          {jugador.nombre} {jugador.apellido}
        </h1>
      </div>

      <JugadorDetail jugador={jugador} torneos={torneos} />
    </>
  );
}
