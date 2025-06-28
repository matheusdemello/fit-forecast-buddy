import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Timer, CheckCircle2, Target, Dumbbell, Zap, Flame } from 'lucide-react';
import { useSupabaseWorkouts } from '../hooks/useSupabaseWorkouts';
import { Exercise, WorkoutSet, WorkoutExercise } from '../types/workout';
import { toast } from 'sonner';
import RestTimer from './RestTimer';
import ExerciseSelector from './ExerciseSelector';
import { v4 as uuidv4 } from 'uuid';

const WorkoutLogger = () => {
  const { exercises, saveWorkout, addExercise } = useSupabaseWorkouts();
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutExercise[]>([]);
  const [workoutStartTime] = useState(new Date());
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
  const [showRestTimer, setShowRestTimer] = useState<{ exerciseIndex: number; setIndex: number; restTime: number } | null>(null);

  // Fallback suggestion function for when getEnhancedSuggestions is not available
  const getDefaultSuggestion = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;

    // Default suggestions based on exercise category
    const defaults = {
      push: { reps: 8, weight: 25, rest: 90 },
      pull: { reps: 10, weight: 20, rest: 90 },
      legs: { reps: 12, weight: 30, rest: 120 },
      core: { reps: 15, weight: 10, rest: 60 }
    };

    const suggestion = defaults[exercise.category] || defaults.push;
    
    return {
      suggested_reps: suggestion.reps,
      suggested_weight: suggestion.weight,
      rest_time: suggestion.rest,
      reason: `Beast Mode Default for ${exercise.category.toUpperCase()}`,
      progression_type: 'linear'
    };
  };

  const handleAddExercise = () => {
    if (!selectedExercise) return;
    
    const exercise = exercises.find(e => e.id === selectedExercise);
    if (!exercise) return;

    const suggestion = getDefaultSuggestion(selectedExercise);

    const newExerciseEntry: WorkoutExercise = {
      exercise,
      sets: [{
        id: uuidv4(),
        exercise_id: selectedExercise,
        reps: suggestion?.suggested_reps || 8,
        weight: suggestion?.suggested_weight || 20,
        rest_time: suggestion?.rest_time || 90,
      }]
    };

    setCurrentWorkout([...currentWorkout, newExerciseEntry]);
    setSelectedExercise('');
    
    if (suggestion?.reason) {
      toast.success(`💡 ${suggestion.reason}`, {
        description: `Rest: ${suggestion.rest_time}s | Progression: ${suggestion.progression_type}`
      });
    }
  };

  const handleCreateExercise = async (name: string): Promise<Exercise | null> => {
    try {
      const newExercise = await addExercise(name);
      if (newExercise) {
        toast.success(`Created new exercise: ${newExercise.name}`, {
          description: `Category: ${newExercise.category}`
        });
      }
      return newExercise;
    } catch (error) {
      toast.error('Failed to create exercise');
      return null;
    }
  };

  const addSet = (exerciseIndex: number) => {
    const updatedWorkout = [...currentWorkout];
    const lastSet = updatedWorkout[exerciseIndex].sets.slice(-1)[0];
    const exerciseId = updatedWorkout[exerciseIndex].exercise.id;
    
    // Get suggestions for the new set
    const suggestion = getDefaultSuggestion(exerciseId);
    
    const newSet: WorkoutSet = {
      id: uuidv4(),
      exercise_id: exerciseId,
      reps: lastSet?.reps || suggestion?.suggested_reps || 8,
      weight: lastSet?.weight || suggestion?.suggested_weight || 20,
      rest_time: suggestion?.rest_time || 90,
    };

    updatedWorkout[exerciseIndex].sets.push(newSet);
    setCurrentWorkout(updatedWorkout);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    const updatedWorkout = [...currentWorkout];
    updatedWorkout[exerciseIndex].sets[setIndex][field] = value;
    setCurrentWorkout(updatedWorkout);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedWorkout = [...currentWorkout];
    const setId = updatedWorkout[exerciseIndex].sets[setIndex].id;
    
    // Remove from completed sets
    const newCompletedSets = new Set(completedSets);
    newCompletedSets.delete(setId);
    setCompletedSets(newCompletedSets);
    
    updatedWorkout[exerciseIndex].sets.splice(setIndex, 1);
    
    if (updatedWorkout[exerciseIndex].sets.length === 0) {
      updatedWorkout.splice(exerciseIndex, 1);
    }
    
    setCurrentWorkout(updatedWorkout);
  };

  const toggleSetCompletion = (setId: string, exerciseIndex: number, setIndex: number) => {
    const newCompletedSets = new Set(completedSets);
    const set = currentWorkout[exerciseIndex].sets[setIndex];
    
    if (completedSets.has(setId)) {
      newCompletedSets.delete(setId);
      setShowRestTimer(null);
    } else {
      newCompletedSets.add(setId);
      // Show rest timer after completing a set
      if (set.rest_time && set.rest_time > 0) {
        setShowRestTimer({ exerciseIndex, setIndex, restTime: set.rest_time });
      }
      toast.success('Set completed! 💪⚡');
    }
    
    setCompletedSets(newCompletedSets);
  };

  const finishWorkout = async () => {
    if (currentWorkout.length === 0) {
      toast.error('Add some exercises first! 💪');
      return;
    }

    const duration = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 1000 / 60);
    
    await saveWorkout({
      date: new Date().toISOString(),
      duration,
      exercises: currentWorkout,
    });

    setCurrentWorkout([]);
    setCompletedSets(new Set());
    setShowRestTimer(null);
    toast.success('BEAST MODE COMPLETE! 🔥💪⚡', {
      description: `Crushed ${duration} minutes of pure power!`
    });
  };

  const workoutDuration = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 1000 / 60);
  const totalSets = currentWorkout.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const completedCount = completedSets.size;

  return (
    <div className="p-4 space-y-6 relative">
      {/* Aggressive header with physics effects */}
      <div className="relative energy-wave">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 rounded-xl border border-emerald-600/30 shadow-glow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600/20 glow-green">
              <Dumbbell className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-indian-accent">BEAST MODE</h1>
              <p className="text-emerald-200 text-sm font-medium">Unleash Your Inner Warrior</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-emerald-300">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-900/30 border border-emerald-600/30">
              <Timer className="w-4 h-4" />
              <span className="font-bold">{workoutDuration}m</span>
              <Zap className="w-3 h-3 animate-pulse" />
            </div>
            {totalSets > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-900/30 border border-emerald-600/30">
                <Target className="w-4 h-4" />
                <span className="font-bold">{completedCount}/{totalSets}</span>
                <Flame className="w-3 h-3 text-orange-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exercise Selector with aggressive styling */}
      <Card variant="aggressive" className="p-4 gym-equipment mandala-corner">
        <ExerciseSelector
          exercises={exercises}
          selectedExercise={selectedExercise}
          onSelectedExerciseChange={setSelectedExercise}
          onAddExercise={handleAddExercise}
          onCreateExercise={handleCreateExercise}
        />
      </Card>

      {showRestTimer && (
        <div className="relative">
          <RestTimer
            suggestedRestTime={showRestTimer.restTime}
            onComplete={() => {
              setShowRestTimer(null);
              toast.success('REST COMPLETE! Time to DOMINATE! 🚀⚡');
            }}
          />
        </div>
      )}

      {currentWorkout.length === 0 && (
        <Card variant="warrior" className="p-8 text-center lotus-pattern relative">
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-emerald-500/20 glow-emerald">
                <Dumbbell className="w-16 h-16 text-emerald-300 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">READY TO DOMINATE?</h3>
            <p className="text-emerald-200 mb-4 font-medium">Select your weapon of choice and begin your conquest! 💪⚡</p>
            <div className="flex justify-center gap-2 text-2xl opacity-60">
              🏋️ 💪 ⚡ 🔥
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-6">
        {currentWorkout.map((exerciseEntry, exerciseIndex) => (
          <Card key={`${exerciseEntry.exercise.id}-${exerciseIndex}`} variant="aggressive" className="p-4 mandala-corner relative">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-emerald-300 flex items-center gap-2">
                  <span className="text-emerald-400">⚡</span>
                  {exerciseEntry.exercise.name}
                  <span className="text-emerald-400">⚡</span>
                </h3>
                <div className="text-xs text-emerald-400 font-medium">
                  {exerciseEntry.sets.length} SETS
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 text-sm font-bold text-emerald-400 bg-emerald-900/20 p-2 rounded-lg">
                  <div className="col-span-1">✓</div>
                  <div className="col-span-2">SET</div>
                  <div className="col-span-3">WEIGHT</div>
                  <div className="col-span-3">REPS</div>
                  <div className="col-span-2">REST</div>
                  <div className="col-span-1"></div>
                </div>
                
                {exerciseEntry.sets.map((set, setIndex) => {
                  const isCompleted = completedSets.has(set.id);
                  return (
                    <div key={set.id} className={`grid grid-cols-12 gap-3 items-center p-2 rounded-lg transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-emerald-900/40 border border-emerald-600/50 glow-green' 
                        : 'bg-gray-900/40 border border-emerald-700/20 hover:bg-emerald-950/30'
                    }`}>
                      <div className="col-span-1">
                        <Button
                          variant={isCompleted ? "warrior" : "ghost"}
                          size="sm"
                          onClick={() => toggleSetCompletion(set.id, exerciseIndex, setIndex)}
                          className="p-0 h-8 w-8 btn-aggressive"
                        >
                          <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-emerald-500'}`} />
                        </Button>
                      </div>
                      <div className="col-span-2 text-sm font-bold text-emerald-300">
                        #{setIndex + 1}
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={set.weight}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                          step="2.5"
                          min="0"
                          disabled={isCompleted}
                          className="bg-gray-900/60 border-emerald-700/30 text-emerald-200 font-bold focus:border-emerald-500 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                          min="1"
                          disabled={isCompleted}
                          className="bg-gray-900/60 border-emerald-700/30 text-emerald-200 font-bold focus:border-emerald-500 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div className="col-span-2 text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {set.rest_time || 90}s
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSet(exerciseIndex, setIndex)}
                          className="p-0 h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Button
                variant="aggressive"
                size="sm"
                onClick={() => addSet(exerciseIndex)}
                className="mt-4 w-full btn-aggressive"
              >
                <Plus className="w-4 h-4 mr-2" />
                ADD SET ⚡
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {currentWorkout.length > 0 && (
        <Card variant="warrior" className="p-6 lotus-pattern relative">
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="font-bold">PROGRESS: {completedCount}/{totalSets} SETS CRUSHED</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-emerald-300" />
                <span className="font-bold">DURATION: {workoutDuration}m</span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-900/60 rounded-full h-3 border border-emerald-600/30">
              <div 
                className="bg-gradient-warrior h-full rounded-full transition-all duration-500 glow-green"
                style={{ width: `${totalSets > 0 ? (completedCount / totalSets) * 100 : 0}%` }}
              />
            </div>
            
            <Button 
              variant="warrior" 
              onClick={finishWorkout} 
              className="w-full text-lg font-bold btn-aggressive py-4"
              size="lg"
            >
              <Flame className="w-5 h-5 mr-2" />
              COMPLETE BEAST MODE
              <Zap className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WorkoutLogger;
