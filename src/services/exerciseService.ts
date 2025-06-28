import { supabase, isOnline, generateUUID } from '../lib/supabase';
import { Exercise } from '../types/workout';
import { addToOfflineQueue } from './offlineService';

export class ExerciseService {
  /**
   * Fetch all exercises
   */
  static async getExercises(): Promise<Exercise[]> {
    try {
      if (!isOnline()) {
        // Return cached exercises from localStorage in offline mode
        const cached = localStorage.getItem('exercises_cache');
        return cached ? JSON.parse(cached) : [];
      }

      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching exercises:', error);
        // Fallback to cache if available
        const cached = localStorage.getItem('exercises_cache');
        return cached ? JSON.parse(cached) : [];
      }

      // Cache the results
      localStorage.setItem('exercises_cache', JSON.stringify(data));
      
      return data.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        muscle_groups: exercise.muscle_groups
      }));
    } catch (error) {
      console.error('Unexpected error fetching exercises:', error);
      const cached = localStorage.getItem('exercises_cache');
      return cached ? JSON.parse(cached) : [];
    }
  }

  /**
   * Create a new exercise
   */
  static async createExercise(exercise: Omit<Exercise, 'id'>): Promise<Exercise | null> {
    try {
      const exerciseData = {
        id: generateUUID(),
        name: exercise.name,
        category: exercise.category,
        muscle_groups: exercise.muscle_groups
      };

      if (!isOnline()) {
        // Add to offline queue
        await addToOfflineQueue('INSERT', 'exercises', exerciseData);
        
        // Add to local cache
        const cached = localStorage.getItem('exercises_cache');
        const exercises = cached ? JSON.parse(cached) : [];
        exercises.push(exerciseData);
        localStorage.setItem('exercises_cache', JSON.stringify(exercises));
        
        return exerciseData;
      }

      const { data, error } = await supabase
        .from('exercises')
        .insert(exerciseData)
        .select()
        .single();

      if (error) {
        console.error('Error creating exercise:', error);
        // Add to offline queue as fallback
        await addToOfflineQueue('INSERT', 'exercises', exerciseData);
        return exerciseData;
      }

      // Update cache
      const cached = localStorage.getItem('exercises_cache');
      const exercises = cached ? JSON.parse(cached) : [];
      exercises.push(data);
      localStorage.setItem('exercises_cache', JSON.stringify(exercises));

      return {
        id: data.id,
        name: data.name,
        category: data.category,
        muscle_groups: data.muscle_groups
      };
    } catch (error) {
      console.error('Unexpected error creating exercise:', error);
      return null;
    }
  }

  /**
   * Update an existing exercise
   */
  static async updateExercise(id: string, updates: Partial<Omit<Exercise, 'id'>>): Promise<boolean> {
    try {
      if (!isOnline()) {
        // Add to offline queue
        await addToOfflineQueue('UPDATE', 'exercises', { id, ...updates });
        
        // Update local cache
        const cached = localStorage.getItem('exercises_cache');
        const exercises = cached ? JSON.parse(cached) : [];
        const index = exercises.findIndex((ex: Exercise) => ex.id === id);
        if (index !== -1) {
          exercises[index] = { ...exercises[index], ...updates };
          localStorage.setItem('exercises_cache', JSON.stringify(exercises));
        }
        
        return true;
      }

      const { error } = await supabase
        .from('exercises')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating exercise:', error);
        // Add to offline queue as fallback
        await addToOfflineQueue('UPDATE', 'exercises', { id, ...updates });
        return false;
      }

      // Update cache
      const cached = localStorage.getItem('exercises_cache');
      const exercises = cached ? JSON.parse(cached) : [];
      const index = exercises.findIndex((ex: Exercise) => ex.id === id);
      if (index !== -1) {
        exercises[index] = { ...exercises[index], ...updates };
        localStorage.setItem('exercises_cache', JSON.stringify(exercises));
      }

      return true;
    } catch (error) {
      console.error('Unexpected error updating exercise:', error);
      return false;
    }
  }

  /**
   * Delete an exercise
   */
  static async deleteExercise(id: string): Promise<boolean> {
    try {
      if (!isOnline()) {
        // Add to offline queue
        await addToOfflineQueue('DELETE', 'exercises', { id });
        
        // Remove from local cache
        const cached = localStorage.getItem('exercises_cache');
        const exercises = cached ? JSON.parse(cached) : [];
        const filtered = exercises.filter((ex: Exercise) => ex.id !== id);
        localStorage.setItem('exercises_cache', JSON.stringify(filtered));
        
        return true;
      }

      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting exercise:', error);
        // Add to offline queue as fallback
        await addToOfflineQueue('DELETE', 'exercises', { id });
        return false;
      }

      // Remove from cache
      const cached = localStorage.getItem('exercises_cache');
      const exercises = cached ? JSON.parse(cached) : [];
      const filtered = exercises.filter((ex: Exercise) => ex.id !== id);
      localStorage.setItem('exercises_cache', JSON.stringify(filtered));

      return true;
    } catch (error) {
      console.error('Unexpected error deleting exercise:', error);
      return false;
    }
  }

  /**
   * Check if exercise name already exists
   */
  static async exerciseExists(name: string): Promise<boolean> {
    try {
      const exercises = await this.getExercises();
      return exercises.some(ex => ex.name.toLowerCase() === name.toLowerCase());
    } catch (error) {
      console.error('Error checking exercise existence:', error);
      return false;
    }
  }

  /**
   * Get exercise statistics
   */
  static async getExerciseStats() {
    try {
      if (!isOnline()) {
        // Return cached stats if available
        const cached = localStorage.getItem('exercise_stats_cache');
        return cached ? JSON.parse(cached) : [];
      }

      const { data, error } = await supabase
        .from('exercise_stats')
        .select('*')
        .order('workout_count', { ascending: false });

      if (error) {
        console.error('Error fetching exercise stats:', error);
        const cached = localStorage.getItem('exercise_stats_cache');
        return cached ? JSON.parse(cached) : [];
      }

      // Cache the results
      localStorage.setItem('exercise_stats_cache', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Unexpected error fetching exercise stats:', error);
      return [];
    }
  }
} 