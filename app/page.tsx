import { getExercises } from "./actions";
import { signOut } from "./login/actions";
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
      <header className="bg-gradient-to-r from-sky-400 to-sky-600 text-white px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-4">
          <div className="py-4 text-center flex-1">
            <h1 className="text-3xl font-bold mb-1">Tenis del 9</h1>
            <p className="text-sky-100 text-base">
              Visualiza cada ejercicio y agrega tus indicaciones personalizadas.
            </p>
          </div>
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
