import { getExercises } from "./actions";
import ExerciseForm from "@/components/ExerciseForm";
import ExerciseList from "@/components/ExerciseList";

export const dynamic = "force-dynamic";

export default async function Home() {
  let exercises: Awaited<ReturnType<typeof getExercises>> = [];
  let dbError: string | null = null;

  try {
    exercises = await getExercises();
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Error al conectar con la base de datos.";
  }

  return (
    <>
      <header className="bg-gradient-to-r from-blue-600 to-green-500 text-white py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-2">Biblioteca de Ejercicios de Tenis</h1>
        <p className="text-blue-100 text-base">
          Visualiza cada ejercicio y agrega tus indicaciones personalizadas.
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <ExerciseForm />

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Ejercicios</h2>

          {dbError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              Error al cargar desde Supabase: {dbError}
            </p>
          )}

          <ExerciseList exercises={exercises} />
        </section>
      </main>
    </>
  );
}
