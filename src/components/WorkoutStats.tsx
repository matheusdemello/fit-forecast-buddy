
import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Calendar, Zap, Target } from 'lucide-react';
import { useWorkouts } from '../hooks/useWorkouts';

const WorkoutStats = () => {
  const { workouts } = useWorkouts();

  const getWeeklyWorkouts = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return workouts.filter(w => new Date(w.date) >= oneWeekAgo).length;
  };

  const getTotalVolume = () => {
    return workouts.reduce((total, workout) => {
      return total + workout.exercises.reduce((workoutTotal, exercise) => {
        return workoutTotal + exercise.sets.reduce((exerciseTotal, set) => {
          return exerciseTotal + (set.weight * set.reps);
        }, 0);
      }, 0);
    }, 0);
  };

  const getAverageWorkoutDuration = () => {
    if (workouts.length === 0) return 0;
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    return Math.round(totalDuration / workouts.length);
  };

  const getPersonalBests = () => {
    const exerciseBests = new Map();
    
    workouts.forEach(workout => {
      workout.exercises.forEach(exerciseEntry => {
        const exerciseName = exerciseEntry.exercise.name;
        const maxWeight = Math.max(...exerciseEntry.sets.map(set => set.weight));
        
        if (!exerciseBests.has(exerciseName) || maxWeight > exerciseBests.get(exerciseName)) {
          exerciseBests.set(exerciseName, maxWeight);
        }
      });
    });
    
    return Array.from(exerciseBests.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const weeklyWorkouts = getWeeklyWorkouts();
  const totalVolume = getTotalVolume();
  const avgDuration = getAverageWorkoutDuration();
  const personalBests = getPersonalBests();

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5" />
        <h1 className="text-2xl font-bold">Workout Stats</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">This Week</span>
          </div>
          <div className="text-2xl font-bold">{weeklyWorkouts}</div>
          <div className="text-sm text-muted-foreground">workouts</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Avg Duration</span>
          </div>
          <div className="text-2xl font-bold">{avgDuration}</div>
          <div className="text-sm text-muted-foreground">minutes</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <span className="font-semibold">Total Volume</span>
        </div>
        <div className="text-3xl font-bold mb-1">{totalVolume.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground">kg lifted all time</div>
      </Card>

      {personalBests.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Personal Bests</h3>
          <div className="space-y-2">
            {personalBests.map(([exercise, weight]) => (
              <div key={exercise} className="flex justify-between items-center">
                <span className="text-sm">{exercise}</span>
                <span className="font-semibold">{weight}kg</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Progress Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Workouts:</span>
            <span className="font-medium">{workouts.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">This Week:</span>
            <span className="font-medium">{weeklyWorkouts} workouts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Consistency:</span>
            <span className="font-medium">
              {workouts.length > 0 ? Math.round((weeklyWorkouts / 7) * 100) : 0}% weekly
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WorkoutStats;
