import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Timer, 
  Dumbbell,
  Activity,
  Brain,
  BarChart3,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { RPProgressionRecommendation, Exercise } from '../types/workout';
import { useRPProgression } from '../hooks/useRPProgression';

interface RPProgressionCardProps {
  exercise: Exercise;
  onAcceptRecommendation?: (recommendation: RPProgressionRecommendation) => void;
  className?: string;
}

export const RPProgressionCard: React.FC<RPProgressionCardProps> = ({ 
  exercise, 
  onAcceptRecommendation,
  className = ""
}) => {
  const { getProgressionRecommendation, progressionStates, mesocycleSettings } = useRPProgression();
  const [recommendation, setRecommendation] = useState<RPProgressionRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendation();
  }, [exercise.id]);

  const loadRecommendation = async () => {
    setLoading(true);
    try {
      const rec = await getProgressionRecommendation(exercise.id, exercise.name);
      setRecommendation(rec);
    } catch (error) {
      console.error('Error loading RP recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressionIcon = (type: string) => {
    switch (type) {
      case 'weight': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'volume': return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'deload': return <TrendingDown className="h-4 w-4 text-orange-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProgressionBadgeColor = (type: string) => {
    switch (type) {
      case 'weight': return 'bg-green-500';
      case 'volume': return 'bg-blue-500';
      case 'deload': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getMesocyclePhaseBadge = (phase: string) => {
    const phaseColors = {
      'accumulation': 'bg-blue-100 text-blue-800',
      'intensification': 'bg-purple-100 text-purple-800',
      'deload': 'bg-orange-100 text-orange-800',
      'reset': 'bg-green-100 text-green-800'
    };
    
    return phaseColors[phase as keyof typeof phaseColors] || 'bg-gray-100 text-gray-800';
  };

  const getVolumeLandmarkProgress = () => {
    const state = progressionStates[exercise.id];
    const settings = mesocycleSettings[exercise.id];
    
    if (!state || !settings) return 0;
    
    const currentSets = state.previous_sets;
    const maxSets = settings.mrv_sets;
    
    return Math.min((currentSets / maxSets) * 100, 100);
  };

  const getVolumeLandmarkColor = () => {
    const state = progressionStates[exercise.id];
    if (!state) return 'bg-gray-200';
    
    switch (state.volume_landmark) {
      case 'MEV': return 'bg-green-500';
      case 'MAV': return 'bg-yellow-500';
      case 'MRV': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) {
    return (
      <Card className={`${className} border-dashed`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-500">
            <Brain className="h-5 w-5" />
            {exercise.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            No progression data available. Complete a workout to get RP recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const state = progressionStates[exercise.id];
  const settings = mesocycleSettings[exercise.id];

  return (
    <Card className={`${className} ${recommendation.deload_week ? 'border-orange-200 bg-orange-50' : 'border-blue-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5" />
            {exercise.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={getMesocyclePhaseBadge(recommendation.mesocycle_phase)}
            >
              {recommendation.mesocycle_phase}
            </Badge>
            {recommendation.deload_week && (
              <Badge variant="destructive" className="bg-orange-500">
                Deload Week
              </Badge>
            )}
          </div>
        </div>
        
        {state && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Week {state.current_mesocycle_week}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Fatigue: {state.rolling_fatigue_score.toFixed(1)}/5
            </span>
            <span>•</span>
            <span>{state.volume_landmark} Volume</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Volume Progress Bar */}
        {state && settings && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Volume Progression</span>
              <span>{state.previous_sets} / {settings.mrv_sets} sets</span>
            </div>
            <div className="relative">
              <Progress value={getVolumeLandmarkProgress()} className="h-2" />
              <div 
                className={`absolute top-0 left-0 h-2 rounded-full ${getVolumeLandmarkColor()}`}
                style={{ width: `${getVolumeLandmarkProgress()}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>MEV</span>
              <span>MAV</span>
              <span>MRV</span>
            </div>
          </div>
        )}

        {/* Recommendation Alert */}
        {recommendation.deload_week ? (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Deload Week Recommended:</strong> {recommendation.reasoning}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {recommendation.reasoning}
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendation Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Weight</span>
              <Badge 
                variant="outline" 
                className={`${getProgressionBadgeColor(recommendation.progression_type)} text-white`}
              >
                {recommendation.recommended_weight}kg
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Sets</span>
              <Badge variant="outline">
                {recommendation.recommended_sets} sets
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Target RIR</span>
              <Badge variant="outline">
                {recommendation.target_rir}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Rest</span>
              <Badge variant="outline">
                {Math.floor(recommendation.rest_time / 60)}:{(recommendation.rest_time % 60).toString().padStart(2, '0')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Progression Type Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getProgressionIcon(recommendation.progression_type)}
            <Badge 
              variant="secondary"
              className={`${getProgressionBadgeColor(recommendation.progression_type)} text-white`}
            >
              {recommendation.progression_type.charAt(0).toUpperCase() + recommendation.progression_type.slice(1)} Progression
            </Badge>
          </div>
          
          <div className="text-sm text-gray-500">
            {Math.round(recommendation.confidence * 100)}% confidence
          </div>
        </div>

        {/* Action Button */}
        {onAcceptRecommendation && (
          <Button 
            onClick={() => onAcceptRecommendation(recommendation)}
            className="w-full"
            variant={recommendation.deload_week ? "destructive" : "default"}
          >
            {recommendation.deload_week ? 'Start Deload Week' : 'Use This Recommendation'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RPProgressionCard; 