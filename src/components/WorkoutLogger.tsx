
import React, { useState } from 'react';
import { useWorkouts } from '../hooks/useWorkouts';
import { WorkoutExercise, WorkoutSet } from '../types/workout';
import { toast } from 'sonner';
import RestTimer from './RestTimer';
import WorkoutHeader from './WorkoutHeader';
import ExerciseSelector from './ExerciseSelector';
import WorkoutExerciseCard from './WorkoutExerciseCard';
import WorkoutSummary from './WorkoutSummary';

const WorkoutLogger = () => {
  const { exercises, saveWorkout, getEnhancedSuggestions } = useWorkouts();
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutExercise[]>([]);
  const [workoutStartTime] = useState(new Date());
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
  const [showRestTimer, setShowRestTimer] = useState<{ exerciseIndex: number; setIndex: number; restTime: number } | null>(null);

  const addExercise = () => {
    if (!selectedExercise) return;
    
    const exercise = exercises.find(e => e.id === selectedExercise);
    if (!exercise) return;

    const enhancedSuggestions = getEnhancedSuggestions(selectedExercise);
    const suggestion = enhancedSuggestions[0];

    const newExerciseEntry: WorkoutExercise = {
      exercise,
      sets: [{
        id: crypto.randomUUID(),
        exercise_id: selectedExercise,
        reps: suggestion?.suggested_reps || 8,
        weight: suggestion?.suggested_weight || 20,
        rest_time: suggestion?.rest_time || 90,
      }]
    };

    setCurrentWorkout([...currentWorkout, newExerciseEntry]);
    setSelectedExercise('');
    
    if (suggestion?.reason) {
      toast.success(`💡 ${suggestion.reason}`, {
        description: `Rest: ${suggestion.rest_time}s | Progression: ${suggestion.progression_type}`
      });
    }
  };

  const addSet = (exerciseIndex: number) => {
    const updatedWorkout = [...currentWorkout];
    const lastSet = updatedWorkout[exerciseIndex].sets.slice(-1)[0];
    const exerciseId = updatedWorkout[exerciseIndex].exercise.id;
    
    // Get suggestions for the new set
    const suggestions = getEnhancedSuggestions(exerciseId);
    const suggestion = suggestions[0];
    
    const newSet: WorkoutSet = {
      id: crypto.randomUUID(),
      exercise_id: exerciseId,
      reps: lastSet?.reps || suggestion?.suggested_reps || 8,
      weight: lastSet?.weight || suggestion?.suggested_weight || 20,
      rest_time: suggestion?.rest_time || 90,
    };

    updatedWorkout[exerciseIndex].sets.push(newSet);
    setCurrentWorkout(updatedWorkout);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    const updatedWorkout = [...currentWorkout];
    updatedWorkout[exerciseIndex].sets[setIndex][field] = value;
    setCurrentWorkout(updatedWorkout);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedWorkout = [...currentWorkout];
    const setId = updatedWorkout[exerciseIndex].sets[setIndex].id;
    
    // Remove from completed sets
    const newCompletedSets = new Set(completedSets);
    newCompletedSets.delete(setId);
    setCompletedSets(newCompletedSets);
    
    updatedWorkout[exerciseIndex].sets.splice(setIndex, 1);
    
    if (updatedWorkout[exerciseIndex].sets.length === 0) {
      updatedWorkout.splice(exerciseIndex, 1);
    }
    
    setCurrentWorkout(updatedWorkout);
  };

  const toggleSetCompletion = (setId: string, exerciseIndex: number, setIndex: number) => {
    const newCompletedSets = new Set(completedSets);
    const set = currentWorkout[exerciseIndex].sets[setIndex];
    
    if (completedSets.has(setId)) {
      newCompletedSets.delete(setId);
      setShowRestTimer(null);
    } else {
      newCompletedSets.add(setId);
      // Show rest timer after completing a set
      if (set.rest_time && set.rest_time > 0) {
        setShowRestTimer({ exerciseIndex, setIndex, restTime: set.rest_time });
      }
      toast.success('Set completed! 💪');
    }
    
    setCompletedSets(newCompletedSets);
  };

  const finishWorkout = async () => {
    if (currentWorkout.length === 0) {
      toast.error('Add some exercises first!');
      return;
    }

    const duration = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 1000 / 60);
    
    await saveWorkout({
      date: new Date().toISOString(),
      duration,
      exercises: currentWorkout,
    });

    setCurrentWorkout([]);
    setCompletedSets(new Set());
    setShowRestTimer(null);
    toast.success('Workout saved! Great job! 🎉');
  };

  const workoutDuration = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 1000 / 60);
  const totalSets = currentWorkout.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const completedCount = completedSets.size;

  return (
    <div className="p-4 space-y-6">
      <WorkoutHeader 
        workoutDuration={workoutDuration}
        completedCount={completedCount}
        totalSets={totalSets}
      />

      <ExerciseSelector
        exercises={exercises}
        selectedExercise={selectedExercise}
        onSelectedExerciseChange={setSelectedExercise}
        onAddExercise={addExercise}
      />

      {showRestTimer && (
        <RestTimer
          suggestedRestTime={showRestTimer.restTime}
          onComplete={() => {
            setShowRestTimer(null);
            toast.success('Rest time complete! Ready for next set 🚀');
          }}
        />
      )}

      <div className="space-y-4">
        {currentWorkout.map((exerciseEntry, exerciseIndex) => (
          <WorkoutExerciseCard
            key={`${exerciseEntry.exercise.id}-${exerciseIndex}`}
            exerciseEntry={exerciseEntry}
            exerciseIndex={exerciseIndex} 
            completedSets={completedSets}
            onToggleSetCompletion={toggleSetCompletion}
            onUpdateSet={updateSet}
            onRemoveSet={removeSet}
            onAddSet={addSet}
          />
        ))}
      </div>

      {currentWorkout.length > 0 && (
        <WorkoutSummary
          completedCount={completedCount}
          totalSets={totalSets}
          workoutDuration={workoutDuration}
          onFinishWorkout={finishWorkout}
        />
      )}
    </div>
  );
};

export default WorkoutLogger;
