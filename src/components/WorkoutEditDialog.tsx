import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Workout, WorkoutSet, WorkoutExercise } from '../types/workout';
import { useSupabaseWorkouts } from '../hooks/useSupabaseWorkouts';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import ExerciseSelector from './ExerciseSelector';

interface WorkoutEditDialogProps {
  workout: Workout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (workoutId: string, updatedWorkout: Omit<Workout, 'id'>) => Promise<boolean>;
}

const WorkoutEditDialog = ({ workout, open, onOpenChange, onSave }: WorkoutEditDialogProps) => {
  const { exercises, addExercise } = useSupabaseWorkouts();
  const [editedWorkout, setEditedWorkout] = useState<Omit<Workout, 'id'> | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workout) {
      setEditedWorkout({
        date: workout.date,
        duration: workout.duration,
        exercises: [...workout.exercises],
        notes: workout.notes || ''
      });
    }
  }, [workout]);

  const handleSave = async () => {
    if (!workout || !editedWorkout) return;
    
    setSaving(true);
    try {
      const success = await onSave(workout.id, editedWorkout);
      if (success) {
        toast.success('Workout updated successfully! 🎉');
        onOpenChange(false);
      } else {
        toast.error('Failed to update workout');
      }
    } catch (error) {
      toast.error('Failed to update workout');
    } finally {
      setSaving(false);
    }
  };

  const updateWorkoutField = (field: keyof Omit<Workout, 'id'>, value: any) => {
    if (!editedWorkout) return;
    setEditedWorkout({ ...editedWorkout, [field]: value });
  };

  const addExerciseToWorkout = () => {
    if (!selectedExercise || !editedWorkout) return;
    
    const exercise = exercises.find(e => e.id === selectedExercise);
    if (!exercise) return;

    const newExerciseEntry: WorkoutExercise = {
      exercise,
      sets: [{
        id: uuidv4(),
        exercise_id: selectedExercise,
        reps: 8,
        weight: 20,
        rest_time: 90,
      }]
    };

    setEditedWorkout({
      ...editedWorkout,
      exercises: [...editedWorkout.exercises, newExerciseEntry]
    });
    setSelectedExercise('');
  };

  const handleCreateExercise = async (name: string) => {
    try {
      const newExercise = await addExercise(name);
      if (newExercise) {
        toast.success(`Created new exercise: ${newExercise.name}`);
      }
      return newExercise;
    } catch (error) {
      toast.error('Failed to create exercise');
      return null;
    }
  };

  const removeExercise = (exerciseIndex: number) => {
    if (!editedWorkout) return;
    const updatedExercises = editedWorkout.exercises.filter((_, index) => index !== exerciseIndex);
    setEditedWorkout({ ...editedWorkout, exercises: updatedExercises });
  };

  const addSet = (exerciseIndex: number) => {
    if (!editedWorkout) return;
    const lastSet = editedWorkout.exercises[exerciseIndex].sets.slice(-1)[0];
    
    const newSet: WorkoutSet = {
      id: uuidv4(),
      exercise_id: editedWorkout.exercises[exerciseIndex].exercise.id,
      reps: lastSet?.reps || 8,
      weight: lastSet?.weight || 20,
      rest_time: lastSet?.rest_time || 90,
    };

    const updatedExercises = [...editedWorkout.exercises];
    updatedExercises[exerciseIndex].sets.push(newSet);
    setEditedWorkout({ ...editedWorkout, exercises: updatedExercises });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (!editedWorkout) return;
    const updatedExercises = [...editedWorkout.exercises];
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
    
    if (updatedExercises[exerciseIndex].sets.length === 0) {
      updatedExercises.splice(exerciseIndex, 1);
    }
    
    setEditedWorkout({ ...editedWorkout, exercises: updatedExercises });
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight' | 'rest_time', value: number) => {
    if (!editedWorkout) return;
    const updatedExercises = [...editedWorkout.exercises];
    updatedExercises[exerciseIndex].sets[setIndex][field] = value;
    setEditedWorkout({ ...editedWorkout, exercises: updatedExercises });
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDateChange = (dateString: string) => {
    const date = new Date(dateString);
    updateWorkoutField('date', date.toISOString());
  };

  if (!workout || !editedWorkout) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Workout</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formatDateForInput(editedWorkout.date)}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={editedWorkout.duration}
                onChange={(e) => updateWorkoutField('duration', parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={editedWorkout.notes || ''}
              onChange={(e) => updateWorkoutField('notes', e.target.value)}
              placeholder="Add any notes about this workout..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Add Exercise</Label>
            <ExerciseSelector
              exercises={exercises}
              selectedExercise={selectedExercise}
              onSelectedExerciseChange={setSelectedExercise}
              onAddExercise={addExerciseToWorkout}
              onCreateExercise={handleCreateExercise}
            />
          </div>

          <div className="space-y-4">
            <Label>Exercises</Label>
            {editedWorkout.exercises.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No exercises added yet</p>
            ) : (
              editedWorkout.exercises.map((exerciseEntry, exerciseIndex) => (
                <Card key={`${exerciseEntry.exercise.id}-${exerciseIndex}`} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{exerciseEntry.exercise.name}</h4>
                      <Badge variant="secondary">{exerciseEntry.exercise.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addSet(exerciseIndex)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Set
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeExercise(exerciseIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                      <div className="col-span-2">Set</div>
                      <div className="col-span-3">Weight (kg)</div>
                      <div className="col-span-3">Reps</div>
                      <div className="col-span-3">Rest (s)</div>
                      <div className="col-span-1"></div>
                    </div>
                    
                    {exerciseEntry.sets.map((set, setIndex) => (
                      <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
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
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                            min="1"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            value={set.rest_time || 90}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'rest_time', parseInt(e.target.value) || 90)}
                            min="0"
                            max="600"
                            placeholder="90"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            className="p-0 h-6 w-6"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutEditDialog; 