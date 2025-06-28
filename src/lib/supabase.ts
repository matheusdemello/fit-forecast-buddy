import { createClient } from '@supabase/supabase-js';

// Define types for our database
export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string;
          name: string;
          category: 'push' | 'pull' | 'legs' | 'core';
          muscle_groups: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: 'push' | 'pull' | 'legs' | 'core';
          muscle_groups: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: 'push' | 'pull' | 'legs' | 'core';
          muscle_groups?: string[];
          updated_at?: string;
        };
      };
      workouts: {
        Row: {
          id: string;
          user_id: string | null;
          date: string;
          duration: number;
          notes: string | null;
          overall_fatigue: number | null;
          overall_soreness: number | null;
          session_rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          date: string;
          duration: number;
          notes?: string | null;
          overall_fatigue?: number | null;
          overall_soreness?: number | null;
          session_rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          date?: string;
          duration?: number;
          notes?: string | null;
          overall_fatigue?: number | null;
          overall_soreness?: number | null;
          session_rating?: number | null;
          updated_at?: string;
        };
      };
      workout_sets: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          reps: number;
          weight: number;
          rest_time: number | null;
          notes: string | null;
          rir: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          reps: number;
          weight: number;
          rest_time?: number | null;
          notes?: string | null;
          rir?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          exercise_id?: string;
          reps?: number;
          weight?: number;
          rest_time?: number | null;
          notes?: string | null;
          rir?: number | null;
          updated_at?: string;
        };
      };
      workout_exercise_data: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          pump_rating: number | null;
          performance_rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          pump_rating?: number | null;
          performance_rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          exercise_id?: string;
          pump_rating?: number | null;
          performance_rating?: number | null;
          updated_at?: string;
        };
      };
      rp_progression_state: {
        Row: {
          exercise_id: string;
          current_mesocycle_week: number;
          previous_sets: number;
          previous_weight: number;
          previous_rir_avg: number;
          rolling_fatigue_score: number;
          consecutive_weeks_progressing: number;
          last_deload_date: string | null;
          volume_landmark: 'MEV' | 'MAV' | 'MRV';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          exercise_id: string;
          current_mesocycle_week?: number;
          previous_sets?: number;
          previous_weight?: number;
          previous_rir_avg?: number;
          rolling_fatigue_score?: number;
          consecutive_weeks_progressing?: number;
          last_deload_date?: string | null;
          volume_landmark?: 'MEV' | 'MAV' | 'MRV';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          exercise_id?: string;
          current_mesocycle_week?: number;
          previous_sets?: number;
          previous_weight?: number;
          previous_rir_avg?: number;
          rolling_fatigue_score?: number;
          consecutive_weeks_progressing?: number;
          last_deload_date?: string | null;
          volume_landmark?: 'MEV' | 'MAV' | 'MRV';
          updated_at?: string;
        };
      };
      mesocycle_settings: {
        Row: {
          exercise_id: string;
          mev_sets: number;
          mav_sets: number;
          mrv_sets: number;
          deload_frequency_weeks: number;
          target_rir_min: number;
          target_rir_max: number;
          weight_increment: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          exercise_id: string;
          mev_sets?: number;
          mav_sets?: number;
          mrv_sets?: number;
          deload_frequency_weeks?: number;
          target_rir_min?: number;
          target_rir_max?: number;
          weight_increment?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          exercise_id?: string;
          mev_sets?: number;
          mav_sets?: number;
          mrv_sets?: number;
          deload_frequency_weeks?: number;
          target_rir_min?: number;
          target_rir_max?: number;
          weight_increment?: number;
          updated_at?: string;
        };
      };
      sync_queue: {
        Row: {
          id: string;
          operation_type: 'INSERT' | 'UPDATE' | 'DELETE';
          table_name: string;
          data: any;
          created_at: string;
          synced_at: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          operation_type: 'INSERT' | 'UPDATE' | 'DELETE';
          table_name: string;
          data: any;
          created_at?: string;
          synced_at?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          operation_type?: 'INSERT' | 'UPDATE' | 'DELETE';
          table_name?: string;
          data?: any;
          synced_at?: string | null;
          error_message?: string | null;
        };
      };
    };
    Views: {
      workout_summary: {
        Row: {
          id: string;
          date: string;
          duration: number;
          notes: string | null;
          overall_fatigue: number | null;
          overall_soreness: number | null;
          session_rating: number | null;
          exercise_count: number;
          total_sets: number;
          total_volume: number;
        };
      };
      exercise_stats: {
        Row: {
          id: string;
          name: string;
          category: string;
          muscle_groups: string[];
          workout_count: number;
          total_sets: number;
          max_weight: number;
          avg_weight: number;
          max_reps: number;
          avg_reps: number;
        };
      };
    };
  };
}

// Environment variables (add these to your .env file)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper function to check if we're online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Helper function to generate UUID (for offline operations)
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}; 