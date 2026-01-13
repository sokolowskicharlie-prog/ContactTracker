/*
  # Create meetings/appointments table

  1. New Tables
    - `meetings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text) - meeting/appointment title
      - `description` (text, nullable) - additional details
      - `date` (date) - date of the meeting
      - `start_time` (time) - start time of the meeting
      - `end_time` (time, nullable) - end time of the meeting
      - `location` (text, nullable) - meeting location/link
      - `contact_id` (uuid, nullable) - related contact if applicable
      - `supplier_id` (uuid, nullable) - related supplier if applicable
      - `reminder_minutes` (integer, nullable) - minutes before meeting to remind (e.g., 15, 30, 60)
      - `is_completed` (boolean) - whether meeting is completed
      - `completed_at` (timestamptz, nullable) - when meeting was completed
      - `created_at` (timestamptz) - timestamp when meeting was created
      - `updated_at` (timestamptz) - timestamp when meeting was updated

  2. Security
    - Enable RLS on `meetings` table
    - Users can only view, create, update, and delete their own meetings
*/

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  location text,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  reminder_minutes integer,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS meetings_user_id_idx ON meetings(user_id);
CREATE INDEX IF NOT EXISTS meetings_date_idx ON meetings(date);
CREATE INDEX IF NOT EXISTS meetings_contact_id_idx ON meetings(contact_id);
CREATE INDEX IF NOT EXISTS meetings_supplier_id_idx ON meetings(supplier_id);
