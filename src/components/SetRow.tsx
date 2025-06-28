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
  onUpdateSet: (field: 'reps' | 'weight' | 'rir' | 'rest_time', value: number) => void;
  onRemoveSet: () => void;
  showRIR?: boolean;
}

const SetRow = ({ 
  set, 
  setIndex, 
  isCompleted, 
  onToggleCompletion, 
  onUpdateSet, 
  onRemoveSet,
  showRIR = true
}: SetRowProps) => {
  const gridCols = showRIR ? "grid-cols-16" : "grid-cols-14";
  
  return (
    <div className={`grid ${gridCols} gap-2 items-center ${isCompleted ? 'opacity-75' : ''}`}>
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
      <div className="col-span-1 text-sm font-medium">
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
          placeholder="kg"
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          value={set.reps}
          onChange={(e) => onUpdateSet('reps', parseInt(e.target.value) || 0)}
          min="1"
          disabled={isCompleted}
          placeholder="reps"
        />
      </div>
      {showRIR && (
        <div className="col-span-2">
          <Input
            type="number"
            value={set.rir || 3}
            onChange={(e) => onUpdateSet('rir', parseInt(e.target.value) || 0)}
            min="0"
            max="4"
            disabled={isCompleted}
            placeholder="RIR"
            className="text-center"
          />
        </div>
      )}
      <div className={`${showRIR ? 'col-span-3' : 'col-span-4'}`}>
        <Input
          type="number"
          value={set.rest_time || 90}
          onChange={(e) => onUpdateSet('rest_time', parseInt(e.target.value) || 90)}
          min="0"
          max="600"
          disabled={isCompleted}
          placeholder="rest (s)"
          className="text-center text-xs"
        />
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
