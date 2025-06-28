
import { useState, useEffect } from 'react';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export const useDatabase = () => {
  const [db, setDb] = useState<SQLiteDBConnection | null>(null);
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
            notes TEXT
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

    if (Capacitor.isNativePlatform()) {
      initDB();
    } else {
      // For web development, we'll use a mock database
      setIsReady(true);
      console.log('Running in web mode - using mock database');
    }
  }, []);

  return { db, isReady };
};
