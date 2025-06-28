# 🧠 Renaissance Periodization (RP) Progression Engine

A sophisticated workout progression system based on Renaissance Periodization principles, featuring intelligent recommendations, fatigue tracking, and adaptive volume management.

## 🎯 Overview

The RP Progression Engine automatically analyzes your workout data to provide intelligent recommendations for:
- **Set count progression** (volume management)
- **Weight progression** (intensity management) 
- **Target RIR** (proximity to failure)
- **Deload timing** (recovery management)
- **Mesocycle phases** (periodization)

## 🏗️ Core Components

### 1. **Types & Interfaces** (`src/types/workout.ts`)
Enhanced workout types with RP metrics:
- `RPProgressionState` - Tracks mesocycle progression per exercise
- `RPWorkoutLog` - Workout data with RIR, fatigue, pump, performance
- `RPProgressionRecommendation` - AI-generated workout suggestions
- `MesocycleSettings` - Volume landmarks (MEV/MAV/MRV) per exercise

### 2. **Database Schema** (`src/hooks/useDatabase.ts`)
Extended tables for RP tracking:
```sql
-- Enhanced workout_sets with RIR
workout_sets: (id, workout_id, exercise_id, reps, weight, rest_time, notes, rir)

-- Enhanced workouts with session metrics  
workouts: (id, date, duration, notes, overall_fatigue, overall_soreness, session_rating)

-- RP progression state tracking
rp_progression_state: (exercise_id, current_mesocycle_week, previous_sets, previous_weight, ...)

-- Volume landmark settings per exercise
mesocycle_settings: (exercise_id, mev_sets, mav_sets, mrv_sets, deload_frequency_weeks, ...)

-- Exercise-level ratings
workout_exercise_data: (id, workout_id, exercise_id, pump_rating, performance_rating)
```

### 3. **RP Engine Logic** (`src/utils/rpProgressionEngine.ts`)
Core progression algorithms:
- **Volume Progression**: MEV → MAV → MRV tracking
- **Intensity Management**: RIR-based weight progression  
- **Deload Detection**: Multi-factor fatigue analysis
- **Mesocycle Phases**: Accumulation → Intensification → Deload → Reset

### 4. **React Hooks** (`src/hooks/useRPProgression.ts`)
State management for RP data:
```typescript
const {
  getProgressionRecommendation,
  logWorkout,
  updateMesocycleSettings,
  getProgressionOverview
} = useRPProgression();
```

### 5. **UI Components** 
- `RPProgressionCard` - Visual recommendation display
- `RPWorkoutSession` - Enhanced workout logging with RP metrics
- Enhanced `SetRow` - RIR tracking per set

## 📊 Key RP Concepts

| Term | Definition | Range |
|------|------------|-------|
| **MEV** | Minimum Effective Volume - least sets for gains | 2-4 sets |
| **MAV** | Maximum Adaptive Volume - optimal volume for gains | 4-8 sets |
| **MRV** | Maximum Recoverable Volume - maximum trainable volume | 8-12 sets |
| **RIR** | Reps in Reserve - proximity to failure | 0-4 reps |
| **Fatigue** | Systemic tiredness level | 1-5 scale |
| **Pump** | Exercise-specific muscle fullness | 1-5 scale |

## 🤖 Progression Logic

### Weight Progression
```typescript
if (avgRIR > 3 && fatigue <= 3) {
  // Increase weight by 2.5-5kg
  recommendedWeight += weightIncrement;
  targetRIR = 2;
}
```

### Volume Progression  
```typescript
if (avgRIR >= 1 && avgRIR <= 2 && fatigue <= 3) {
  // Add one set (within MAV limit)
  recommendedSets = Math.min(currentSets + 1, settings.mav_sets);
}
```

### Deload Triggers
```typescript
const shouldDeload = 
  consecutiveLowRIR ||           // RIR ≤ 0 for 2+ sessions
  consecutiveHighFatigue ||       // Fatigue ≥ 4 for 2+ sessions  
  performanceDecline ||           // Performance dropping
  timeForDeload ||               // 4-6 weeks of progression
  volumeAtMRV;                   // Volume at maximum
```

## 🚀 Usage Examples

### Basic Recommendation
```typescript
const recommendation = await getProgressionRecommendation(exerciseId, exerciseName);
// Returns: { recommended_sets: 4, recommended_weight: 102.5, target_rir: 2, ... }
```

### Enhanced Workout Logging
```typescript
const workout: Workout = {
  // ... basic workout data
  overall_fatigue: 3,
  overall_soreness: 2, 
  session_rating: 4
};

const exerciseData: WorkoutExercise[] = [{
  exercise: benchPress,
  sets: [
    { reps: 10, weight: 100, rir: 2 },
    { reps: 9, weight: 100, rir: 1 },
    { reps: 8, weight: 100, rir: 0 }
  ],
  pump_rating: 4,
  performance_rating: 5
}];

await saveWorkoutWithRP(workout, exerciseData);
```

### Progression Tracking
```typescript
const overview = getProgressionOverview();
// Returns progression state for all exercises:
// [{ exerciseId, currentWeek, volumeLandmark, rollingFatigue, ... }]
```

## 📈 Sample 4-Week Mesocycle

| Week | Phase | Sets | RIR | Focus |
|------|-------|------|-----|-------|
| 1 | Accumulation | 3 | 3 | Build base volume |
| 2 | Progression | 4 | 2 | Increase training stress |
| 3 | Intensification | 5 | 1 | Peak volume/intensity |
| 4 | Deload | 2 | 4 | Recovery & adaptation |

## 🎛️ Configuration

### Default Settings by Exercise Category
```typescript
const defaultSettings = {
  'legs': { mev: 4, mav: 8, mrv: 12, increment: 5.0 },
  'push': { mev: 3, mav: 6, mrv: 10, increment: 2.5 },
  'pull': { mev: 3, mav: 6, mrv: 10, increment: 2.5 },
  'core': { mev: 2, mav: 4, mrv: 6, increment: 2.5 }
};
```

### Custom Exercise Settings
```typescript
await updateMesocycleSettings(exerciseId, {
  mev_sets: 4,
  mav_sets: 8, 
  mrv_sets: 12,
  deload_frequency_weeks: 5,
  target_rir_range: [1, 2],
  weight_increment: 2.5
});
```

## 🔄 Workflow Integration

1. **Exercise Creation**: Auto-initialize RP progression state
2. **Workout Logging**: Capture RIR, fatigue, pump, performance
3. **Recommendation Generation**: AI analyzes trends and suggests next workout
4. **Progress Tracking**: Monitor volume landmarks and mesocycle progression
5. **Deload Management**: Automatic detection and recommendation

## 🧪 Testing the System

1. Initialize demo exercises:
```typescript
await addExercise('Bench Press', 'push');
await addExercise('Squat', 'legs'); 
await addExercise('Deadlift', 'pull');
```

2. Log sample workouts with varying RIR/fatigue levels
3. Observe progression recommendations adapt to your data
4. Test deload triggers by logging high fatigue sessions

## 🎯 Benefits

- **Intelligent Progression**: No more guessing - let RP science guide your training
- **Fatigue Management**: Automatic deload detection prevents overreaching
- **Personalized Volume**: Adapts to your individual recovery capacity
- **Performance Optimization**: Balances volume, intensity, and recovery
- **Long-term Planning**: Structured mesocycle progression for sustained gains

## 📚 Further Reading

- [Renaissance Periodization Handbook](https://renaissanceperiodization.com/)
- Scientific Principles of Strength Training - Mike Israetel
- Volume Landmarks Research - RP Team

---

*This RP Progression Engine represents cutting-edge exercise science translated into intelligent software. Train smarter, not just harder.* 🧠💪 