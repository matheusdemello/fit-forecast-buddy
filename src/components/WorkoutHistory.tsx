
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Dumbbell } from 'lucide-react';
import { useWorkouts } from '../hooks/useWorkouts';

const WorkoutHistory = () => {
  const { workouts, loading } = useWorkouts();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalSets = (workout: any) => {
    return workout.exercises.reduce((total: number, exercise: any) => total + exercise.sets.length, 0);
  };

  const getTotalVolume = (workout: any) => {
    return workout.exercises.reduce((total: number, exercise: any) => {
      return total + exercise.sets.reduce((exerciseTotal: number, set: any) => {
        return exerciseTotal + (set.weight * set.reps);
      }, 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground">Loading workouts...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5" />
        <h1 className="text-2xl font-bold">Workout History</h1>
      </div>

      {workouts.length === 0 ? (
        <Card className="p-8 text-center">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
          <p className="text-muted-foreground">Start logging your workouts to see them here!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <Card key={workout.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{formatDate(workout.date)}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(workout.date)}
                    </div>
                    <div>{workout.duration}m</div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{getTotalSets(workout)} sets</div>
                  <div className="text-muted-foreground">{getTotalVolume(workout).toLocaleString()}kg total</div>
                </div>
              </div>

              <div className="space-y-3">
                {workout.exercises.map((exerciseEntry, index) => (
                  <div key={`${exerciseEntry.exercise.id}-${index}`} className="border-l-4 border-primary pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{exerciseEntry.exercise.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {exerciseEntry.exercise.category}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {exerciseEntry.sets.map((set, setIndex) => (
                        <div key={set.id} className="bg-muted/50 rounded p-2">
                          <div className="font-medium">{set.weight}kg × {set.reps}</div>
                          <div className="text-xs text-muted-foreground">Set {setIndex + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkoutHistory;
