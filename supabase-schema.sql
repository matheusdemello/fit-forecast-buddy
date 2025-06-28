-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create exercises table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('push', 'pull', 'legs', 'core')),
    muscle_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT exercises_name_unique UNIQUE (name)
);

-- Create workouts table
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- For future multi-user support
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- Duration in minutes
    notes TEXT,
    overall_fatigue INTEGER CHECK (overall_fatigue >= 1 AND overall_fatigue <= 5),
    overall_soreness INTEGER CHECK (overall_soreness >= 1 AND overall_soreness <= 5),
    session_rating INTEGER CHECK (session_rating >= 1 AND session_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_sets table
CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    reps INTEGER NOT NULL CHECK (reps > 0),
    weight DECIMAL(6,2) NOT NULL CHECK (weight >= 0), -- Support up to 9999.99
    rest_time INTEGER, -- Rest time in seconds
    notes TEXT,
    rir INTEGER CHECK (rir >= 0 AND rir <= 10), -- Reps in Reserve (0-10)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RP progression state table
CREATE TABLE rp_progression_state (
    exercise_id UUID PRIMARY KEY REFERENCES exercises(id) ON DELETE CASCADE,
    current_mesocycle_week INTEGER NOT NULL DEFAULT 1 CHECK (current_mesocycle_week > 0),
    previous_sets INTEGER NOT NULL DEFAULT 3 CHECK (previous_sets > 0),
    previous_weight DECIMAL(6,2) NOT NULL DEFAULT 0 CHECK (previous_weight >= 0),
    previous_rir_avg DECIMAL(3,2) NOT NULL DEFAULT 3 CHECK (previous_rir_avg >= 0),
    rolling_fatigue_score DECIMAL(3,2) NOT NULL DEFAULT 2 CHECK (rolling_fatigue_score >= 0),
    consecutive_weeks_progressing INTEGER NOT NULL DEFAULT 0 CHECK (consecutive_weeks_progressing >= 0),
    last_deload_date TIMESTAMP WITH TIME ZONE,
    volume_landmark TEXT NOT NULL DEFAULT 'MEV' CHECK (volume_landmark IN ('MEV', 'MAV', 'MRV')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mesocycle settings table
CREATE TABLE mesocycle_settings (
    exercise_id UUID PRIMARY KEY REFERENCES exercises(id) ON DELETE CASCADE,
    mev_sets INTEGER NOT NULL DEFAULT 3 CHECK (mev_sets > 0),
    mav_sets INTEGER NOT NULL DEFAULT 6 CHECK (mav_sets > 0),
    mrv_sets INTEGER NOT NULL DEFAULT 10 CHECK (mrv_sets > 0),
    deload_frequency_weeks INTEGER NOT NULL DEFAULT 4 CHECK (deload_frequency_weeks > 0),
    target_rir_min INTEGER NOT NULL DEFAULT 1 CHECK (target_rir_min >= 0),
    target_rir_max INTEGER NOT NULL DEFAULT 3 CHECK (target_rir_max >= 0),
    weight_increment DECIMAL(4,2) NOT NULL DEFAULT 2.5 CHECK (weight_increment > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints to ensure logical values
    CONSTRAINT mesocycle_settings_volume_order CHECK (mev_sets <= mav_sets AND mav_sets <= mrv_sets),
    CONSTRAINT mesocycle_settings_rir_order CHECK (target_rir_min <= target_rir_max)
);

-- Create workout exercise data table
CREATE TABLE workout_exercise_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    pump_rating INTEGER CHECK (pump_rating >= 1 AND pump_rating <= 5),
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination
    CONSTRAINT workout_exercise_data_unique UNIQUE (workout_id, exercise_id)
);

-- Create offline sync queue table for handling offline operations
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_type TEXT NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    table_name TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workout_sets_workout_id ON workout_sets(workout_id);
CREATE INDEX idx_workout_sets_exercise_id ON workout_sets(exercise_id);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);
CREATE INDEX idx_sync_queue_synced_at ON sync_queue(synced_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_sets_updated_at BEFORE UPDATE ON workout_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rp_progression_state_updated_at BEFORE UPDATE ON rp_progression_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mesocycle_settings_updated_at BEFORE UPDATE ON mesocycle_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_exercise_data_updated_at BEFORE UPDATE ON workout_exercise_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default exercises
INSERT INTO exercises (id, name, category, muscle_groups) VALUES
    ('1', 'Bench Press', 'push', '["chest", "triceps", "shoulders"]'::jsonb),
    ('2', 'Squat', 'legs', '["quadriceps", "glutes", "hamstrings"]'::jsonb),
    ('3', 'Deadlift', 'pull', '["hamstrings", "glutes", "back"]'::jsonb),
    ('4', 'Pull-ups', 'pull', '["lats", "biceps", "rhomboids"]'::jsonb),
    ('5', 'Overhead Press', 'push', '["shoulders", "triceps", "core"]'::jsonb),
    ('6', 'Barbell Row', 'pull', '["lats", "rhomboids", "biceps"]'::jsonb),
    ('7', 'Dips', 'push', '["triceps", "chest", "shoulders"]'::jsonb),
    ('8', 'Lunges', 'legs', '["quadriceps", "glutes", "hamstrings"]'::jsonb),
    ('9', 'Push-ups', 'push', '["chest", "triceps", "shoulders"]'::jsonb),
    ('10', 'Plank', 'core', '["core", "abs"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS) for multi-user support
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercise_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Create basic policies (can be extended later for user authentication)
CREATE POLICY "Allow all operations for now" ON workouts FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON workout_sets FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON workout_exercise_data FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON sync_queue FOR ALL USING (true);

-- Create views for common queries
CREATE VIEW workout_summary AS
SELECT 
    w.id,
    w.date,
    w.duration,
    w.notes,
    w.overall_fatigue,
    w.overall_soreness,
    w.session_rating,
    COUNT(DISTINCT ws.exercise_id) as exercise_count,
    COUNT(ws.id) as total_sets,
    SUM(ws.weight * ws.reps) as total_volume
FROM workouts w
LEFT JOIN workout_sets ws ON w.id = ws.workout_id
GROUP BY w.id, w.date, w.duration, w.notes, w.overall_fatigue, w.overall_soreness, w.session_rating;

CREATE VIEW exercise_stats AS
SELECT 
    e.id,
    e.name,
    e.category,
    e.muscle_groups,
    COUNT(DISTINCT ws.workout_id) as workout_count,
    COUNT(ws.id) as total_sets,
    MAX(ws.weight) as max_weight,
    AVG(ws.weight) as avg_weight,
    MAX(ws.reps) as max_reps,
    AVG(ws.reps) as avg_reps
FROM exercises e
LEFT JOIN workout_sets ws ON e.id = ws.exercise_id
GROUP BY e.id, e.name, e.category, e.muscle_groups; 