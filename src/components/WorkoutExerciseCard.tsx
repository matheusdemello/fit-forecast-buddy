
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { WorkoutExercise } from '../types/workout';
import SetRow from './SetRow';

interface WorkoutExerciseCardProps {
  exerciseEntry: WorkoutExercise;
  exerciseIndex: number;
  completedSets: Set<string>;
  onToggleSetCompletion: (setId: string, exerciseIndex: number, setIndex: number) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onAddSet: (exerciseIndex: number) => void;
}

const WorkoutExerciseCard = ({
  exerciseEntry,
  exerciseIndex,
  completedSets,
  onToggleSetCompletion,
  onUpdateSet,
  onRemoveSet,
  onAddSet
}: WorkoutExerciseCardProps) => {
  return (
    <Card className="p-4">
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
        
        {exerciseEntry.sets.map((set, setIndex) => (
          <SetRow
            key={set.id}
            set={set}
            setIndex={setIndex}
            isCompleted={completedSets.has(set.id)}
            onToggleCompletion={() => onToggleSetCompletion(set.id, exerciseIndex, setIndex)}
            onUpdateSet={(field, value) => onUpdateSet(exerciseIndex, setIndex, field, value)}
            onRemoveSet={() => onRemoveSet(exerciseIndex, setIndex)}
          />
        ))}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAddSet(exerciseIndex)}
        className="mt-3"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Set
      </Button>
    </Card>
  );
};

export default WorkoutExerciseCard;
