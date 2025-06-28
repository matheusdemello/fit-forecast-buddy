
export interface Exercise {
  id: string;
  name: string;
  category: 'push' | 'pull' | 'legs' | 'core';
  muscle_groups: string[];
}

export interface WorkoutSet {
  id: string;
  exercise_id: string;
  reps: number;
  weight: number;
  rest_time?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  date: string;
  duration: number;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface WorkoutSuggestion {
  exercise_name: string;
  suggested_weight: number;
  suggested_reps: number;
  reason: string;
}
