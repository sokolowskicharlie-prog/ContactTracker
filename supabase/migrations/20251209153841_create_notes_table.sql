/*
  # Create notes table for saved notes

  1. New Tables
    - `saved_notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, note title)
      - `content` (text, note content)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `saved_notes` table
    - Add policies for authenticated users to manage their own notes
      - Users can view their own notes
      - Users can insert their own notes
      - Users can update their own notes
      - Users can delete their own notes

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on updated_at for sorting
*/

CREATE TABLE IF NOT EXISTS saved_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Note',
  content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON saved_notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON saved_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON saved_notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON saved_notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_notes_user_id ON saved_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_notes_updated_at ON saved_notes(updated_at DESC);