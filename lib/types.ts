export const CATEGORIES = [
  "Drive",
  "Revés",
  "Saque",
  "Volea",
  "Smash",
  "Juego de pies",
  "Otro",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Exercise {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  notes: string;
  category: Category | null;
  createdAt?: string;
}

export interface ExerciseRow {
  id: string;
  title: string;
  description: string;
  video_url: string;
  notes: string;
  category: string | null;
  created_at: string;
}

export interface Jugador {
  id: string;
  nombre: string;
  apellido: string;
  perfil: string;
  correcciones_tecnicas: string;
  created_at: string;
}

export interface Torneo {
  id: string;
  jugador_id: string;
  nombre: string;
  fecha: string;
  lugar: string;
  created_at: string;
}

export const TIPOS_PLANIFICACION = ["diaria", "semanal", "mensual"] as const;
export type TipoPlanificacion = (typeof TIPOS_PLANIFICACION)[number];

export interface Planificacion {
  id: string;
  tipo: TipoPlanificacion;
  titulo: string;
  contenido: string;
  fecha: string;
  created_at: string;
}
