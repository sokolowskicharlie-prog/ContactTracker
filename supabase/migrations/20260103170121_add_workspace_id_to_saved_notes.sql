/*
  # Add workspace isolation to saved_notes table

  1. Changes
    - Add `workspace_id` column to saved_notes table with foreign key to workspaces
    - Set default workspace for existing notes based on user_id
    - Add NOT NULL constraint after backfilling data
    - Add index on workspace_id for faster queries
    - Update RLS policies to enforce workspace isolation

  2. Security
    - Notes are isolated per workspace
    - Users can only see notes from workspaces they own
*/

-- Add workspace_id column (nullable first for data migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_notes' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE saved_notes ADD COLUMN workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill workspace_id with default workspace for each user
DO $$
DECLARE
  note_record RECORD;
  default_workspace_id uuid;
BEGIN
  FOR note_record IN 
    SELECT id, user_id
    FROM saved_notes
    WHERE workspace_id IS NULL
  LOOP
    SELECT id INTO default_workspace_id 
    FROM workspaces 
    WHERE user_id = note_record.user_id 
      AND is_default = true 
    LIMIT 1;
    
    IF default_workspace_id IS NOT NULL THEN
      UPDATE saved_notes 
      SET workspace_id = default_workspace_id 
      WHERE id = note_record.id;
    END IF;
  END LOOP;
END $$;

-- Make workspace_id NOT NULL after backfilling
ALTER TABLE saved_notes ALTER COLUMN workspace_id SET NOT NULL;

-- Add index for faster workspace-based queries
CREATE INDEX IF NOT EXISTS idx_saved_notes_workspace_id ON saved_notes(workspace_id);

-- Drop the old user-based policies
DROP POLICY IF EXISTS "Users can view own notes" ON saved_notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON saved_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON saved_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON saved_notes;

-- Create new workspace-isolated policies
CREATE POLICY "Users can view notes in their workspaces"
  ON saved_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = saved_notes.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notes in their workspaces"
  ON saved_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = saved_notes.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes in their workspaces"
  ON saved_notes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = saved_notes.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = saved_notes.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes in their workspaces"
  ON saved_notes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = saved_notes.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );