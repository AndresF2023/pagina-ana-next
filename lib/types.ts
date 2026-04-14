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
