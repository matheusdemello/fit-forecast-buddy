
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { WorkoutSet } from '../types/workout';

interface SetRowProps {
  set: WorkoutSet;
  setIndex: number;
  isCompleted: boolean;
  onToggleCompletion: () => void;
  onUpdateSet: (field: 'reps' | 'weight', value: number) => void;
  onRemoveSet: () => void;
}

const SetRow = ({ 
  set, 
  setIndex, 
  isCompleted, 
  onToggleCompletion, 
  onUpdateSet, 
  onRemoveSet 
}: SetRowProps) => {
  return (
    <div className={`grid grid-cols-12 gap-2 items-center ${isCompleted ? 'opacity-75' : ''}`}>
      <div className="col-span-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCompletion}
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
          onChange={(e) => onUpdateSet('weight', parseFloat(e.target.value) || 0)}
          step="2.5"
          min="0"
          disabled={isCompleted}
        />
      </div>
      <div className="col-span-3">
        <Input
          type="number"
          value={set.reps}
          onChange={(e) => onUpdateSet('reps', parseInt(e.target.value) || 0)}
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
          onClick={onRemoveSet}
          className="p-0 h-6 w-6"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

export default SetRow;
