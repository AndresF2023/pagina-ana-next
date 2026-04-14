import { getExercises } from "@/app/actions";
import ExerciseForm from "@/components/ExerciseForm";
import ExerciseList from "@/components/ExerciseList";

export const dynamic = "force-dynamic";

export default async function EjerciciosPage() {
  let exercises: Awaited<ReturnType<typeof getExercises>> = [];
  let dbError: string | null = null;

  try {
    exercises = await getExercises();
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Error al conectar con la base de datos.";
  }

  return (
    <>
      <ExerciseForm />
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Biblioteca</h2>
        {dbError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            Error al cargar: {dbError}
          </p>
        )}
        <ExerciseList exercises={exercises} />
      </section>
    </>
  );
}
