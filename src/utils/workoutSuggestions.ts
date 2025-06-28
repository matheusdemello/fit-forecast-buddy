
import { Workout, Exercise, WorkoutSet, WorkoutSuggestion } from '../types/workout';

export interface EnhancedWorkoutSuggestion extends WorkoutSuggestion {
  confidence: number;
  rest_time: number;
  progression_type: 'weight' | 'reps' | 'maintain';
}

export const getEnhancedWorkoutSuggestions = (
  exerciseId: string,
  exercises: Exercise[],
  workouts: Workout[]
): EnhancedWorkoutSuggestion[] => {
  const exercise = exercises.find(e => e.id === exerciseId);
  if (!exercise) return [];

  // Get all historical sets for this exercise
  const historicalSets = workouts
    .flatMap(w => w.exercises)
    .filter(e => e.exercise.id === exerciseId)
    .flatMap(e => e.sets)
    .sort((a, b) => new Date(workouts.find(w => 
      w.exercises.some(e => e.sets.some(s => s.id === b.id))
    )?.date || 0).getTime() - new Date(workouts.find(w => 
      w.exercises.some(e => e.sets.some(s => s.id === a.id))
    )?.date || 0).getTime());

  if (historicalSets.length === 0) {
    return getBeginnerSuggestions(exercise);
  }

  // Get recent performance (last 3 workouts)
  const recentSets = historicalSets.slice(-15); // Last 15 sets
  const lastWorkoutSets = getLastWorkoutSets(exerciseId, workouts);
  
  return generateProgressiveSuggestions(exercise, recentSets, lastWorkoutSets);
};

const getBeginnerSuggestions = (exercise: Exercise): EnhancedWorkoutSuggestion[] => {
  const baseWeights: Record<string, number> = {
    'push': 20,
    'pull': 15,
    'legs': 30,
    'core': 0
  };

  const baseReps: Record<string, number> = {
    'push': 8,
    'pull': 8,
    'legs': 10,
    'core': 15
  };

  const restTimes: Record<string, number> = {
    'push': 90,
    'pull': 90,
    'legs': 120,
    'core': 60
  };

  return [{
    exercise_name: exercise.name,
    suggested_weight: baseWeights[exercise.category] || 20,
    suggested_reps: baseReps[exercise.category] || 8,
    reason: 'Starting weight for beginners',
    confidence: 0.8,
    rest_time: restTimes[exercise.category] || 90,
    progression_type: 'maintain' as const
  }];
};

const getLastWorkoutSets = (exerciseId: string, workouts: Workout[]): WorkoutSet[] => {
  for (const workout of workouts.slice().reverse()) {
    const exerciseData = workout.exercises.find(e => e.exercise.id === exerciseId);
    if (exerciseData) {
      return exerciseData.sets;
    }
  }
  return [];
};

const generateProgressiveSuggestions = (
  exercise: Exercise,
  recentSets: WorkoutSet[],
  lastWorkoutSets: WorkoutSet[]
): EnhancedWorkoutSuggestion[] => {
  if (recentSets.length === 0) return getBeginnerSuggestions(exercise);

  // Calculate performance metrics
  const avgWeight = recentSets.reduce((sum, set) => sum + set.weight, 0) / recentSets.length;
  const maxWeight = Math.max(...recentSets.map(s => s.weight));
  const avgReps = recentSets.reduce((sum, set) => sum + set.reps, 0) / recentSets.length;
  
  // Get last workout performance
  const lastWeight = lastWorkoutSets.length > 0 ? 
    Math.max(...lastWorkoutSets.map(s => s.weight)) : avgWeight;
  const lastReps = lastWorkoutSets.length > 0 ? 
    Math.max(...lastWorkoutSets.map(s => s.reps)) : avgReps;

  // Determine if user completed all sets successfully last time
  const completedAllSets = lastWorkoutSets.length > 0 && 
    lastWorkoutSets.every(set => set.reps >= avgReps * 0.8);

  const suggestions: EnhancedWorkoutSuggestion[] = [];

  // Progressive overload suggestion
  if (completedAllSets && lastWorkoutSets.length >= 3) {
    // If they completed all sets well, suggest weight increase
    suggestions.push({
      exercise_name: exercise.name,
      suggested_weight: Math.round((lastWeight + getWeightIncrement(exercise.category)) * 2) / 2,
      suggested_reps: Math.round(avgReps),
      reason: 'Progressive overload - increase weight',
      confidence: 0.9,
      rest_time: getRestTime(exercise.category, 'weight'),
      progression_type: 'weight'
    });
  } else if (lastReps < avgReps * 0.9) {
    // If they struggled with reps, maintain weight but focus on reps
    suggestions.push({
      exercise_name: exercise.name,
      suggested_weight: lastWeight,
      suggested_reps: Math.min(Math.round(avgReps), lastReps + 1),
      reason: 'Focus on rep improvement',
      confidence: 0.85,
      rest_time: getRestTime(exercise.category, 'reps'),
      progression_type: 'reps'
    });
  } else {
    // Standard progression
    suggestions.push({
      exercise_name: exercise.name,
      suggested_weight: lastWeight,
      suggested_reps: Math.round(avgReps),
      reason: 'Maintain current progression',
      confidence: 0.8,
      rest_time: getRestTime(exercise.category, 'maintain'),
      progression_type: 'maintain'
    });
  }

  return suggestions;
};

const getWeightIncrement = (category: string): number => {
  const increments: Record<string, number> = {
    'push': 2.5,
    'pull': 2.5,
    'legs': 5,
    'core': 2.5
  };
  return increments[category] || 2.5;
};

const getRestTime = (category: string, progressionType: string): number => {
  const baseTimes: Record<string, number> = {
    'push': 90,
    'pull': 90,
    'legs': 120,
    'core': 60
  };
  
  const baseTime = baseTimes[category] || 90;
  
  // Increase rest time for weight progression
  if (progressionType === 'weight') {
    return baseTime + 30;
  }
  
  return baseTime;
};
