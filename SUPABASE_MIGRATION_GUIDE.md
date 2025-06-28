# Supabase Migration Guide

This guide explains how to migrate your workout app from SQLite to Supabase while maintaining offline-first functionality.

## Setup Steps

### 1. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to Settings > API
3. Copy your Project URL and anon/public key

### 2. Environment Configuration

Create a `.env` file in the `fit-forecast-buddy` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Database Schema Setup

Run the SQL script in `supabase-schema.sql` in your Supabase SQL Editor:

- Go to your Supabase dashboard
- Navigate to SQL Editor
- Copy and paste the entire content of `supabase-schema.sql`
- Run the script

This will create:
- All necessary tables (exercises, workouts, workout_sets, etc.)
- Indexes for performance
- Views for common queries
- RLS policies
- Default exercises

### 4. Migration from SQLite

To use the new Supabase backend, update your components to use the new hook:

**Before (SQLite):**
```typescript
import { useWorkouts } from '../hooks/useWorkouts';

const MyComponent = () => {
  const { workouts, exercises, saveWorkout, addExercise } = useWorkouts();
  // ...
};
```

**After (Supabase):**
```typescript
import { useSupabaseWorkouts } from '../hooks/useSupabaseWorkouts';

const MyComponent = () => {
  const { workouts, exercises, saveWorkout, addExercise } = useSupabaseWorkouts();
  // ...
};
```

The API is identical, so no other changes are needed!

## Key Features

### ✅ Offline-First Design

- **Automatic caching**: All data is cached locally in localStorage
- **Offline operations**: When offline, operations are queued for later sync
- **Auto-sync**: Automatically syncs when internet connection is restored
- **Fallback**: Always falls back to cached data when Supabase is unavailable

### ✅ Data Migration

The new system preserves all your existing data structure:

- **Exercises**: Same structure with automatic categorization
- **Workouts**: Complete workout sessions with duration and notes
- **Sets**: Individual sets with reps, weight, rest time, and RIR
- **RP Progression**: Full Renaissance Periodization tracking

### ✅ Performance Features

- **Optimized queries**: Uses Supabase views and indexes
- **Batched operations**: Efficient bulk operations for sets
- **Smart caching**: Intelligent local storage management
- **Real-time capabilities**: Ready for future real-time features

## API Reference

### useSupabaseWorkouts Hook

```typescript
const {
  // Data
  workouts,           // Array of workout objects
  exercises,          // Array of available exercises
  loading,            // Loading state for async operations
  isReady,            // Always true for Supabase (no init needed)
  
  // Actions
  saveWorkout,        // Save a new workout
  updateWorkout,      // Update existing workout
  deleteWorkout,      // Delete a workout
  addExercise,        // Add a new exercise
  loadWorkouts,       // Manually reload workouts
  loadExercises,      // Manually reload exercises
  
  // Statistics
  getWorkoutSummary,  // Get workout summary stats
  getExerciseStats,   // Get exercise statistics
  
  // Offline sync
  forceSyncOfflineOperations  // Manually trigger sync
} = useSupabaseWorkouts();
```

### Service Layer

For direct database access, use the service classes:

```typescript
import { WorkoutService } from '../services/workoutService';
import { ExerciseService } from '../services/exerciseService';
import { OfflineService } from '../services/offlineService';

// Examples
const workouts = await WorkoutService.getWorkouts(20);
const exercises = await ExerciseService.getExercises();
const syncResult = await OfflineService.syncOfflineOperations();
```

## Offline Sync Logic

### How it Works

1. **Online Operations**: Direct to Supabase + update cache
2. **Offline Operations**: Queue operation + update cache immediately
3. **Connection Restored**: Auto-sync queued operations
4. **Manual Sync**: Call `forceSyncOfflineOperations()`

### Sync Status

```typescript
import { OfflineService } from '../services/offlineService';

const status = OfflineService.getSyncStatus();
console.log(`Pending operations: ${status.pendingOperations}`);
console.log(`Last sync: ${status.lastSyncAttempt}`);
```

## Database Schema Overview

### Core Tables

- **exercises**: Exercise definitions with categories and muscle groups
- **workouts**: Workout sessions with metadata
- **workout_sets**: Individual sets within workouts
- **workout_exercise_data**: Exercise-specific ratings (pump, performance)

### RP Progression Tables

- **rp_progression_state**: Current progression state per exercise
- **mesocycle_settings**: RP configuration per exercise

### Sync Table

- **sync_queue**: Tracks offline operations and sync status

## Troubleshooting

### Connection Issues

If you see Supabase connection warnings:
1. Check your `.env` file has correct values
2. Verify your Supabase project is active
3. Check browser console for detailed errors

### Offline Sync Issues

If offline operations aren't syncing:
1. Check browser console for sync errors
2. Call `forceSyncOfflineOperations()` manually
3. Check Supabase logs in the dashboard

### Data Migration

To migrate existing SQLite data:
1. Export data from your current SQLite database
2. Use Supabase's import tools or write a migration script
3. The schema is compatible - just map the IDs

## Best Practices

### Performance

- Use the provided hooks rather than calling services directly
- Let the auto-sync handle offline operations
- Cache is automatically managed - don't clear it manually

### Error Handling

- The system gracefully handles network failures
- Always falls back to cached data
- Monitor sync status for important operations

### Development

- Use browser dev tools to simulate offline mode
- Check the `sync_queue` table for debugging offline operations
- Enable debug logging via environment variable

## Future Enhancements

This migration enables several future features:

- **Multi-user support**: User authentication and data isolation
- **Real-time sync**: Live updates across devices
- **Advanced analytics**: Server-side workout analysis
- **Backup/restore**: Automatic cloud backup
- **Team features**: Shared workouts and competitions 