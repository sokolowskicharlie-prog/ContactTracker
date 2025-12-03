/*
  # Create Call Schedules Table

  1. New Tables
    - `call_schedules`
      - `id` (uuid, primary key)
      - `goal_id` (uuid, foreign key to daily_goals)
      - `scheduled_time` (timestamptz) - GMT time for the call
      - `contact_id` (uuid, foreign key to contacts, nullable)
      - `contact_name` (text) - Name of company/contact (for suggested ones)
      - `priority_label` (text) - Warm, Follow-Up, High Value, Cold
      - `is_suggested` (boolean) - Whether this was auto-suggested
      - `completed` (boolean) - Whether call was made
      - `completed_at` (timestamptz, nullable)
      - `call_duration_mins` (integer) - Expected duration
      - `timezone_label` (text) - For display (e.g., "Singapore", "UK")
      - `notes` (text, nullable)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `call_schedules` table
    - Add policies for authenticated users to manage their own schedules
    
  3. Indexes
    - Index on goal_id for fast schedule retrieval
    - Index on scheduled_time for time-ordered queries
*/

CREATE TABLE IF NOT EXISTS call_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES daily_goals(id) ON DELETE CASCADE NOT NULL,
  scheduled_time timestamptz NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  priority_label text NOT NULL CHECK (priority_label IN ('Warm', 'Follow-Up', 'High Value', 'Cold')),
  is_suggested boolean DEFAULT false,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  call_duration_mins integer DEFAULT 20,
  timezone_label text,
  notes text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE call_schedules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own call schedules"
  ON call_schedules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own call schedules"
  ON call_schedules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own call schedules"
  ON call_schedules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own call schedules"
  ON call_schedules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_schedules_goal_id ON call_schedules(goal_id);
CREATE INDEX IF NOT EXISTS idx_call_schedules_scheduled_time ON call_schedules(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_call_schedules_user_id ON call_schedules(user_id);
