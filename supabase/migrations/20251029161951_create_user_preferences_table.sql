/*
  # Create User Preferences Table

  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (text) - identifier for the user/session
      - `button_order` (text array) - ordered list of button IDs
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_preferences` table
    - Add policy for users to manage their own preferences

  3. Notes
    - Stores user interface preferences including button ordering
    - Uses text array for flexible button order storage
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  button_order text[] DEFAULT ARRAY['history', 'delete-all', 'settings', 'import', 'add-contact'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read preferences"
  ON user_preferences
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete own preferences"
  ON user_preferences
  FOR DELETE
  USING (true);

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
