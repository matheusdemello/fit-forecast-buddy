import { useState, useEffect } from 'react';
import { useDatabase } from './useDatabase';
import { Workout, WorkoutSet, Exercise, WorkoutSuggestion, WorkoutExercise, RPProgressionRecommendation } from '../types/workout';
import { getEnhancedWorkoutSuggestions, EnhancedWorkoutSuggestion } from '../utils/workoutSuggestions';
import { useRPProgression } from './useRPProgression';
import { v4 as uuidv4 } from 'uuid';

export const useWorkouts = () => {
  const { db, isReady } = useDatabase();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const { 
    initializeExerciseProgression, 
    getProgressionRecommendation, 
    logWorkout: logRPWorkout 
  } = useRPProgression();

  const loadExercises = async () => {
    if (!db || !isReady) return;
    
    try {
      const result = await db.query('SELECT * FROM exercises ORDER BY name');
      const exerciseData = result.values?.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        muscle_groups: JSON.parse(row.muscle_groups)
      })) || [];
      
      setExercises(exerciseData);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const loadWorkouts = async () => {
    if (!db || !isReady) return;
    
    setLoading(true);
    try {
      // Get workouts
      const workoutResult = await db.query('SELECT * FROM workouts ORDER BY date DESC LIMIT 20');
      
      // Get sets for each workout
      const workoutData: Workout[] = [];
      
      for (const workoutRow of workoutResult.values || []) {
        const setsResult = await db.query(
          'SELECT ws.*, e.name as exercise_name, e.category, e.muscle_groups FROM workout_sets ws JOIN exercises e ON ws.exercise_id = e.id WHERE ws.workout_id = ?',
          [workoutRow.id]
        );
        
        const exerciseMap = new Map();
        
        for (const setRow of setsResult.values || []) {
          const exerciseId = setRow.exercise_id;
          
          if (!exerciseMap.has(exerciseId)) {
            exerciseMap.set(exerciseId, {
              exercise: {
                id: exerciseId,
                name: setRow.exercise_name,
                category: setRow.category,
                muscle_groups: JSON.parse(setRow.muscle_groups)
              },
              sets: []
            });
          }
          
          exerciseMap.get(exerciseId).sets.push({
            id: setRow.id,
            exercise_id: setRow.exercise_id,
            reps: setRow.reps,
            weight: setRow.weight,
            rest_time: setRow.rest_time,
            notes: setRow.notes
          });
        }
        
        workoutData.push({
          id: workoutRow.id,
          date: workoutRow.date,
          duration: workoutRow.duration,
          exercises: Array.from(exerciseMap.values()),
          notes: workoutRow.notes
        });
      }
      
      setWorkouts(workoutData);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWorkout = async (workout: Omit<Workout, 'id'>) => {
    if (!db || !isReady) return;
    
    try {
      const workoutId = uuidv4();
      
      // Save workout with RP metrics
      await db.run(
        'INSERT INTO workouts (id, date, duration, notes, overall_fatigue, overall_soreness, session_rating) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [workoutId, workout.date, workout.duration, workout.notes || null, workout.overall_fatigue || null, workout.overall_soreness || null, workout.session_rating || null]
      );
      
      // Save sets with RIR
      for (const exerciseData of workout.exercises) {
        // Save exercise-level data if present
        if (exerciseData.pump_rating || exerciseData.performance_rating) {
          await db.run(
            'INSERT INTO workout_exercise_data (id, workout_id, exercise_id, pump_rating, performance_rating) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), workoutId, exerciseData.exercise.id, exerciseData.pump_rating || null, exerciseData.performance_rating || null]
          );
        }
        
        for (const set of exerciseData.sets) {
          await db.run(
            'INSERT INTO workout_sets (id, workout_id, exercise_id, reps, weight, rest_time, notes, rir) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), workoutId, exerciseData.exercise.id, set.reps, set.weight, set.rest_time || null, set.notes || null, set.rir || null]
          );
        }
      }
      
      await loadWorkouts();
      console.log('Workout saved successfully');
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  // Enhanced save workout with RP progression tracking
  const saveWorkoutWithRP = async (workout: Omit<Workout, 'id'>, exerciseData: WorkoutExercise[]) => {
    if (!db || !isReady) return;
    
    try {
      // Save the workout first
      await saveWorkout(workout);
      
      // Log with RP progression system
      const completeWorkout: Workout = {
        ...workout,
        id: uuidv4() // This would be the actual saved workout ID
      };
      
      await logRPWorkout(completeWorkout, exerciseData);
      
      console.log('Workout saved with RP progression tracking');
    } catch (error) {
      console.error('Error saving workout with RP progression:', error);
    }
  };

  const getWorkoutSuggestions = (exerciseId: string): WorkoutSuggestion[] => {
    const enhancedSuggestions = getEnhancedWorkoutSuggestions(exerciseId, exercises, workouts);
    
    // Convert enhanced suggestions to basic suggestions for backward compatibility
    return enhancedSuggestions.map(suggestion => ({
      exercise_name: suggestion.exercise_name,
      suggested_weight: suggestion.suggested_weight,
      suggested_reps: suggestion.suggested_reps,
      reason: `${suggestion.reason} (${Math.round(suggestion.confidence * 100)}% confidence)`
    }));
  };

  const getEnhancedSuggestions = (exerciseId: string): EnhancedWorkoutSuggestion[] => {
    return getEnhancedWorkoutSuggestions(exerciseId, exercises, workouts);
  };

  // Get RP-based progression recommendations
  const getRPRecommendation = async (exerciseId: string): Promise<RPProgressionRecommendation | null> => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;
    
    return await getProgressionRecommendation(exerciseId, exercise.name);
  };

  const addExercise = async (name: string, category: 'push' | 'pull' | 'legs' | 'core' = 'push'): Promise<Exercise | null> => {
    if (!db || !isReady) return null;
    
    // Check if exercise already exists
    const existingExercise = exercises.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (existingExercise) {
      return existingExercise;
    }
    
    try {
      const exerciseId = uuidv4();
      
      // Determine category and muscle groups based on exercise name
      const { detectedCategory, muscleGroups } = categorizeExercise(name, category);
      
      const newExercise: Exercise = {
        id: exerciseId,
        name: name.trim(),
        category: detectedCategory,
        muscle_groups: muscleGroups
      };
      
      // Save to database
      await db.run(
        'INSERT INTO exercises (id, name, category, muscle_groups) VALUES (?, ?, ?, ?)',
        [exerciseId, newExercise.name, newExercise.category, JSON.stringify(newExercise.muscle_groups)]
      );
      
      // Initialize RP progression for new exercise
      await initializeExerciseProgression(newExercise);
      
      // Refresh exercises list
      await loadExercises();
      
      return newExercise;
    } catch (error) {
      console.error('Error adding exercise:', error);
      return null;
    }
  };

  const deleteWorkout = async (workoutId: string): Promise<boolean> => {
    if (!db || !isReady) return false;
    
    try {
      // Delete workout sets first (foreign key constraint)
      await db.run('DELETE FROM workout_sets WHERE workout_id = ?', [workoutId]);
      
      // Delete the workout
      await db.run('DELETE FROM workouts WHERE id = ?', [workoutId]);
      
      // Refresh workouts list
      await loadWorkouts();
      
      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      return false;
    }
  };

  const updateWorkout = async (workoutId: string, updatedWorkout: Omit<Workout, 'id'>): Promise<boolean> => {
    if (!db || !isReady) return false;
    
    try {
      // Update workout basic info
      await db.run(
        'UPDATE workouts SET date = ?, duration = ?, notes = ? WHERE id = ?',
        [updatedWorkout.date, updatedWorkout.duration, updatedWorkout.notes || null, workoutId]
      );
      
      // Delete existing sets for this workout
      await db.run('DELETE FROM workout_sets WHERE workout_id = ?', [workoutId]);
      
      // Insert updated sets
      for (const exerciseData of updatedWorkout.exercises) {
        for (const set of exerciseData.sets) {
          await db.run(
            'INSERT INTO workout_sets (id, workout_id, exercise_id, reps, weight, rest_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [set.id || uuidv4(), workoutId, exerciseData.exercise.id, set.reps, set.weight, set.rest_time || null, set.notes || null]
          );
        }
      }
      
      // Refresh workouts list
      await loadWorkouts();
      
      return true;
    } catch (error) {
      console.error('Error updating workout:', error);
      return false;
    }
  };

  // Helper function to categorize exercises based on name
  const categorizeExercise = (name: string, defaultCategory: 'push' | 'pull' | 'legs' | 'core'): { detectedCategory: 'push' | 'pull' | 'legs' | 'core', muscleGroups: string[] } => {
    const lowerName = name.toLowerCase();
    
    // Push exercises
    if (lowerName.includes('press') || lowerName.includes('push') || lowerName.includes('dip') || 
        lowerName.includes('chest') || lowerName.includes('shoulder') || lowerName.includes('tricep')) {
      return { detectedCategory: 'push', muscleGroups: ['chest', 'shoulders', 'triceps'] };
    }
    
    // Pull exercises  
    if (lowerName.includes('pull') || lowerName.includes('row') || lowerName.includes('curl') ||
        lowerName.includes('chin') || lowerName.includes('lat') || lowerName.includes('back')) {
      return { detectedCategory: 'pull', muscleGroups: ['back', 'biceps'] };
    }
    
    // Leg exercises
    if (lowerName.includes('squat') || lowerName.includes('lunge') || lowerName.includes('deadlift') ||
        lowerName.includes('leg') || lowerName.includes('calf') || lowerName.includes('quad') ||
        lowerName.includes('glute') || lowerName.includes('hamstring')) {
      return { detectedCategory: 'legs', muscleGroups: ['quadriceps', 'hamstrings', 'glutes'] };
    }
    
    // Core exercises
    if (lowerName.includes('plank') || lowerName.includes('crunch') || lowerName.includes('abs') ||
        lowerName.includes('core') || lowerName.includes('sit-up')) {
      return { detectedCategory: 'core', muscleGroups: ['core', 'abs'] };
    }
    
    // Default fallback
    const defaultMuscleGroups: Record<string, string[]> = {
      'push': ['chest', 'shoulders', 'triceps'],
      'pull': ['back', 'biceps'],
      'legs': ['quadriceps', 'hamstrings', 'glutes'],
      'core': ['core', 'abs']
    };
    
    return { detectedCategory: defaultCategory, muscleGroups: defaultMuscleGroups[defaultCategory] };
  };

  useEffect(() => {
    if (isReady) {
      loadExercises();
      loadWorkouts();
    }
  }, [isReady]);

  return {
    workouts,
    exercises,
    loading,
    saveWorkout,
    saveWorkoutWithRP,
    getWorkoutSuggestions,
    getEnhancedSuggestions,
    getRPRecommendation,
    addExercise,
    deleteWorkout,
    updateWorkout,
    refreshWorkouts: loadWorkouts
  };
};
