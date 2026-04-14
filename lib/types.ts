export interface Exercise {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  notes: string;
  createdAt?: string;
}

export interface ExerciseRow {
  id: string;
  title: string;
  description: string;
  video_url: string;
  notes: string;
  created_at: string;
}
