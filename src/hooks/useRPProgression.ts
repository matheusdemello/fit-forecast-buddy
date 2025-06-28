import { useState, useEffect } from 'react';
import { useDatabase } from './useDatabase';
import { 
  RPProgressionState, 
  RPWorkoutLog, 
  RPProgressionRecommendation, 
  MesocycleSettings,
  Exercise,
  Workout,
  WorkoutExercise 
} from '../types/workout';
import { RPProgressionEngine, getDefaultMesocycleSettings } from '../utils/rpProgressionEngine';
import { v4 as uuidv4 } from 'uuid';

export const useRPProgression = () => {
  const { db, isReady } = useDatabase();
  const [progressionStates, setProgressionStates] = useState<Record<string, RPProgressionState>>({});
  const [mesocycleSettings, setMesocycleSettings] = useState<Record<string, MesocycleSettings>>({});
  const [loading, setLoading] = useState(false);

  // Load progression data when database is ready
  useEffect(() => {
    if (isReady && db) {
      loadProgressionData();
    }
  }, [isReady, db]);

  /**
   * Load all progression states and settings from database
   */
  const loadProgressionData = async () => {
    if (!db || !isReady) return;

    setLoading(true);
    try {
      // Load progression states
      const statesResult = await db.query('SELECT * FROM rp_progression_state');
      const statesData: Record<string, RPProgressionState> = {};
      
      for (const row of statesResult.values || []) {
        statesData[row.exercise_id] = {
          exercise_id: row.exercise_id,
          current_mesocycle_week: row.current_mesocycle_week,
          previous_sets: row.previous_sets,
          previous_weight: row.previous_weight,
          previous_rir_avg: row.previous_rir_avg,
          rolling_fatigue_score: row.rolling_fatigue_score,
          consecutive_weeks_progressing: row.consecutive_weeks_progressing,
          last_deload_date: row.last_deload_date,
          volume_landmark: row.volume_landmark,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      }
      setProgressionStates(statesData);

      // Load mesocycle settings
      const settingsResult = await db.query('SELECT * FROM mesocycle_settings');
      const settingsData: Record<string, MesocycleSettings> = {};
      
      for (const row of settingsResult.values || []) {
        settingsData[row.exercise_id] = {
          exercise_id: row.exercise_id,
          mev_sets: row.mev_sets,
          mav_sets: row.mav_sets,
          mrv_sets: row.mrv_sets,
          deload_frequency_weeks: row.deload_frequency_weeks,
          target_rir_range: [row.target_rir_min, row.target_rir_max],
          weight_increment: row.weight_increment
        };
      }
      setMesocycleSettings(settingsData);

    } catch (error) {
      console.error('Error loading RP progression data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initialize progression tracking for a new exercise
   */
  const initializeExerciseProgression = async (exercise: Exercise): Promise<void> => {
    if (!db || !isReady) return;

    try {
      const now = new Date().toISOString();
      
      // Create default progression state
      const initialState: RPProgressionState = {
        exercise_id: exercise.id,
        current_mesocycle_week: 1,
        previous_sets: 3,
        previous_weight: 0,
        previous_rir_avg: 3,
        rolling_fatigue_score: 2,
        consecutive_weeks_progressing: 0,
        last_deload_date: undefined,
        volume_landmark: 'MEV',
        created_at: now,
        updated_at: now
      };

      // Create default settings
      const defaultSettings = getDefaultMesocycleSettings(exercise);

      // Insert into database
      await db.run(
        `INSERT OR REPLACE INTO rp_progression_state 
         (exercise_id, current_mesocycle_week, previous_sets, previous_weight, 
          previous_rir_avg, rolling_fatigue_score, consecutive_weeks_progressing, 
          last_deload_date, volume_landmark, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          initialState.exercise_id,
          initialState.current_mesocycle_week,
          initialState.previous_sets,
          initialState.previous_weight,
          initialState.previous_rir_avg,
          initialState.rolling_fatigue_score,
          initialState.consecutive_weeks_progressing,
          initialState.last_deload_date,
          initialState.volume_landmark,
          initialState.created_at,
          initialState.updated_at
        ]
      );

      await db.run(
        `INSERT OR REPLACE INTO mesocycle_settings 
         (exercise_id, mev_sets, mav_sets, mrv_sets, deload_frequency_weeks, 
          target_rir_min, target_rir_max, weight_increment) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          defaultSettings.exercise_id,
          defaultSettings.mev_sets,
          defaultSettings.mav_sets,
          defaultSettings.mrv_sets,
          defaultSettings.deload_frequency_weeks,
          defaultSettings.target_rir_range[0],
          defaultSettings.target_rir_range[1],
          defaultSettings.weight_increment
        ]
      );

      // Update local state
      setProgressionStates(prev => ({ ...prev, [exercise.id]: initialState }));
      setMesocycleSettings(prev => ({ ...prev, [exercise.id]: defaultSettings }));

    } catch (error) {
      console.error('Error initializing exercise progression:', error);
    }
  };

  /**
   * Get progression recommendation for an exercise
   */
  const getProgressionRecommendation = async (exerciseId: string, exerciseName: string): Promise<RPProgressionRecommendation | null> => {
    if (!db || !isReady) return null;

    try {
      // Get workout logs for this exercise
      const logs = await getExerciseLogs(exerciseId);
      
      // Get or create progression state
      let state = progressionStates[exerciseId];
      if (!state) {
        // Initialize if not exists (this shouldn't happen but just in case)
        console.warn(`No progression state found for exercise ${exerciseId}, creating default`);
        return null;
      }

      // Get settings
      const settings = mesocycleSettings[exerciseId];
      if (!settings) {
        console.warn(`No mesocycle settings found for exercise ${exerciseId}`);
        return null;
      }

      // Generate recommendation using RP engine
      const recommendation = RPProgressionEngine.generateRecommendation(
        exerciseId,
        exerciseName,
        logs,
        state,
        settings
      );

      return recommendation;

    } catch (error) {
      console.error('Error getting progression recommendation:', error);
      return null;
    }
  };

  /**
   * Log a completed workout and update progression state
   */
  const logWorkout = async (
    workout: Workout,
    exerciseData: WorkoutExercise[]
  ): Promise<void> => {
    if (!db || !isReady) return;

    try {
      for (const exerciseWorkout of exerciseData) {
        const exerciseId = exerciseWorkout.exercise.id;
        
        // Calculate metrics from sets
        const sets = exerciseWorkout.sets;
        const avgReps = sets.reduce((sum, set) => sum + set.reps, 0) / sets.length;
        const avgRIR = sets.reduce((sum, set) => sum + (set.rir || 3), 0) / sets.length;
        const maxWeight = Math.max(...sets.map(set => set.weight));

        // Create workout log
        const workoutLog: RPWorkoutLog = {
          exercise_id: exerciseId,
          date: workout.date,
          sets: sets.length,
          avg_reps: Math.round(avgReps),
          weight: maxWeight,
          avg_rir: Math.round(avgRIR * 10) / 10,
          fatigue: workout.overall_fatigue || 2,
          soreness: workout.overall_soreness || 2,
          pump: exerciseWorkout.pump_rating || 3,
          performance: exerciseWorkout.performance_rating || 3
        };

        // Get current state and settings
        const currentState = progressionStates[exerciseId];
        const settings = mesocycleSettings[exerciseId];

        if (!currentState || !settings) {
          console.warn(`Missing progression data for exercise ${exerciseId}`);
          continue;
        }

        // Generate recommendation to help update state
        const recommendation = RPProgressionEngine.generateRecommendation(
          exerciseId,
          exerciseWorkout.exercise.name,
          [workoutLog], // Just the current log for state update
          currentState,
          settings
        );

        // Update progression state
        const updatedState = RPProgressionEngine.updateProgressionState(
          currentState,
          workoutLog,
          recommendation
        );

        // Save updated state to database
        await db.run(
          `UPDATE rp_progression_state 
           SET current_mesocycle_week = ?, previous_sets = ?, previous_weight = ?, 
               previous_rir_avg = ?, rolling_fatigue_score = ?, 
               consecutive_weeks_progressing = ?, last_deload_date = ?, 
               volume_landmark = ?, updated_at = ?
           WHERE exercise_id = ?`,
          [
            updatedState.current_mesocycle_week,
            updatedState.previous_sets,
            updatedState.previous_weight,
            updatedState.previous_rir_avg,
            updatedState.rolling_fatigue_score,
            updatedState.consecutive_weeks_progressing,
            updatedState.last_deload_date,
            updatedState.volume_landmark,
            updatedState.updated_at,
            exerciseId
          ]
        );

        // Update local state
        setProgressionStates(prev => ({ ...prev, [exerciseId]: updatedState }));
      }

    } catch (error) {
      console.error('Error logging workout for RP progression:', error);
    }
  };

  /**
   * Get exercise workout logs for RP analysis
   */
  const getExerciseLogs = async (exerciseId: string, limit = 10): Promise<RPWorkoutLog[]> => {
    if (!db || !isReady) return [];

    try {
      // Get recent workouts for this exercise
      const result = await db.query(
        `SELECT w.id, w.date, w.overall_fatigue, w.overall_soreness, w.session_rating,
                wed.pump_rating, wed.performance_rating,
                ws.reps, ws.weight, ws.rir
         FROM workouts w
         JOIN workout_sets ws ON w.id = ws.workout_id
         LEFT JOIN workout_exercise_data wed ON w.id = wed.workout_id AND ws.exercise_id = wed.exercise_id
         WHERE ws.exercise_id = ?
         ORDER BY w.date DESC
         LIMIT ?`,
        [exerciseId, limit * 10] // Get more sets to group by workout
      );

      // Group sets by workout and calculate averages
      const workoutGroups: Record<string, any[]> = {};
      
      for (const row of result.values || []) {
        const workoutKey = `${row.id}_${row.date}`;
        if (!workoutGroups[workoutKey]) {
          workoutGroups[workoutKey] = [];
        }
        workoutGroups[workoutKey].push(row);
      }

      // Convert to RPWorkoutLog format
      const logs: RPWorkoutLog[] = [];
      
      for (const [, sets] of Object.entries(workoutGroups)) {
        if (sets.length === 0) continue;
        
        const firstSet = sets[0];
        const avgReps = sets.reduce((sum, set) => sum + set.reps, 0) / sets.length;
        const avgRIR = sets.reduce((sum, set) => sum + (set.rir || 3), 0) / sets.length;
        const maxWeight = Math.max(...sets.map(set => set.weight));

        logs.push({
          exercise_id: exerciseId,
          date: firstSet.date,
          sets: sets.length,
          avg_reps: Math.round(avgReps),
          weight: maxWeight,
          avg_rir: Math.round(avgRIR * 10) / 10,
          fatigue: firstSet.overall_fatigue || 2,
          soreness: firstSet.overall_soreness || 2,
          pump: firstSet.pump_rating || 3,
          performance: firstSet.performance_rating || 3
        });
      }

      return logs.slice(0, limit).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    } catch (error) {
      console.error('Error getting exercise logs:', error);
      return [];
    }
  };

  /**
   * Update mesocycle settings for an exercise
   */
  const updateMesocycleSettings = async (
    exerciseId: string, 
    settings: Partial<MesocycleSettings>
  ): Promise<void> => {
    if (!db || !isReady) return;

    try {
      const currentSettings = mesocycleSettings[exerciseId];
      if (!currentSettings) return;

      const updatedSettings = { ...currentSettings, ...settings };

      await db.run(
        `UPDATE mesocycle_settings 
         SET mev_sets = ?, mav_sets = ?, mrv_sets = ?, deload_frequency_weeks = ?, 
             target_rir_min = ?, target_rir_max = ?, weight_increment = ?
         WHERE exercise_id = ?`,
        [
          updatedSettings.mev_sets,
          updatedSettings.mav_sets,
          updatedSettings.mrv_sets,
          updatedSettings.deload_frequency_weeks,
          updatedSettings.target_rir_range[0],
          updatedSettings.target_rir_range[1],
          updatedSettings.weight_increment,
          exerciseId
        ]
      );

      setMesocycleSettings(prev => ({ ...prev, [exerciseId]: updatedSettings }));

    } catch (error) {
      console.error('Error updating mesocycle settings:', error);
    }
  };

  /**
   * Get progression overview for all exercises
   */
  const getProgressionOverview = () => {
    return Object.entries(progressionStates).map(([exerciseId, state]) => ({
      exerciseId,
      currentWeek: state.current_mesocycle_week,
      volumeLandmark: state.volume_landmark,
      rollingFatigue: state.rolling_fatigue_score,
      weeksProgressing: state.consecutive_weeks_progressing,
      lastDeload: state.last_deload_date
    }));
  };

  return {
    // State
    progressionStates,
    mesocycleSettings,
    loading,
    
    // Actions
    initializeExerciseProgression,
    getProgressionRecommendation,
    logWorkout,
    getExerciseLogs,
    updateMesocycleSettings,
    getProgressionOverview,
    loadProgressionData
  };
}; 