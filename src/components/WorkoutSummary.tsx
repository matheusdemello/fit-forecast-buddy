
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WorkoutSummaryProps {
  completedCount: number;
  totalSets: number;
  workoutDuration: number;
  onFinishWorkout: () => void;
}

const WorkoutSummary = ({ completedCount, totalSets, workoutDuration, onFinishWorkout }: WorkoutSummaryProps) => {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress: {completedCount}/{totalSets} sets</span>
          <span>Duration: {workoutDuration}m</span>
        </div>
        <Button onClick={onFinishWorkout} className="w-full" size="lg">
          Finish Workout
        </Button>
      </div>
    </Card>
  );
};

export default WorkoutSummary;
