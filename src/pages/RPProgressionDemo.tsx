import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Activity, 
  Target, 
  BarChart3,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import RPProgressionCard from '../components/RPProgressionCard';
import { useWorkouts } from '../hooks/useWorkouts';
import { useRPProgression } from '../hooks/useRPProgression';
import { Exercise, RPProgressionRecommendation } from '../types/workout';

const RPProgressionDemo: React.FC = () => {
  const { exercises, addExercise } = useWorkouts();
  const { 
    progressionStates, 
    mesocycleSettings, 
    getProgressionOverview 
  } = useRPProgression();
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [demoInitialized, setDemoInitialized] = useState(false);

  useEffect(() => {
    // Auto-select first exercise if available
    if (exercises.length > 0 && !selectedExercise) {
      setSelectedExercise(exercises[0]);
    }
  }, [exercises, selectedExercise]);

  const initializeDemo = async () => {
    try {
      // Add demo exercises if they don't exist
      const demoExercises = [
        { name: 'Bench Press', category: 'push' as const },
        { name: 'Squat', category: 'legs' as const },
        { name: 'Deadlift', category: 'pull' as const }
      ];

      for (const exercise of demoExercises) {
        await addExercise(exercise.name, exercise.category);
      }

      setDemoInitialized(true);
    } catch (error) {
      console.error('Error initializing demo:', error);
    }
  };

  const handleAcceptRecommendation = (recommendation: RPProgressionRecommendation) => {
    console.log('Accepted recommendation:', recommendation);
    // In a real app, this would start a workout with these parameters
    alert(`Starting workout with ${recommendation.recommended_sets} sets at ${recommendation.recommended_weight}kg!`);
  };

  const progressionOverview = getProgressionOverview();

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Brain className="h-10 w-10 text-blue-600" />
          RP Progression Engine Demo
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience the power of Renaissance Periodization with intelligent workout progression 
          based on RIR, fatigue tracking, and volume landmarks.
        </p>
      </div>

      {/* Demo Status */}
      {!demoInitialized && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Click "Initialize Demo" to set up sample exercises and see the RP progression system in action.
          </AlertDescription>
        </Alert>
      )}

      {/* Initialization Button */}
      {!demoInitialized && (
        <div className="text-center">
          <Button onClick={initializeDemo} size="lg">
            <Brain className="h-5 w-5 mr-2" />
            Initialize Demo
          </Button>
        </div>
      )}

      {demoInitialized && (
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations">RP Recommendations</TabsTrigger>
            <TabsTrigger value="overview">Progression Overview</TabsTrigger>
            <TabsTrigger value="concepts">RP Concepts</TabsTrigger>
          </TabsList>

          {/* RP Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exercises.slice(0, 6).map((exercise) => (
                <RPProgressionCard
                  key={exercise.id}
                  exercise={exercise}
                  onAcceptRecommendation={handleAcceptRecommendation}
                  className="h-fit"
                />
              ))}
            </div>

            {exercises.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Exercises Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Initialize the demo or add some exercises to see RP recommendations.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Progression Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Mesocycle Progression Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressionOverview.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {progressionOverview.map((overview) => {
                      const exercise = exercises.find(e => e.id === overview.exerciseId);
                      return (
                        <Card key={overview.exerciseId} className="p-4">
                          <h4 className="font-semibold mb-3">{exercise?.name || 'Unknown'}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Week:</span>
                              <Badge variant="outline">{overview.currentWeek}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Volume:</span>
                              <Badge 
                                variant="outline"
                                className={
                                  overview.volumeLandmark === 'MEV' ? 'bg-green-100 text-green-800' :
                                  overview.volumeLandmark === 'MAV' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                {overview.volumeLandmark}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Fatigue:</span>
                              <span>{overview.rollingFatigue.toFixed(1)}/5</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Progressing:</span>
                              <span>{overview.weeksProgressing} weeks</span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No progression data available yet.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Complete some workouts to see progression tracking.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RP Concepts Tab */}
          <TabsContent value="concepts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Core Concepts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Core RP Concepts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Badge className="bg-green-500 text-white mb-2">MEV</Badge>
                      <p className="text-sm">
                        <strong>Minimum Effective Volume:</strong> The least amount of training volume 
                        that produces measurable gains.
                      </p>
                    </div>
                    <div>
                      <Badge className="bg-yellow-500 text-white mb-2">MAV</Badge>
                      <p className="text-sm">
                        <strong>Maximum Adaptive Volume:</strong> The training volume that produces 
                        the most gains without exceeding recovery capacity.
                      </p>
                    </div>
                    <div>
                      <Badge className="bg-red-500 text-white mb-2">MRV</Badge>
                      <p className="text-sm">
                        <strong>Maximum Recoverable Volume:</strong> The highest volume you can 
                        recover from. Beyond this, performance declines.
                      </p>
                    </div>
                    <div>
                      <Badge className="bg-blue-500 text-white mb-2">RIR</Badge>
                      <p className="text-sm">
                        <strong>Reps in Reserve:</strong> How many more reps you could have done 
                        before reaching failure. Key for managing intensity.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progression Logic */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progression Logic
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Weight Progression</p>
                        <p className="text-sm text-gray-600">
                          When RIR > 3 and fatigue is low, increase weight
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Volume Progression</p>
                        <p className="text-sm text-gray-600">
                          When RIR 1-2 and performing well, add sets
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Deload Phase</p>
                        <p className="text-sm text-gray-600">
                          When fatigue is high or RIR consistently at 0
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Maintain</p>
                        <p className="text-sm text-gray-600">
                          When performance is inconsistent or fatigue is moderate
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sample Workout Flow */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Sample 4-Week Mesocycle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Badge className="bg-blue-500 text-white mb-2">Week 1</Badge>
                      <p className="text-sm">
                        <strong>Accumulation</strong><br />
                        3 sets, RIR 3<br />
                        Build base volume
                      </p>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-blue-600 text-white mb-2">Week 2</Badge>
                      <p className="text-sm">
                        <strong>Progression</strong><br />
                        4 sets, RIR 2<br />
                        Increase volume
                      </p>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-purple-500 text-white mb-2">Week 3</Badge>
                      <p className="text-sm">
                        <strong>Intensification</strong><br />
                        5 sets, RIR 1<br />
                        Peak training stress
                      </p>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-orange-500 text-white mb-2">Week 4</Badge>
                      <p className="text-sm">
                        <strong>Deload</strong><br />
                        2 sets, RIR 4<br />
                        Recovery & adaptation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default RPProgressionDemo; 