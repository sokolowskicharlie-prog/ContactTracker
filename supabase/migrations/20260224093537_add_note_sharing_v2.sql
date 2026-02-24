/*
  # Add note sharing functionality

  1. New Tables
    - `note_shares`
      - `id` (uuid, primary key)
      - `note_id` (uuid, foreign key to saved_notes)
      - `shared_by` (uuid, foreign key to auth.users)
      - `shared_with` (uuid, foreign key to auth.users)
      - `can_edit` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `note_shares` table
    - Add policies for users to:
      - View shares they created or received
      - Create shares for their own notes
      - Delete shares they created
    - Update `saved_notes` policies to allow viewing shared notes

  3. Indexes
    - Add index on note_id for faster queries
    - Add index on shared_with for faster queries
    - Add composite unique index to prevent duplicate shares
*/

CREATE TABLE IF NOT EXISTS note_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES saved_notes(id) ON DELETE CASCADE NOT NULL,
  shared_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  can_edit boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(note_id, shared_with)
);

ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares they created or received"
  ON note_shares
  FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "Users can create shares for their own notes"
  ON note_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = shared_by AND
    EXISTS (
      SELECT 1 FROM saved_notes
      WHERE id = note_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares they created"
  ON note_shares
  FOR DELETE
  TO authenticated
  USING (auth.uid() = shared_by);

DROP POLICY IF EXISTS "Users can view shared notes" ON saved_notes;

CREATE POLICY "Users can view own or shared notes"
  ON saved_notes
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM note_shares
      WHERE note_id = saved_notes.id
      AND shared_with = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update shared notes with edit permission" ON saved_notes;

CREATE POLICY "Users can update own notes or shared with edit permission"
  ON saved_notes
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM note_shares
      WHERE note_id = saved_notes.id
      AND shared_with = auth.uid()
      AND can_edit = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM note_shares
      WHERE note_id = saved_notes.id
      AND shared_with = auth.uid()
      AND can_edit = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with ON note_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_by ON note_shares(shared_by);