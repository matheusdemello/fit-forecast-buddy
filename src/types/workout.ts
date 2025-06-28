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
  // RP Progression metrics
  rir?: number; // Reps in Reserve (0-4)
}

export interface Workout {
  id: string;
  date: string;
  duration: number;
  exercises: WorkoutExercise[];
  notes?: string;
  // RP Session metrics
  overall_fatigue?: number; // 1-5 scale
  overall_soreness?: number; // 1-5 scale
  session_rating?: number; // 1-5 scale
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: WorkoutSet[];
  // RP Exercise metrics
  pump_rating?: number; // 1-5 scale
  performance_rating?: number; // 1-5 scale
}

export interface WorkoutSuggestion {
  exercise_name: string;
  suggested_weight: number;
  suggested_reps: number;
  reason: string;
}

// RP Progression Engine Types
export interface RPProgressionState {
  exercise_id: string;
  current_mesocycle_week: number;
  previous_sets: number;
  previous_weight: number;
  previous_rir_avg: number;
  rolling_fatigue_score: number;
  consecutive_weeks_progressing: number;
  last_deload_date?: string;
  volume_landmark: 'MEV' | 'MAV' | 'MRV'; // Minimum Effective, Maximum Adaptive, Maximum Recoverable
  created_at: string;
  updated_at: string;
}

export interface RPWorkoutLog {
  exercise_id: string;
  date: string;
  sets: number;
  avg_reps: number;
  weight: number;
  avg_rir: number;
  fatigue: number;
  soreness: number;
  pump: number;
  performance: number;
}

export interface RPProgressionRecommendation {
  exercise_id: string;
  exercise_name: string;
  recommended_sets: number;
  recommended_weight: number;
  target_rir: number;
  target_reps: number;
  rest_time: number;
  progression_type: 'weight' | 'volume' | 'deload' | 'maintain';
  confidence: number;
  reasoning: string;
  deload_week?: boolean;
  mesocycle_phase: 'accumulation' | 'intensification' | 'deload' | 'reset';
}

export interface MesocycleSettings {
  exercise_id: string;
  mev_sets: number; // Minimum Effective Volume
  mav_sets: number; // Maximum Adaptive Volume  
  mrv_sets: number; // Maximum Recoverable Volume
  deload_frequency_weeks: number; // Typically 4-6 weeks
  target_rir_range: [number, number]; // e.g., [1, 3]
  weight_increment: number; // kg increment per progression
}
