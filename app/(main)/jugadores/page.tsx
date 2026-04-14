import Link from "next/link";
import { getJugadores } from "./actions";
import JugadorForm from "@/components/JugadorForm";
import { deleteJugador } from "./actions";

export const dynamic = "force-dynamic";

export default async function JugadoresPage() {
  let jugadores: Awaited<ReturnType<typeof getJugadores>> = [];
  let dbError: string | null = null;

  try {
    jugadores = await getJugadores();
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Error al cargar.";
  }

  return (
    <>
      <JugadorForm />

      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Jugadores/as</h2>

        {dbError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            {dbError}
          </p>
        )}

        {jugadores.length === 0 ? (
          <p className="text-slate-400 border border-dashed border-slate-200 rounded-2xl px-5 py-8 text-center text-sm">
            Todavía no hay jugadores/as. Agregá el primero desde el formulario.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jugadores.map((j) => (
              <div key={j.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
                <div>
                  <p className="font-semibold text-slate-800 text-base">
                    {j.apellido}, {j.nombre}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Agregado el {new Date(j.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  <Link
                    href={`/jugadores/${j.id}`}
                    className="text-sm text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    Ver perfil →
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deleteJugador(j.id);
                    }}
                    className="ml-auto"
                  >
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
