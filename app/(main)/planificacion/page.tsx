import { getPlanificaciones } from "./actions";
import PlanificacionSection from "@/components/PlanificacionSection";

export const dynamic = "force-dynamic";

export default async function PlanificacionPage() {
  let planes: Awaited<ReturnType<typeof getPlanificaciones>> = [];
  let dbError: string | null = null;

  try {
    planes = await getPlanificaciones();
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Error al cargar.";
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Planificación</h1>

      {dbError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
          {dbError}
        </p>
      )}

      <PlanificacionSection inicial={planes} />
    </>
  );
}
