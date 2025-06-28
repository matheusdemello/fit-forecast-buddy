
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Timer, CheckCircle2, Target } from 'lucide-react';
import { useWorkouts } from '../hooks/useWorkouts';
import { Exercise, WorkoutSet, WorkoutExercise } from '../types/workout';
import { toast } from 'sonner';
import RestTimer from './RestTimer';

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Log Workout</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Timer className="w-4 h-4" />
            {workoutDuration}m
          </div>
          {totalSets > 0 && (
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {completedCount}/{totalSets}
            </div>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select exercise" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map(exercise => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addExercise} disabled={!selectedExercise}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

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
          <Card key={`${exerciseEntry.exercise.id}-${exerciseIndex}`} className="p-4">
            <h3 className="font-semibold mb-3">{exerciseEntry.exercise.name}</h3>
            
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                <div className="col-span-1">✓</div>
                <div className="col-span-2">Set</div>
                <div className="col-span-3">Weight</div>
                <div className="col-span-3">Reps</div>
                <div className="col-span-2">Rest</div>
                <div className="col-span-1"></div>
              </div>
              
              {exerciseEntry.sets.map((set, setIndex) => {
                const isCompleted = completedSets.has(set.id);
                return (
                  <div key={set.id} className={`grid grid-cols-12 gap-2 items-center ${isCompleted ? 'opacity-75' : ''}`}>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSetCompletion(set.id, exerciseIndex, setIndex)}
                        className="p-0 h-6 w-6"
                      >
                        <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-muted-foreground'}`} />
                      </Button>
                    </div>
                    <div className="col-span-2 text-sm font-medium">
                      {setIndex + 1}
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                        step="2.5"
                        min="0"
                        disabled={isCompleted}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                        min="1"
                        disabled={isCompleted}
                      />
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground">
                      {set.rest_time || 90}s
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSet(exerciseIndex, setIndex)}
                        className="p-0 h-6 w-6"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => addSet(exerciseIndex)}
              className="mt-3"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Set
            </Button>
          </Card>
        ))}
      </div>

      {currentWorkout.length > 0 && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress: {completedCount}/{totalSets} sets</span>
              <span>Duration: {workoutDuration}m</span>
            </div>
            <Button onClick={finishWorkout} className="w-full" size="lg">
              Finish Workout
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WorkoutLogger;
