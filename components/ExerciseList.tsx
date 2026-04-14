import ExerciseCard from "./ExerciseCard";
import type { Exercise } from "@/lib/types";

interface Props {
  exercises: Exercise[];
}

export default function ExerciseList({ exercises }: Props) {
  if (exercises.length === 0) {
    return (
      <p className="text-slate-400 border border-dashed border-slate-200 rounded-2xl px-5 py-8 text-center text-sm">
        Todavía no hay ejercicios. Agrega el primero desde el formulario.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
}
