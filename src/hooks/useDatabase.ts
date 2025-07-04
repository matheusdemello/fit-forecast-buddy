import { useState, useEffect } from 'react';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

// Web fallback database interface
interface WebDatabase {
  query: (sql: string, params?: any[]) => Promise<{ values?: any[] }>;
  run: (sql: string, params?: any[]) => Promise<void>;
  execute: (sql: string) => Promise<void>;
}

// Web fallback implementation using localStorage
class WebDatabaseFallback implements WebDatabase {
  private storage = {
    exercises: 'workout_exercises',
    workouts: 'workout_workouts', 
    sets: 'workout_sets'
  };

  async query(sql: string, params?: any[]): Promise<{ values?: any[] }> {
    const lowerSql = sql.toLowerCase();
    
    if (lowerSql.includes('select * from exercises')) {
      const exercises = this.getStoredData(this.storage.exercises, []);
      return { values: exercises };
    }
    
    if (lowerSql.includes('select * from workouts')) {
      const workouts = this.getStoredData(this.storage.workouts, []);
      return { values: workouts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20) };
    }
    
    if (lowerSql.includes('from workout_sets ws join exercises e')) {
      const workoutId = params?.[0];
      const sets = this.getStoredData(this.storage.sets, []);
      const exercises = this.getStoredData(this.storage.exercises, []);
      
      const workoutSets = sets
        .filter((set: any) => set.workout_id === workoutId)
        .map((set: any) => {
          const exercise = exercises.find((e: any) => e.id === set.exercise_id);
          return {
            ...set,
            exercise_name: exercise?.name || 'Unknown',
            category: exercise?.category || 'unknown',
            muscle_groups: exercise?.muscle_groups || '[]'
          };
        });
      
      return { values: workoutSets };
    }
    
    return { values: [] };
  }

  async run(sql: string, params?: any[]): Promise<void> {
    const lowerSql = sql.toLowerCase();
    
    if (lowerSql.includes('insert or ignore into exercises')) {
      const exercises = this.getStoredData(this.storage.exercises, []);
      const [id, name, category, muscle_groups] = params || [];
      
      if (!exercises.find((e: any) => e.id === id)) {
        exercises.push({ id, name, category, muscle_groups });
        localStorage.setItem(this.storage.exercises, JSON.stringify(exercises));
      }
    }
    
    if (lowerSql.includes('insert into exercises')) {
      const exercises = this.getStoredData(this.storage.exercises, []);
      const [id, name, category, muscle_groups] = params || [];
      
      exercises.push({ id, name, category, muscle_groups });
      localStorage.setItem(this.storage.exercises, JSON.stringify(exercises));
    }
    
    if (lowerSql.includes('insert into workouts')) {
      const workouts = this.getStoredData(this.storage.workouts, []);
      const [id, date, duration, notes] = params || [];
      workouts.push({ id, date, duration, notes });
      localStorage.setItem(this.storage.workouts, JSON.stringify(workouts));
    }
    
    if (lowerSql.includes('insert into workout_sets')) {
      const sets = this.getStoredData(this.storage.sets, []);
      const [id, workout_id, exercise_id, reps, weight, rest_time, notes] = params || [];
      sets.push({ id, workout_id, exercise_id, reps, weight, rest_time, notes });
      localStorage.setItem(this.storage.sets, JSON.stringify(sets));
    }

    if (lowerSql.includes('delete from workout_sets where workout_id')) {
      const sets = this.getStoredData(this.storage.sets, []);
      const workoutId = params?.[0];
      const filteredSets = sets.filter((set: any) => set.workout_id !== workoutId);
      localStorage.setItem(this.storage.sets, JSON.stringify(filteredSets));
    }

    if (lowerSql.includes('delete from workouts where id')) {
      const workouts = this.getStoredData(this.storage.workouts, []);
      const workoutId = params?.[0];
      const filteredWorkouts = workouts.filter((workout: any) => workout.id !== workoutId);
      localStorage.setItem(this.storage.workouts, JSON.stringify(filteredWorkouts));
    }

    if (lowerSql.includes('update workouts set')) {
      const workouts = this.getStoredData(this.storage.workouts, []);
      const [date, duration, notes, workoutId] = params || [];
      
      const workoutIndex = workouts.findIndex((workout: any) => workout.id === workoutId);
      if (workoutIndex !== -1) {
        workouts[workoutIndex] = { ...workouts[workoutIndex], date, duration, notes };
        localStorage.setItem(this.storage.workouts, JSON.stringify(workouts));
      }
    }
  }

  async execute(sql: string): Promise<void> {
    // Table creation queries - no-op for localStorage
    return Promise.resolve();
  }

  private getStoredData(key: string, defaultValue: any) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

export const useDatabase = () => {
  const [db, setDb] = useState<SQLiteDBConnection | WebDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        const sqlite = new SQLiteConnection(CapacitorSQLite);
        
        // Create or open database
        const database = await sqlite.createConnection('workout_tracker.db', false, 'no-encryption', 1, false);
        await database.open();

        // Create tables
        await database.execute(`
          CREATE TABLE IF NOT EXISTS exercises (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            muscle_groups TEXT NOT NULL
          );
        `);

        await database.execute(`
          CREATE TABLE IF NOT EXISTS workouts (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            duration INTEGER NOT NULL,
            notes TEXT,
            overall_fatigue INTEGER,
            overall_soreness INTEGER,
            session_rating INTEGER
          );
        `);

        await database.execute(`
          CREATE TABLE IF NOT EXISTS workout_sets (
            id TEXT PRIMARY KEY,
            workout_id TEXT NOT NULL,
            exercise_id TEXT NOT NULL,
            reps INTEGER NOT NULL,
            weight REAL NOT NULL,
            rest_time INTEGER,
            notes TEXT,
            rir INTEGER,
            FOREIGN KEY (workout_id) REFERENCES workouts (id),
            FOREIGN KEY (exercise_id) REFERENCES exercises (id)
          );
        `);

        await database.execute(`
          CREATE TABLE IF NOT EXISTS rp_progression_state (
            exercise_id TEXT PRIMARY KEY,
            current_mesocycle_week INTEGER NOT NULL DEFAULT 1,
            previous_sets INTEGER NOT NULL DEFAULT 3,
            previous_weight REAL NOT NULL DEFAULT 0,
            previous_rir_avg REAL NOT NULL DEFAULT 3,
            rolling_fatigue_score REAL NOT NULL DEFAULT 2,
            consecutive_weeks_progressing INTEGER NOT NULL DEFAULT 0,
            last_deload_date TEXT,
            volume_landmark TEXT NOT NULL DEFAULT 'MEV',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (exercise_id) REFERENCES exercises (id)
          );
        `);

        await database.execute(`
          CREATE TABLE IF NOT EXISTS mesocycle_settings (
            exercise_id TEXT PRIMARY KEY,
            mev_sets INTEGER NOT NULL DEFAULT 3,
            mav_sets INTEGER NOT NULL DEFAULT 6,
            mrv_sets INTEGER NOT NULL DEFAULT 10,
            deload_frequency_weeks INTEGER NOT NULL DEFAULT 4,
            target_rir_min INTEGER NOT NULL DEFAULT 1,
            target_rir_max INTEGER NOT NULL DEFAULT 3,
            weight_increment REAL NOT NULL DEFAULT 2.5,
            FOREIGN KEY (exercise_id) REFERENCES exercises (id)
          );
        `);

        await database.execute(`
          CREATE TABLE IF NOT EXISTS workout_exercise_data (
            id TEXT PRIMARY KEY,
            workout_id TEXT NOT NULL,
            exercise_id TEXT NOT NULL,
            pump_rating INTEGER,
            performance_rating INTEGER,
            FOREIGN KEY (workout_id) REFERENCES workouts (id),
            FOREIGN KEY (exercise_id) REFERENCES exercises (id)
          );
        `);

        // Insert default exercises
        const defaultExercises = [
          { id: '1', name: 'Bench Press', category: 'push', muscle_groups: JSON.stringify(['chest', 'triceps', 'shoulders']) },
          { id: '2', name: 'Squat', category: 'legs', muscle_groups: JSON.stringify(['quadriceps', 'glutes', 'hamstrings']) },
          { id: '3', name: 'Deadlift', category: 'pull', muscle_groups: JSON.stringify(['hamstrings', 'glutes', 'back']) },
          { id: '4', name: 'Pull-ups', category: 'pull', muscle_groups: JSON.stringify(['lats', 'biceps', 'rhomboids']) },
          { id: '5', name: 'Overhead Press', category: 'push', muscle_groups: JSON.stringify(['shoulders', 'triceps', 'core']) },
          { id: '6', name: 'Barbell Row', category: 'pull', muscle_groups: JSON.stringify(['lats', 'rhomboids', 'biceps']) },
          { id: '7', name: 'Dips', category: 'push', muscle_groups: JSON.stringify(['triceps', 'chest', 'shoulders']) },
          { id: '8', name: 'Lunges', category: 'legs', muscle_groups: JSON.stringify(['quadriceps', 'glutes', 'hamstrings']) }
        ];

        for (const exercise of defaultExercises) {
          await database.run(
            'INSERT OR IGNORE INTO exercises (id, name, category, muscle_groups) VALUES (?, ?, ?, ?)',
            [exercise.id, exercise.name, exercise.category, exercise.muscle_groups]
          );
        }

        setDb(database);
        setIsReady(true);
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    const initWebDB = async () => {
      try {
        const webDb = new WebDatabaseFallback();
        
        // Initialize default exercises for web
        const defaultExercises = [
          { id: '1', name: 'Bench Press', category: 'push', muscle_groups: JSON.stringify(['chest', 'triceps', 'shoulders']) },
          { id: '2', name: 'Squat', category: 'legs', muscle_groups: JSON.stringify(['quadriceps', 'glutes', 'hamstrings']) },
          { id: '3', name: 'Deadlift', category: 'pull', muscle_groups: JSON.stringify(['hamstrings', 'glutes', 'back']) },
          { id: '4', name: 'Pull-ups', category: 'pull', muscle_groups: JSON.stringify(['lats', 'biceps', 'rhomboids']) },
          { id: '5', name: 'Overhead Press', category: 'push', muscle_groups: JSON.stringify(['shoulders', 'triceps', 'core']) },
          { id: '6', name: 'Barbell Row', category: 'pull', muscle_groups: JSON.stringify(['lats', 'rhomboids', 'biceps']) },
          { id: '7', name: 'Dips', category: 'push', muscle_groups: JSON.stringify(['triceps', 'chest', 'shoulders']) },
          { id: '8', name: 'Lunges', category: 'legs', muscle_groups: JSON.stringify(['quadriceps', 'glutes', 'hamstrings']) },
          { id: '9', name: 'Push-ups', category: 'push', muscle_groups: JSON.stringify(['chest', 'triceps', 'shoulders']) },
          { id: '10', name: 'Plank', category: 'core', muscle_groups: JSON.stringify(['core', 'abs']) }
        ];

        for (const exercise of defaultExercises) {
          await webDb.run(
            'INSERT OR IGNORE INTO exercises (id, name, category, muscle_groups) VALUES (?, ?, ?, ?)',
            [exercise.id, exercise.name, exercise.category, exercise.muscle_groups]
          );
        }

        setDb(webDb);
        setIsReady(true);
        console.log('Web database initialized successfully');
      } catch (error) {
        console.error('Error initializing web database:', error);
      }
    };

    if (Capacitor.isNativePlatform()) {
      initDB();
    } else {
      // For web development, use localStorage fallback
      initWebDB();
    }
  }, []);

  return { db, isReady };
};
