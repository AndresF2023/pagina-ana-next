"use client";

import { useState } from "react";
import ExerciseCard from "./ExerciseCard";
import type { Category, Exercise } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

interface Props {
  exercises: Exercise[];
}

export default function ExerciseList({ exercises }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === null || ex.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const usedCategories = CATEGORIES.filter((cat) =>
    exercises.some((ex) => ex.category === cat)
  );

  if (exercises.length === 0) {
    return (
      <p className="text-slate-400 border border-dashed border-slate-200 rounded-2xl px-5 py-8 text-center text-sm">
        Todavía no hay ejercicios. Agrega el primero desde el formulario.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Buscador */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
        />
      </div>

      {/* Filtro por categoría */}
      {usedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              activeCategory === null
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-sky-400 hover:text-sky-600"
            }`}
          >
            Todos
          </button>
          {usedCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                activeCategory === cat
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-sky-400 hover:text-sky-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Resultados */}
      {filtered.length === 0 ? (
        <p className="text-slate-400 border border-dashed border-slate-200 rounded-2xl px-5 py-8 text-center text-sm">
          No hay ejercicios que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}
    </div>
  );
}
