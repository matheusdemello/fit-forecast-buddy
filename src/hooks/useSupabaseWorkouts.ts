import { useState, useEffect } from 'react';
import { Workout, Exercise } from '../types/workout';
import { ExerciseService } from '../services/exerciseService';
import { WorkoutService } from '../services/workoutService';
import { setupAutoSync, syncOfflineOperations } from '../services/offlineService';
import { useAuth } from './useAuth';

export const useSupabaseWorkouts = () => {
  const { getCurrentUserId, isAuthenticated } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(true); // Supabase is ready immediately

  // Security check: Only proceed if user is authenticated
  const userId = getCurrentUserId();
  const isUserAuthenticated = isAuthenticated && userId;

  // Initialize auto-sync for offline operations
  useEffect(() => {
    if (!isUserAuthenticated) {
      console.log('User not authenticated, skipping data loading');
      return;
    }

    setupAutoSync();
    
    // Attempt initial sync
    syncOfflineOperations().then(result => {
      if (result.success > 0) {
        console.log(`Synced ${result.success} offline operations on startup`);
        // Reload data after successful sync
        loadWorkouts();
        loadExercises();
      }
    });

    // Load initial data
    loadWorkouts();
    loadExercises();
  }, [isUserAuthenticated, userId]);

  /**
   * Default exercises for immediate app functionality
   */
  const defaultExercises = [
    { name: 'Push-ups', category: 'push' as const, muscle_groups: ['chest', 'triceps', 'shoulders'] },
    { name: 'Pull-ups', category: 'pull' as const, muscle_groups: ['lats', 'biceps', 'middle traps'] },
    { name: 'Squats', category: 'legs' as const, muscle_groups: ['quads', 'glutes', 'hamstrings'] },
    { name: 'Deadlifts', category: 'legs' as const, muscle_groups: ['hamstrings', 'glutes', 'lower back'] },
    { name: 'Bench Press', category: 'push' as const, muscle_groups: ['chest', 'triceps', 'shoulders'] },
    { name: 'Rows', category: 'pull' as const, muscle_groups: ['lats', 'rhomboids', 'biceps'] },
    { name: 'Overhead Press', category: 'push' as const, muscle_groups: ['shoulders', 'triceps', 'upper chest'] },
    { name: 'Lunges', category: 'legs' as const, muscle_groups: ['quads', 'glutes', 'hamstrings'] },
    { name: 'Plank', category: 'core' as const, muscle_groups: ['abs', 'obliques', 'lower back'] },
    { name: 'Bicep Curls', category: 'pull' as const, muscle_groups: ['biceps', 'forearms'] }
  ];

  /**
   * Load exercises from Supabase
   */
  const loadExercises = async () => {
    try {
      const exerciseData = await ExerciseService.getExercises();
      
      // If no exercises exist, create defaults
      if (exerciseData.length === 0) {
        console.log('No exercises found, creating defaults...');
        const createdExercises = [];
        
        for (const defaultEx of defaultExercises) {
          const newExercise = await ExerciseService.createExercise(defaultEx);
          if (newExercise) {
            createdExercises.push(newExercise);
          }
        }
        
        setExercises(createdExercises);
        console.log(`Created ${createdExercises.length} default exercises`);
      } else {
        setExercises(exerciseData);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
      // Fallback to in-memory defaults if everything fails
      const fallbackExercises = defaultExercises.map((ex, index) => ({
        id: `default-${index}`,
        ...ex
      }));
      setExercises(fallbackExercises);
    }
  };

  /**
   * Load workouts from Supabase
   */
  const loadWorkouts = async () => {
    setLoading(true);
    try {
      const workoutData = await WorkoutService.getWorkouts(20);
      setWorkouts(workoutData);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save a new workout
   */
  const saveWorkout = async (workout: Omit<Workout, 'id'>) => {
    try {
      const workoutId = await WorkoutService.saveWorkout(workout);
      if (workoutId) {
        await loadWorkouts(); // Reload to get updated data
        console.log('Workout saved successfully');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  /**
   * Update an existing workout
   */
  const updateWorkout = async (workoutId: string, updatedWorkout: Omit<Workout, 'id'>): Promise<boolean> => {
    try {
      const success = await WorkoutService.updateWorkout(workoutId, updatedWorkout);
      if (success) {
        await loadWorkouts(); // Reload to get updated data
        console.log('Workout updated successfully');
      }
      return success;
    } catch (error) {
      console.error('Error updating workout:', error);
      return false;
    }
  };

  /**
   * Delete a workout
   */
  const deleteWorkout = async (workoutId: string): Promise<boolean> => {
    try {
      const success = await WorkoutService.deleteWorkout(workoutId);
      if (success) {
        await loadWorkouts(); // Reload to get updated data
        console.log('Workout deleted successfully');
      }
      return success;
    } catch (error) {
      console.error('Error deleting workout:', error);
      return false;
    }
  };

  /**
   * Add a new exercise
   */
  const addExercise = async (name: string, category: 'push' | 'pull' | 'legs' | 'core' = 'push'): Promise<Exercise | null> => {
    try {
      // Check if exercise already exists
      const exists = await ExerciseService.exerciseExists(name);
      if (exists) {
        const existingExercise = exercises.find(e => e.name.toLowerCase() === name.toLowerCase());
        return existingExercise || null;
      }

      // Determine category and muscle groups based on exercise name
      const { detectedCategory, muscleGroups } = categorizeExercise(name, category);
      
      const newExercise = await ExerciseService.createExercise({
        name: name.trim(),
        category: detectedCategory,
        muscle_groups: muscleGroups
      });

      if (newExercise) {
        await loadExercises(); // Reload to get updated data
        console.log('Exercise created successfully');
      }

      return newExercise;
    } catch (error) {
      console.error('Error adding exercise:', error);
      return null;
    }
  };

  /**
   * Get workout summary statistics
   */
  const getWorkoutSummary = async () => {
    try {
      return await WorkoutService.getWorkoutSummary();
    } catch (error) {
      console.error('Error getting workout summary:', error);
      return [];
    }
  };

  /**
   * Get exercise statistics
   */
  const getExerciseStats = async () => {
    try {
      return await ExerciseService.getExerciseStats();
    } catch (error) {
      console.error('Error getting exercise stats:', error);
      return [];
    }
  };

  /**
   * Force sync offline operations
   */
  const forceSyncOfflineOperations = async () => {
    try {
      const result = await syncOfflineOperations();
      if (result.success > 0) {
        await Promise.all([loadWorkouts(), loadExercises()]);
      }
      return result;
    } catch (error) {
      console.error('Error syncing offline operations:', error);
      return { success: 0, errors: 1 };
    }
  };

  // Load initial data
  useEffect(() => {
    loadExercises();
    loadWorkouts();
  }, []);

  return {
    // Data
    workouts,
    exercises,
    loading,
    isReady,
    
    // Actions
    saveWorkout,
    updateWorkout,
    deleteWorkout,
    addExercise,
    loadWorkouts,
    loadExercises,
    
    // Statistics
    getWorkoutSummary,
    getExerciseStats,
    
    // Offline sync
    forceSyncOfflineOperations
  };
};

/**
 * Helper function to categorize exercises based on name
 */
const categorizeExercise = (name: string, defaultCategory: 'push' | 'pull' | 'legs' | 'core'): { 
  detectedCategory: 'push' | 'pull' | 'legs' | 'core', 
  muscleGroups: string[] 
} => {
  const lowerName = name.toLowerCase();
  
  // Push exercises
  if (lowerName.includes('bench') || lowerName.includes('press') || lowerName.includes('push') || 
      lowerName.includes('dip') || lowerName.includes('tricep') || lowerName.includes('shoulder')) {
    return {
      detectedCategory: 'push',
      muscleGroups: ['chest', 'triceps', 'shoulders']
    };
  }
  
  // Pull exercises
  if (lowerName.includes('pull') || lowerName.includes('row') || lowerName.includes('chin') ||
      lowerName.includes('lat') || lowerName.includes('bicep') || lowerName.includes('curl')) {
    return {
      detectedCategory: 'pull',
      muscleGroups: ['lats', 'biceps', 'rhomboids']
    };
  }
  
  // Leg exercises
  if (lowerName.includes('squat') || lowerName.includes('deadlift') || lowerName.includes('leg') ||
      lowerName.includes('lunge') || lowerName.includes('calf') || lowerName.includes('quad') ||
      lowerName.includes('hamstring') || lowerName.includes('glute')) {
    return {
      detectedCategory: 'legs',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings']
    };
  }
  
  // Core exercises
  if (lowerName.includes('plank') || lowerName.includes('crunch') || lowerName.includes('abs') ||
      lowerName.includes('core') || lowerName.includes('sit-up')) {
    return {
      detectedCategory: 'core',
      muscleGroups: ['core', 'abs']
    };
  }
  
  // Default fallback
  const defaultMuscleGroups = {
    push: ['chest', 'triceps', 'shoulders'],
    pull: ['lats', 'biceps', 'rhomboids'],
    legs: ['quadriceps', 'glutes', 'hamstrings'],
    core: ['core', 'abs']
  };
  
  return {
    detectedCategory: defaultCategory,
    muscleGroups: defaultMuscleGroups[defaultCategory]
  };
}; 