import { 
  RPProgressionState, 
  RPWorkoutLog, 
  RPProgressionRecommendation, 
  MesocycleSettings,
  Exercise 
} from '../types/workout';

/**
 * Core Renaissance Periodization Progression Engine
 * Implements RP logic for adaptive training suggestions
 */
export class RPProgressionEngine {
  
  /**
   * Generate RP-based workout recommendation
   */
  static generateRecommendation(
    exerciseId: string,
    exerciseName: string,
    logs: RPWorkoutLog[],
    progressionState: RPProgressionState,
    settings: MesocycleSettings
  ): RPProgressionRecommendation {
    
    if (logs.length === 0) {
      return this.getBeginnerRecommendation(exerciseId, exerciseName, settings);
    }

    const latestLog = logs[logs.length - 1];
    const recentLogs = logs.slice(-3); // Last 3 sessions for trend analysis
    
    // Calculate trend metrics
    const avgRIR = latestLog.avg_rir;
    const fatigue = latestLog.fatigue;
    const soreness = latestLog.soreness;
    const performance = latestLog.performance;
    
    // Update rolling fatigue score
    const rollingFatigue = this.calculateRollingFatigue(recentLogs);
    
    // Check for deload conditions
    if (this.shouldDeload(logs, progressionState, settings)) {
      return this.generateDeloadRecommendation(exerciseId, exerciseName, latestLog, settings);
    }
    
    // Determine progression type based on RP logic
    const progressionType = this.determineProgressionType(
      avgRIR, 
      fatigue, 
      soreness, 
      performance,
      progressionState,
      settings
    );
    
    return this.generateProgressionRecommendation(
      exerciseId,
      exerciseName,
      latestLog,
      progressionState,
      settings,
      progressionType,
      rollingFatigue
    );
  }

  /**
   * Determine progression type based on RP principles
   */
  private static determineProgressionType(
    avgRIR: number,
    fatigue: number,
    soreness: number,
    performance: number,
    state: RPProgressionState,
    settings: MesocycleSettings
  ): 'weight' | 'volume' | 'maintain' | 'deload' {
    
    const fatigueHigh = fatigue >= 4 || soreness >= 4;
    const performanceGood = performance >= 4;
    
    // High fatigue = maintain or deload
    if (fatigueHigh) {
      return avgRIR <= 0 ? 'deload' : 'maintain';
    }
    
    // Good performance and RIR management
    if (performanceGood && avgRIR > 3) {
      // Too much RIR, increase intensity (weight)
      return 'weight';
    }
    
    if (performanceGood && avgRIR >= 1 && avgRIR <= 2) {
      // Good RIR range, check volume progression
      const currentSets = state.previous_sets;
      const isWithinVolumeProgression = currentSets < settings.mav_sets;
      
      return isWithinVolumeProgression ? 'volume' : 'weight';
    }
    
    if (avgRIR <= 0) {
      // No RIR left, likely need deload or volume reduction
      return state.consecutive_weeks_progressing >= 2 ? 'deload' : 'maintain';
    }
    
    return 'maintain';
  }

  /**
   * Check if deload is needed based on RP criteria
   */
  private static shouldDeload(
    logs: RPWorkoutLog[],
    state: RPProgressionState,
    settings: MesocycleSettings
  ): boolean {
    
    if (logs.length < 2) return false;
    
    const recentLogs = logs.slice(-3);
    
    // Condition 1: Consecutive weeks at RIR 0 or below
    const consecutiveLowRIR = recentLogs.every(log => log.avg_rir <= 0);
    
    // Condition 2: High fatigue for multiple sessions
    const consecutiveHighFatigue = recentLogs.slice(-2).every(log => 
      log.fatigue >= 4 || log.soreness >= 4
    );
    
    // Condition 3: Performance decline
    const performanceDecline = recentLogs.length >= 3 && 
      recentLogs[recentLogs.length - 1].performance < recentLogs[0].performance - 1;
    
    // Condition 4: Training duration exceeds deload frequency
    const weeksProgressing = state.consecutive_weeks_progressing;
    const timeForDeload = weeksProgressing >= settings.deload_frequency_weeks;
    
    // Condition 5: Volume has reached MRV
    const volumeAtMRV = state.volume_landmark === 'MRV';
    
    return consecutiveLowRIR || consecutiveHighFatigue || performanceDecline || 
           timeForDeload || volumeAtMRV;
  }

  /**
   * Generate deload recommendation
   */
  private static generateDeloadRecommendation(
    exerciseId: string,
    exerciseName: string,
    latestLog: RPWorkoutLog,
    settings: MesocycleSettings
  ): RPProgressionRecommendation {
    
    const deloadSets = Math.max(1, Math.floor(latestLog.sets * 0.5));
    const deloadWeight = Math.round((latestLog.weight * 0.7) * 2) / 2;
    
    return {
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      recommended_sets: deloadSets,
      recommended_weight: deloadWeight,
      target_rir: 4,
      target_reps: latestLog.avg_reps,
      rest_time: this.getRestTime('deload', exerciseName),
      progression_type: 'deload',
      confidence: 0.95,
      reasoning: this.getDeloadReasoning(latestLog),
      deload_week: true,
      mesocycle_phase: 'deload'
    };
  }

  /**
   * Generate progression recommendation based on type
   */
  private static generateProgressionRecommendation(
    exerciseId: string,
    exerciseName: string,
    latestLog: RPWorkoutLog,
    state: RPProgressionState,
    settings: MesocycleSettings,
    progressionType: 'weight' | 'volume' | 'maintain',
    rollingFatigue: number
  ): RPProgressionRecommendation {
    
    let recommendedSets = latestLog.sets;
    let recommendedWeight = latestLog.weight;
    let targetRIR = 2;
    let reasoning = '';
    let confidence = 0.8;
    
    switch (progressionType) {
      case 'weight':
        recommendedWeight = Math.round((latestLog.weight + settings.weight_increment) * 2) / 2;
        targetRIR = 2;
        reasoning = `Good recovery and high RIR (${latestLog.avg_rir}). Increasing weight by ${settings.weight_increment}kg.`;
        confidence = 0.9;
        break;
        
      case 'volume':
        recommendedSets = Math.min(latestLog.sets + 1, settings.mav_sets);
        targetRIR = 2;
        reasoning = `Good performance in RIR range (${latestLog.avg_rir}). Adding one set for volume progression.`;
        confidence = 0.85;
        break;
        
      case 'maintain':
        reasoning = `Maintaining current load. RIR: ${latestLog.avg_rir}, Fatigue: ${latestLog.fatigue}`;
        confidence = 0.75;
        break;
    }
    
    // Adjust target RIR based on volume landmark
    if (state.volume_landmark === 'MRV') {
      targetRIR = Math.max(1, targetRIR - 1);
    } else if (state.volume_landmark === 'MEV') {
      targetRIR = Math.min(3, targetRIR + 1);
    }
    
    const mesocyclePhase = this.determineMesocyclePhase(state.current_mesocycle_week, settings);
    
    return {
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      recommended_sets: recommendedSets,
      recommended_weight: recommendedWeight,
      target_rir: targetRIR,
      target_reps: latestLog.avg_reps,
      rest_time: this.getRestTime(progressionType, exerciseName),
      progression_type: progressionType,
      confidence,
      reasoning,
      deload_week: false,
      mesocycle_phase
    };
  }

  /**
   * Get beginner recommendation
   */
  private static getBeginnerRecommendation(
    exerciseId: string,
    exerciseName: string,
    settings: MesocycleSettings
  ): RPProgressionRecommendation {
    
    const baseWeights: Record<string, number> = {
      'bench': 20, 'press': 15, 'squat': 30, 'deadlift': 40, 
      'row': 20, 'pullup': 0, 'dip': 0
    };
    
    const exerciseKey = exerciseName.toLowerCase();
    let baseWeight = 20;
    
    for (const [key, weight] of Object.entries(baseWeights)) {
      if (exerciseKey.includes(key)) {
        baseWeight = weight;
        break;
      }
    }
    
    return {
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      recommended_sets: settings.mev_sets,
      recommended_weight: baseWeight,
      target_rir: 3,
      target_reps: 8,
      rest_time: 90,
      progression_type: 'maintain',
      confidence: 0.8,
      reasoning: 'Starting recommendation for new exercise',
      deload_week: false,
      mesocycle_phase: 'accumulation'
    };
  }

  /**
   * Calculate rolling fatigue score
   */
  private static calculateRollingFatigue(logs: RPWorkoutLog[]): number {
    if (logs.length === 0) return 2;
    
    const weights = [0.5, 0.3, 0.2]; // More recent sessions weighted higher
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < Math.min(logs.length, 3); i++) {
      const log = logs[logs.length - 1 - i];
      const weight = weights[i] || 0.1;
      weightedSum += (log.fatigue + log.soreness) * weight;
      totalWeight += weight;
    }
    
    return weightedSum / totalWeight;
  }

  /**
   * Determine current mesocycle phase
   */
  private static determineMesocyclePhase(
    currentWeek: number, 
    settings: MesocycleSettings
  ): 'accumulation' | 'intensification' | 'deload' | 'reset' {
    
    const cyclePosition = currentWeek % (settings.deload_frequency_weeks + 1);
    
    if (cyclePosition === 0) return 'deload';
    if (cyclePosition <= 2) return 'accumulation';
    if (cyclePosition <= 4) return 'intensification';
    
    return 'reset';
  }

  /**
   * Get appropriate rest time based on progression type
   */
  private static getRestTime(progressionType: string, exerciseName: string): number {
    const baseTimes: Record<string, number> = {
      'legs': 120,
      'push': 90,
      'pull': 90,
      'core': 60
    };
    
    let baseTime = 90;
    
    // Determine base time from exercise name
    const exerciseKey = exerciseName.toLowerCase();
    if (exerciseKey.includes('squat') || exerciseKey.includes('deadlift') || exerciseKey.includes('lunge')) {
      baseTime = baseTimes.legs;
    } else if (exerciseKey.includes('bench') || exerciseKey.includes('press') || exerciseKey.includes('dip')) {
      baseTime = baseTimes.push;
    } else if (exerciseKey.includes('pull') || exerciseKey.includes('row')) {
      baseTime = baseTimes.pull;
    } else if (exerciseKey.includes('plank') || exerciseKey.includes('crunch')) {
      baseTime = baseTimes.core;
    }
    
    // Adjust based on progression type
    switch (progressionType) {
      case 'weight': return baseTime + 30; // More rest for heavier weights
      case 'volume': return baseTime + 15; // Slightly more rest for more sets
      case 'deload': return baseTime - 15; // Less rest during deload
      default: return baseTime;
    }
  }

  /**
   * Generate deload reasoning text
   */
  private static getDeloadReasoning(log: RPWorkoutLog): string {
    const reasons = [];
    
    if (log.avg_rir <= 0) {
      reasons.push('RIR at zero - approaching failure');
    }
    
    if (log.fatigue >= 4) {
      reasons.push('high fatigue levels');
    }
    
    if (log.soreness >= 4) {
      reasons.push('high soreness levels');
    }
    
    if (log.performance <= 2) {
      reasons.push('declining performance');
    }
    
    if (reasons.length === 0) {
      reasons.push('scheduled deload for recovery');
    }
    
    return `Deload recommended due to: ${reasons.join(', ')}.`;
  }

  /**
   * Update progression state after workout
   */
  static updateProgressionState(
    currentState: RPProgressionState,
    newLog: RPWorkoutLog,
    recommendation: RPProgressionRecommendation
  ): RPProgressionState {
    
    const updatedState = { ...currentState };
    
    // Update basic metrics
    updatedState.previous_sets = newLog.sets;
    updatedState.previous_weight = newLog.weight;
    updatedState.previous_rir_avg = newLog.avg_rir;
    updatedState.rolling_fatigue_score = this.calculateRollingFatigue([newLog]);
    updatedState.updated_at = new Date().toISOString();
    
    // Update mesocycle tracking
    if (recommendation.deload_week) {
      updatedState.current_mesocycle_week = 1;
      updatedState.consecutive_weeks_progressing = 0;
      updatedState.last_deload_date = newLog.date;
      updatedState.volume_landmark = 'MEV';
    } else {
      updatedState.current_mesocycle_week += 1;
      
      if (recommendation.progression_type !== 'maintain') {
        updatedState.consecutive_weeks_progressing += 1;
      }
      
      // Update volume landmark based on sets
      if (newLog.sets >= 8) {
        updatedState.volume_landmark = 'MRV';
      } else if (newLog.sets >= 5) {
        updatedState.volume_landmark = 'MAV';
      } else {
        updatedState.volume_landmark = 'MEV';
      }
    }
    
    return updatedState;
  }
}

/**
 * Default mesocycle settings for different exercise types
 */
export const getDefaultMesocycleSettings = (exercise: Exercise): MesocycleSettings => {
  const categoryDefaults: Record<string, Partial<MesocycleSettings>> = {
    'legs': {
      mev_sets: 4,
      mav_sets: 8,
      mrv_sets: 12,
      deload_frequency_weeks: 4,
      weight_increment: 5.0
    },
    'push': {
      mev_sets: 3,
      mav_sets: 6,
      mrv_sets: 10,
      deload_frequency_weeks: 4,
      weight_increment: 2.5
    },
    'pull': {
      mev_sets: 3,
      mav_sets: 6,
      mrv_sets: 10,
      deload_frequency_weeks: 4,
      weight_increment: 2.5
    },
    'core': {
      mev_sets: 2,
      mav_sets: 4,
      mrv_sets: 6,
      deload_frequency_weeks: 6,
      weight_increment: 2.5
    }
  };

  const defaults = categoryDefaults[exercise.category] || categoryDefaults['push'];
  
  return {
    exercise_id: exercise.id,
    mev_sets: defaults.mev_sets || 3,
    mav_sets: defaults.mav_sets || 6,
    mrv_sets: defaults.mrv_sets || 10,
    deload_frequency_weeks: defaults.deload_frequency_weeks || 4,
    target_rir_range: [1, 3],
    weight_increment: defaults.weight_increment || 2.5
  };
}; 