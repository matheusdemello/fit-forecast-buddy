
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Exercise } from '../types/workout';

interface ExerciseSelectorProps {
  exercises: Exercise[];
  selectedExercise: string;
  onSelectedExerciseChange: (value: string) => void;
  onAddExercise: () => void;
}

const ExerciseSelector = ({ 
  exercises, 
  selectedExercise, 
  onSelectedExerciseChange, 
  onAddExercise 
}: ExerciseSelectorProps) => {
  return (
    <Card className="p-4">
      <div className="flex gap-2">
        <Select value={selectedExercise} onValueChange={onSelectedExerciseChange}>
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
        <Button onClick={onAddExercise} disabled={!selectedExercise}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ExerciseSelector;
