
import React from 'react';
import { Timer, Target } from 'lucide-react';

interface WorkoutHeaderProps {
  workoutDuration: number;
  completedCount: number;
  totalSets: number;
}

const WorkoutHeader = ({ workoutDuration, completedCount, totalSets }: WorkoutHeaderProps) => {
  return (
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
  );
};

export default WorkoutHeader;
