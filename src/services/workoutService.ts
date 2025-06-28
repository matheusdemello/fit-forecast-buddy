import { supabase, isOnline, generateUUID } from '../lib/supabase';
import { Workout, WorkoutExercise, WorkoutSet } from '../types/workout';
import { addToOfflineQueue } from './offlineService';

export class WorkoutService {
  /**
   * Fetch workouts with their exercises and sets
   */
  static async getWorkouts(limit = 20): Promise<Workout[]> {
    try {
      if (!isOnline()) {
        // Return cached workouts from localStorage in offline mode
        const cached = localStorage.getItem('workouts_cache');
        return cached ? JSON.parse(cached) : [];
      }

      // Get workouts sorted by date
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError);
        const cached = localStorage.getItem('workouts_cache');
        return cached ? JSON.parse(cached) : [];
      }

      // Get all workout IDs to fetch sets
      const workoutIds = workoutsData.map(w => w.id);
      
      if (workoutIds.length === 0) {
        return [];
      }

      // Get workout sets with exercise data
      const { data: setsData, error: setsError } = await supabase
        .from('workout_sets')
        .select(`
          *,
          exercises:exercise_id (
            id,
            name,
            category,
            muscle_groups
          )
        `)
        .in('workout_id', workoutIds);

      if (setsError) {
        console.error('Error fetching workout sets:', setsError);
      }

      // Get workout exercise data (pump/performance ratings)
      const { data: exerciseData, error: exerciseDataError } = await supabase
        .from('workout_exercise_data')
        .select('*')
        .in('workout_id', workoutIds);

      if (exerciseDataError) {
        console.error('Error fetching workout exercise data:', exerciseDataError);
      }

      // Combine data into workout structure
      const workouts: Workout[] = workoutsData.map(workout => {
        const workoutSets = setsData?.filter(set => set.workout_id === workout.id) || [];
        const workoutExerciseData = exerciseData?.filter(data => data.workout_id === workout.id) || [];
        
        // Group sets by exercise
        const exerciseMap = new Map<string, WorkoutExercise>();
        
        workoutSets.forEach(set => {
          const exerciseId = set.exercise_id;
          const exercise = set.exercises;
          
          if (!exerciseMap.has(exerciseId)) {
            const exerciseRatingData = workoutExerciseData.find(data => data.exercise_id === exerciseId);
            
            exerciseMap.set(exerciseId, {
              exercise: {
                id: exercise.id,
                name: exercise.name,
                category: exercise.category,
                muscle_groups: exercise.muscle_groups
              },
              sets: [],
              pump_rating: exerciseRatingData?.pump_rating || undefined,
              performance_rating: exerciseRatingData?.performance_rating || undefined
            });
          }
          
          exerciseMap.get(exerciseId)!.sets.push({
            id: set.id,
            exercise_id: set.exercise_id,
            reps: set.reps,
            weight: set.weight,
            rest_time: set.rest_time || undefined,
            notes: set.notes || undefined,
            rir: set.rir || undefined
          });
        });

        return {
          id: workout.id,
          date: workout.date,
          duration: workout.duration,
          exercises: Array.from(exerciseMap.values()),
          notes: workout.notes || undefined,
          overall_fatigue: workout.overall_fatigue || undefined,
          overall_soreness: workout.overall_soreness || undefined,
          session_rating: workout.session_rating || undefined
        };
      });

      // Cache the results
      localStorage.setItem('workouts_cache', JSON.stringify(workouts));
      
      return workouts;
    } catch (error) {
      console.error('Unexpected error fetching workouts:', error);
      const cached = localStorage.getItem('workouts_cache');
      return cached ? JSON.parse(cached) : [];
    }
  }

  /**
   * Save a new workout
   */
  static async saveWorkout(workout: Omit<Workout, 'id'>): Promise<string | null> {
    try {
      const workoutId = generateUUID();
      const workoutData = {
        id: workoutId,
        date: workout.date,
        duration: workout.duration,
        notes: workout.notes || null,
        overall_fatigue: workout.overall_fatigue || null,
        overall_soreness: workout.overall_soreness || null,
        session_rating: workout.session_rating || null
      };

      if (!isOnline()) {
        // Add to offline queue
        await addToOfflineQueue('INSERT', 'workouts', workoutData);
        
        // Save sets to offline queue
        for (const exerciseData of workout.exercises) {
          // Save exercise-level data if present
          if (exerciseData.pump_rating || exerciseData.performance_rating) {
            await addToOfflineQueue('INSERT', 'workout_exercise_data', {
              id: generateUUID(),
              workout_id: workoutId,
              exercise_id: exerciseData.exercise.id,
              pump_rating: exerciseData.pump_rating || null,
              performance_rating: exerciseData.performance_rating || null
            });
          }
          
          // Save sets
          for (const set of exerciseData.sets) {
            await addToOfflineQueue('INSERT', 'workout_sets', {
              id: set.id || generateUUID(),
              workout_id: workoutId,
              exercise_id: exerciseData.exercise.id,
              reps: set.reps,
              weight: set.weight,
              rest_time: set.rest_time || null,
              notes: set.notes || null,
              rir: set.rir || null
            });
          }
        }
        
        // Update local cache
        const cached = localStorage.getItem('workouts_cache');
        const workouts = cached ? JSON.parse(cached) : [];
        workouts.unshift({ ...workout, id: workoutId });
        localStorage.setItem('workouts_cache', JSON.stringify(workouts));
        
        return workoutId;
      }

      // Save workout
      const { error: workoutError } = await supabase
        .from('workouts')
        .insert(workoutData);

      if (workoutError) {
        console.error('Error saving workout:', workoutError);
        // Add to offline queue as fallback
        await addToOfflineQueue('INSERT', 'workouts', workoutData);
        return workoutId;
      }

      // Save sets and exercise data
      for (const exerciseData of workout.exercises) {
        // Save exercise-level data if present
        if (exerciseData.pump_rating || exerciseData.performance_rating) {
          const { error: exerciseDataError } = await supabase
            .from('workout_exercise_data')
            .insert({
              id: generateUUID(),
              workout_id: workoutId,
              exercise_id: exerciseData.exercise.id,
              pump_rating: exerciseData.pump_rating || null,
              performance_rating: exerciseData.performance_rating || null
            });

          if (exerciseDataError) {
            console.error('Error saving exercise data:', exerciseDataError);
          }
        }
        
        // Save sets
        const setsToInsert = exerciseData.sets.map(set => ({
          id: set.id || generateUUID(),
          workout_id: workoutId,
          exercise_id: exerciseData.exercise.id,
          reps: set.reps,
          weight: set.weight,
          rest_time: set.rest_time || null,
          notes: set.notes || null,
          rir: set.rir || null
        }));

        const { error: setsError } = await supabase
          .from('workout_sets')
          .insert(setsToInsert);

        if (setsError) {
          console.error('Error saving workout sets:', setsError);
          // Add sets to offline queue as fallback
          for (const setData of setsToInsert) {
            await addToOfflineQueue('INSERT', 'workout_sets', setData);
          }
        }
      }

      // Update local cache
      const cached = localStorage.getItem('workouts_cache');
      const workouts = cached ? JSON.parse(cached) : [];
      workouts.unshift({ ...workout, id: workoutId });
      localStorage.setItem('workouts_cache', JSON.stringify(workouts));

      return workoutId;
    } catch (error) {
      console.error('Unexpected error saving workout:', error);
      return null;
    }
  }

  /**
   * Update an existing workout
   */
  static async updateWorkout(workoutId: string, updatedWorkout: Omit<Workout, 'id'>): Promise<boolean> {
    try {
      const workoutData = {
        date: updatedWorkout.date,
        duration: updatedWorkout.duration,
        notes: updatedWorkout.notes || null,
        overall_fatigue: updatedWorkout.overall_fatigue || null,
        overall_soreness: updatedWorkout.overall_soreness || null,
        session_rating: updatedWorkout.session_rating || null
      };

      if (!isOnline()) {
        // Add to offline queue
        await addToOfflineQueue('UPDATE', 'workouts', { id: workoutId, ...workoutData });
        
        // Update sets in offline queue
        await addToOfflineQueue('DELETE', 'workout_sets', { workout_id: workoutId });
        await addToOfflineQueue('DELETE', 'workout_exercise_data', { workout_id: workoutId });
        
        // Re-add all sets and exercise data
        for (const exerciseData of updatedWorkout.exercises) {
          if (exerciseData.pump_rating || exerciseData.performance_rating) {
            await addToOfflineQueue('INSERT', 'workout_exercise_data', {
              id: generateUUID(),
              workout_id: workoutId,
              exercise_id: exerciseData.exercise.id,
              pump_rating: exerciseData.pump_rating || null,
              performance_rating: exerciseData.performance_rating || null
            });
          }
          
          for (const set of exerciseData.sets) {
            await addToOfflineQueue('INSERT', 'workout_sets', {
              id: set.id || generateUUID(),
              workout_id: workoutId,
              exercise_id: exerciseData.exercise.id,
              reps: set.reps,
              weight: set.weight,
              rest_time: set.rest_time || null,
              notes: set.notes || null,
              rir: set.rir || null
            });
          }
        }
        
        return true;
      }

      // Update workout
      const { error: workoutError } = await supabase
        .from('workouts')
        .update(workoutData)
        .eq('id', workoutId);

      if (workoutError) {
        console.error('Error updating workout:', workoutError);
        return false;
      }

      // Delete existing sets and exercise data
      await supabase.from('workout_sets').delete().eq('workout_id', workoutId);
      await supabase.from('workout_exercise_data').delete().eq('workout_id', workoutId);

      // Re-insert sets and exercise data
      for (const exerciseData of updatedWorkout.exercises) {
        if (exerciseData.pump_rating || exerciseData.performance_rating) {
          await supabase
            .from('workout_exercise_data')
            .insert({
              id: generateUUID(),
              workout_id: workoutId,
              exercise_id: exerciseData.exercise.id,
              pump_rating: exerciseData.pump_rating || null,
              performance_rating: exerciseData.performance_rating || null
            });
        }
        
        const setsToInsert = exerciseData.sets.map(set => ({
          id: set.id || generateUUID(),
          workout_id: workoutId,
          exercise_id: exerciseData.exercise.id,
          reps: set.reps,
          weight: set.weight,
          rest_time: set.rest_time || null,
          notes: set.notes || null,
          rir: set.rir || null
        }));

        await supabase.from('workout_sets').insert(setsToInsert);
      }

      // Update cache
      const cached = localStorage.getItem('workouts_cache');
      const workouts = cached ? JSON.parse(cached) : [];
      const index = workouts.findIndex((w: Workout) => w.id === workoutId);
      if (index !== -1) {
        workouts[index] = { ...updatedWorkout, id: workoutId };
        localStorage.setItem('workouts_cache', JSON.stringify(workouts));
      }

      return true;
    } catch (error) {
      console.error('Unexpected error updating workout:', error);
      return false;
    }
  }

  /**
   * Delete a workout
   */
  static async deleteWorkout(workoutId: string): Promise<boolean> {
    try {
      if (!isOnline()) {
        // Add to offline queue
        await addToOfflineQueue('DELETE', 'workouts', { id: workoutId });
        
        // Remove from local cache
        const cached = localStorage.getItem('workouts_cache');
        const workouts = cached ? JSON.parse(cached) : [];
        const filtered = workouts.filter((w: Workout) => w.id !== workoutId);
        localStorage.setItem('workouts_cache', JSON.stringify(filtered));
        
        return true;
      }

      // Delete workout (cascading deletes will handle sets and exercise data)
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (error) {
        console.error('Error deleting workout:', error);
        return false;
      }

      // Remove from cache
      const cached = localStorage.getItem('workouts_cache');
      const workouts = cached ? JSON.parse(cached) : [];
      const filtered = workouts.filter((w: Workout) => w.id !== workoutId);
      localStorage.setItem('workouts_cache', JSON.stringify(filtered));

      return true;
    } catch (error) {
      console.error('Unexpected error deleting workout:', error);
      return false;
    }
  }

  /**
   * Get workout summary statistics
   */
  static async getWorkoutSummary() {
    try {
      if (!isOnline()) {
        const cached = localStorage.getItem('workout_summary_cache');
        return cached ? JSON.parse(cached) : [];
      }

      const { data, error } = await supabase
        .from('workout_summary')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching workout summary:', error);
        const cached = localStorage.getItem('workout_summary_cache');
        return cached ? JSON.parse(cached) : [];
      }

      localStorage.setItem('workout_summary_cache', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Unexpected error fetching workout summary:', error);
      return [];
    }
  }

  /**
   * Get exercise logs for RP progression analysis
   */
  static async getExerciseLogs(exerciseId: string, limit = 10) {
    try {
      if (!isOnline()) {
        // For offline, try to reconstruct from cached workouts
        const cached = localStorage.getItem('workouts_cache');
        const workouts: Workout[] = cached ? JSON.parse(cached) : [];
        
        const logs = workouts
          .flatMap(workout => 
            workout.exercises
              .filter(ex => ex.exercise.id === exerciseId)
              .map(ex => ({
                workout_id: workout.id,
                date: workout.date,
                exercise_data: ex,
                overall_fatigue: workout.overall_fatigue,
                overall_soreness: workout.overall_soreness,
                session_rating: workout.session_rating
              }))
          )
          .slice(0, limit);
        
        return logs;
      }

      const { data, error } = await supabase
        .from('workout_sets')
        .select(`
          *,
          workouts:workout_id (
            id,
            date,
            overall_fatigue,
            overall_soreness,
            session_rating
          ),
          workout_exercise_data!inner (
            pump_rating,
            performance_rating
          )
        `)
        .eq('exercise_id', exerciseId)
        .order('workouts(date)', { ascending: false })
        .limit(limit * 10);

      if (error) {
        console.error('Error fetching exercise logs:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching exercise logs:', error);
      return [];
    }
  }
} 