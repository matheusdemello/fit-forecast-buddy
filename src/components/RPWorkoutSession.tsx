import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Activity, 
  Zap, 
  Target, 
  TrendingUp,
  Save,
  AlertCircle
} from 'lucide-react';
import { Workout, WorkoutExercise, Exercise } from '../types/workout';

interface RPWorkoutSessionProps {
  workout: Workout;
  onSaveWorkout: (workout: Workout, exerciseData: WorkoutExercise[]) => void;
  onCancel: () => void;
}

export const RPWorkoutSession: React.FC<RPWorkoutSessionProps> = ({
  workout,
  onSaveWorkout,
  onCancel
}) => {
  const [sessionRatings, setSessionRatings] = useState({
    overall_fatigue: 2,
    overall_soreness: 2,
    session_rating: 3
  });

  const [exerciseRatings, setExerciseRatings] = useState<Record<string, {
    pump_rating: number;
    performance_rating: number;
  }>>({});

  const updateSessionRating = (field: keyof typeof sessionRatings, value: number) => {
    setSessionRatings(prev => ({ ...prev, [field]: value }));
  };

  const updateExerciseRating = (exerciseId: string, field: 'pump_rating' | 'performance_rating', value: number) => {
    setExerciseRatings(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value
      }
    }));
  };

  const getRatingColor = (rating: number, reversed = false) => {
    if (reversed) {
      // For fatigue/soreness - lower is better
      if (rating <= 2) return 'text-green-600';
      if (rating <= 3) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      // For performance/pump - higher is better
      if (rating >= 4) return 'text-green-600';
      if (rating >= 3) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getRatingLabel = (type: string, rating: number) => {
    const labels = {
      fatigue: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
      soreness: ['None', 'Mild', 'Moderate', 'High', 'Severe'],
      pump: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
      performance: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
      session: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent']
    };
    
    return labels[type as keyof typeof labels]?.[rating - 1] || 'Unknown';
  };

  const handleSaveWorkout = () => {
    // Enhanced workout with RP metrics
    const enhancedWorkout: Workout = {
      ...workout,
      overall_fatigue: sessionRatings.overall_fatigue,
      overall_soreness: sessionRatings.overall_soreness,
      session_rating: sessionRatings.session_rating
    };

    // Enhanced exercise data with ratings
    const enhancedExerciseData: WorkoutExercise[] = workout.exercises.map(exercise => ({
      ...exercise,
      pump_rating: exerciseRatings[exercise.exercise.id]?.pump_rating || 3,
      performance_rating: exerciseRatings[exercise.exercise.id]?.performance_rating || 3
    }));

    onSaveWorkout(enhancedWorkout, enhancedExerciseData);
  };

  const canSave = workout.exercises.length > 0 && workout.exercises.every(ex => ex.sets.length > 0);

  return (
    <div className="space-y-6">
      {/* Workout Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Workout Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Duration:</span>
              <span className="ml-2 font-medium">{workout.duration} minutes</span>
            </div>
            <div>
              <span className="text-gray-500">Exercises:</span>
              <span className="ml-2 font-medium">{workout.exercises.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Sets:</span>
              <span className="ml-2 font-medium">
                {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>
              <span className="ml-2 font-medium">{new Date(workout.date).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session-Level RP Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Session Ratings
            <Badge variant="outline" className="ml-auto">RP Metrics</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Fatigue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overall Fatigue
              </Label>
              <Badge 
                variant="outline" 
                className={getRatingColor(sessionRatings.overall_fatigue, true)}
              >
                {sessionRatings.overall_fatigue}/5 - {getRatingLabel('fatigue', sessionRatings.overall_fatigue)}
              </Badge>
            </div>
            <Slider
              value={[sessionRatings.overall_fatigue]}
              onValueChange={(value) => updateSessionRating('overall_fatigue', value[0])}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Very Low</span>
              <span>Very High</span>
            </div>
          </div>

          {/* Overall Soreness */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Overall Soreness
              </Label>
              <Badge 
                variant="outline" 
                className={getRatingColor(sessionRatings.overall_soreness, true)}
              >
                {sessionRatings.overall_soreness}/5 - {getRatingLabel('soreness', sessionRatings.overall_soreness)}
              </Badge>
            </div>
            <Slider
              value={[sessionRatings.overall_soreness]}
              onValueChange={(value) => updateSessionRating('overall_soreness', value[0])}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>None</span>
              <span>Severe</span>
            </div>
          </div>

          {/* Session Rating */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Session Rating
              </Label>
              <Badge 
                variant="outline" 
                className={getRatingColor(sessionRatings.session_rating)}
              >
                {sessionRatings.session_rating}/5 - {getRatingLabel('session', sessionRatings.session_rating)}
              </Badge>
            </div>
            <Slider
              value={[sessionRatings.session_rating]}
              onValueChange={(value) => updateSessionRating('session_rating', value[0])}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise-Level RP Metrics */}
      {workout.exercises.map((exercise, index) => (
        <Card key={exercise.exercise.id}>
          <CardHeader>
            <CardTitle className="text-lg">
              {exercise.exercise.name}
              <Badge variant="secondary" className="ml-2">
                {exercise.sets.length} sets
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sets Summary */}
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="font-medium">Set</div>
              <div className="font-medium">Weight</div>
              <div className="font-medium">Reps</div>
              <div className="font-medium">RIR</div>
            </div>
            {exercise.sets.map((set, setIndex) => (
              <div key={set.id} className="grid grid-cols-4 gap-2 text-sm">
                <div>{setIndex + 1}</div>
                <div>{set.weight}kg</div>
                <div>{set.reps}</div>
                <div className="flex items-center gap-1">
                  <span>{set.rir || 'N/A'}</span>
                  {(set.rir || 0) <= 1 && (
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                  )}
                </div>
              </div>
            ))}

            <Separator />

            {/* Exercise Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pump Rating */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Pump
                  </Label>
                  <Badge 
                    variant="outline" 
                    className={getRatingColor(exerciseRatings[exercise.exercise.id]?.pump_rating || 3)}
                  >
                    {exerciseRatings[exercise.exercise.id]?.pump_rating || 3}/5
                  </Badge>
                </div>
                <Slider
                  value={[exerciseRatings[exercise.exercise.id]?.pump_rating || 3]}
                  onValueChange={(value) => updateExerciseRating(exercise.exercise.id, 'pump_rating', value[0])}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">
                  {getRatingLabel('pump', exerciseRatings[exercise.exercise.id]?.pump_rating || 3)}
                </div>
              </div>

              {/* Performance Rating */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Performance
                  </Label>
                  <Badge 
                    variant="outline" 
                    className={getRatingColor(exerciseRatings[exercise.exercise.id]?.performance_rating || 3)}
                  >
                    {exerciseRatings[exercise.exercise.id]?.performance_rating || 3}/5
                  </Badge>
                </div>
                <Slider
                  value={[exerciseRatings[exercise.exercise.id]?.performance_rating || 3]}
                  onValueChange={(value) => updateExerciseRating(exercise.exercise.id, 'performance_rating', value[0])}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">
                  {getRatingLabel('performance', exerciseRatings[exercise.exercise.id]?.performance_rating || 3)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleSaveWorkout} 
          disabled={!canSave}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Workout with RP Data
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {!canSave && (
        <div className="text-sm text-red-600 text-center">
          Please add at least one exercise with sets to save the workout.
        </div>
      )}
    </div>
  );
};

export default RPWorkoutSession; 