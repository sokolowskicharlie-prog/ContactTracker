/*
  # Create holidays table

  1. New Tables
    - `holidays`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - null for public holidays, set for personal holidays
      - `name` (text) - name of the holiday
      - `date` (date) - date of the holiday
      - `is_public` (boolean) - true for public holidays, false for personal
      - `country` (text) - country code for public holidays (e.g., 'GB', 'US')
      - `description` (text, nullable) - additional details
      - `created_at` (timestamptz) - timestamp when holiday was created

  2. Security
    - Enable RLS on `holidays` table
    - Public holidays (is_public = true) are visible to all authenticated users
    - Personal holidays are only visible to the user who created them
    - Users can insert their own personal holidays
    - Users can update/delete their own personal holidays
*/

CREATE TABLE IF NOT EXISTS holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  is_public boolean DEFAULT false,
  country text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public holidays"
  ON holidays FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can view own personal holidays"
  ON holidays FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_public = false);

CREATE POLICY "Users can insert personal holidays"
  ON holidays FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_public = false);

CREATE POLICY "Users can update own personal holidays"
  ON holidays FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND is_public = false)
  WITH CHECK (user_id = auth.uid() AND is_public = false);

CREATE POLICY "Users can delete own personal holidays"
  ON holidays FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND is_public = false);

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS holidays_date_idx ON holidays(date);
CREATE INDEX IF NOT EXISTS holidays_user_id_idx ON holidays(user_id);
