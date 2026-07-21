export const CATEGORIES = [
  "Warm-Up",
  "Footdrills",
  "Drive",
  "Revés",
  "Saque",
  "Volea",
  "Smash",
  "Juego de pies",
  "Correctivos",
  "Drills tácticos/patrones",
  "Juegos",
  "Canastos",
  "Otro",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Exercise {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  imageUrls: string[];
  notes: string;
  category: Category | null;
  createdAt?: string;
}

export interface ExerciseRow {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  image_urls: string[] | null;
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
  objetivos: string;
  modelos_a_seguir: string;
  identidad_conceptual: string;
  identidad_ejecutoria: string;
  estilo_caracteristicas: string;
  estilo_patrones: string;
  created_at: string;
  user_id?: string | null;
}

export interface Torneo {
  id: string;
  jugador_id: string;
  nombre: string;
  fecha: string;
  fecha_fin: string | null;
  lugar: string;
  created_at: string;
}

export interface Evaluacion {
  id: string;
  jugador_id: string;
  nombre: string;
  fecha: string;
  pdf_url: string;
  created_at: string;
}

export type EstadoAsistencia = "presente" | "ausente" | "tarde" | "competencia";

export interface Asistencia {
  id: string;
  jugador_id: string;
  fecha: string;
  estado: EstadoAsistencia;
  nota: string;
  created_at: string;
}

export interface Bienestar {
  id: string;
  jugador_id: string;
  fecha: string;
  valor: number;
  nota: string;
  fatiga: number | null;
  dolor_muscular: number | null;
  calidad_sueno: number | null;
  estado_animico: number | null;
  nota_dolor: string;
  nota_sueno: string;
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
  ejercicio_ids: string[];
  created_at: string;
}
