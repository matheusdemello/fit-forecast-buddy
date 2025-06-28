
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Timer } from 'lucide-react';
import { useWorkouts } from '../hooks/useWorkouts';
import { Exercise, WorkoutSet, WorkoutExercise } from '../types/workout';
import { toast } from 'sonner';

const WorkoutLogger = () => {
  const { exercises, saveWorkout, getWorkoutSuggestions } = useWorkouts();
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutExercise[]>([]);
  const [workoutStartTime] = useState(new Date());
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  const addExercise = () => {
    if (!selectedExercise) return;
    
    const exercise = exercises.find(e => e.id === selectedExercise);
    if (!exercise) return;

    const suggestions = getWorkoutSuggestions(selectedExercise);
    const suggestion = suggestions[0];

    const newExerciseEntry: WorkoutExercise = {
      exercise,
      sets: [{
        id: crypto.randomUUID(),
        exercise_id: selectedExercise,
        reps: suggestion?.suggested_reps || 8,
        weight: suggestion?.suggested_weight || 20,
      }]
    };

    setCurrentWorkout([...currentWorkout, newExerciseEntry]);
    setSelectedExercise('');
    
    if (suggestion?.reason) {
      toast.success(`Suggestion: ${suggestion.reason}`);
    }
  };

  const addSet = (exerciseIndex: number) => {
    const updatedWorkout = [...currentWorkout];
    const lastSet = updatedWorkout[exerciseIndex].sets.slice(-1)[0];
    
    const newSet: WorkoutSet = {
      id: crypto.randomUUID(),
      exercise_id: updatedWorkout[exerciseIndex].exercise.id,
      reps: lastSet?.reps || 8,
      weight: lastSet?.weight || 20,
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
    updatedWorkout[exerciseIndex].sets.splice(setIndex, 1);
    
    if (updatedWorkout[exerciseIndex].sets.length === 0) {
      updatedWorkout.splice(exerciseIndex, 1);
    }
    
    setCurrentWorkout(updatedWorkout);
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
    toast.success('Workout saved!');
  };

  const workoutDuration = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 1000 / 60);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Log Workout</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="w-4 h-4" />
          {workoutDuration}m
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

      <div className="space-y-4">
        {currentWorkout.map((exerciseEntry, exerciseIndex) => (
          <Card key={`${exerciseEntry.exercise.id}-${exerciseIndex}`} className="p-4">
            <h3 className="font-semibold mb-3">{exerciseEntry.exercise.name}</h3>
            
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                <div className="col-span-2">Set</div>
                <div className="col-span-4">Weight (kg)</div>
                <div className="col-span-4">Reps</div>
                <div className="col-span-2"></div>
              </div>
              
              {exerciseEntry.sets.map((set, setIndex) => (
                <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-2 text-sm font-medium">
                    {setIndex + 1}
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      value={set.weight}
                      onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                      step="2.5"
                      min="0"
                    />
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      value={set.reps}
                      onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSet(exerciseIndex, setIndex)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
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
          <Button onClick={finishWorkout} className="w-full" size="lg">
            Finish Workout ({workoutDuration}m)
          </Button>
        </Card>
      )}
    </div>
  );
};

export default WorkoutLogger;
