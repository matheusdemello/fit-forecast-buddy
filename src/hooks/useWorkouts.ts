
import { useState, useEffect } from 'react';
import { useDatabase } from './useDatabase';
import { Workout, WorkoutSet, Exercise, WorkoutSuggestion } from '../types/workout';
import { v4 as uuidv4 } from 'uuid';

export const useWorkouts = () => {
  const { db, isReady } = useDatabase();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

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
      
      // Save workout
      await db.run(
        'INSERT INTO workouts (id, date, duration, notes) VALUES (?, ?, ?, ?)',
        [workoutId, workout.date, workout.duration, workout.notes || null]
      );
      
      // Save sets
      for (const exerciseData of workout.exercises) {
        for (const set of exerciseData.sets) {
          await db.run(
            'INSERT INTO workout_sets (id, workout_id, exercise_id, reps, weight, rest_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), workoutId, exerciseData.exercise.id, set.reps, set.weight, set.rest_time || null, set.notes || null]
          );
        }
      }
      
      await loadWorkouts();
      console.log('Workout saved successfully');
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const getWorkoutSuggestions = (exerciseId: string): WorkoutSuggestion[] => {
    const suggestions: WorkoutSuggestion[] = [];
    
    // Find recent workouts with this exercise
    const recentSets = workouts
      .flatMap(w => w.exercises)
      .filter(e => e.exercise.id === exerciseId)
      .flatMap(e => e.sets)
      .slice(0, 10);
    
    if (recentSets.length === 0) {
      const exercise = exercises.find(e => e.id === exerciseId);
      return [{
        exercise_name: exercise?.name || 'Unknown',
        suggested_weight: 20,
        suggested_reps: 8,
        reason: 'Starting suggestion'
      }];
    }
    
    // Calculate progression
    const avgWeight = recentSets.reduce((sum, set) => sum + set.weight, 0) / recentSets.length;
    const avgReps = recentSets.reduce((sum, set) => sum + set.reps, 0) / recentSets.length;
    const lastWeight = recentSets[0]?.weight || avgWeight;
    
    const exercise = exercises.find(e => e.id === exerciseId);
    
    // Suggest slight progression
    suggestions.push({
      exercise_name: exercise?.name || 'Unknown',
      suggested_weight: Math.round((lastWeight + 2.5) * 2) / 2, // Round to nearest 2.5
      suggested_reps: Math.round(avgReps),
      reason: 'Progressive overload (+2.5kg)'
    });
    
    return suggestions;
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
    getWorkoutSuggestions,
    refreshWorkouts: loadWorkouts
  };
};
