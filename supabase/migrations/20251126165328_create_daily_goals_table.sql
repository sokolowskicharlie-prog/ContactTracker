/*
  # Create Daily Goals and Notifications Tables

  1. New Tables
    - `daily_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `goal_type` (text - 'calls', 'emails', 'deals')
      - `target_amount` (integer - number to complete)
      - `target_time` (time - time of day to complete by)
      - `is_active` (boolean - whether goal is currently active)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `goal_notification_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `notification_frequency` (integer - minutes between notifications)
      - `enable_notifications` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own goals
*/

CREATE TABLE IF NOT EXISTS daily_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type text NOT NULL CHECK (goal_type IN ('calls', 'emails', 'deals')),
  target_amount integer NOT NULL CHECK (target_amount > 0),
  target_time time NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS goal_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  notification_frequency integer DEFAULT 30 NOT NULL CHECK (notification_frequency > 0),
  enable_notifications boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON daily_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON daily_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON daily_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON daily_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification settings"
  ON goal_notification_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON goal_notification_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON goal_notification_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_goals_user_id ON daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_goals_active ON daily_goals(user_id, is_active) WHERE is_active = true;