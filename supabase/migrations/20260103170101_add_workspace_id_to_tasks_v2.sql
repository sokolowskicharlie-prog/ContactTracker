/*
  # Add workspace isolation to tasks table

  1. Changes
    - Add `workspace_id` column to tasks table with foreign key to workspaces
    - Delete orphaned tasks (tasks without valid user_id from contacts/suppliers)
    - Set default workspace for existing tasks based on contact/supplier ownership
    - Add NOT NULL constraint after backfilling data
    - Add index on workspace_id for faster queries
    - Update RLS policies to enforce workspace isolation

  2. Security
    - Tasks are isolated per workspace
    - Users can only see tasks from workspaces they have access to
*/

-- Add workspace_id column (nullable first for data migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Delete orphaned tasks (tasks linked to contacts/suppliers without user_id)
DELETE FROM tasks t
WHERE t.workspace_id IS NULL
  AND (
    (t.contact_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM contacts c WHERE c.id = t.contact_id AND c.user_id IS NOT NULL
    ))
    OR
    (t.supplier_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM suppliers s WHERE s.id = t.supplier_id AND s.user_id IS NOT NULL
    ))
  );

-- Backfill workspace_id with default workspace for each user
DO $$
DECLARE
  task_record RECORD;
  default_workspace_id uuid;
BEGIN
  FOR task_record IN 
    SELECT DISTINCT t.id, 
      COALESCE(c.user_id, s.user_id) as owner_id
    FROM tasks t
    LEFT JOIN contacts c ON t.contact_id = c.id
    LEFT JOIN suppliers s ON t.supplier_id = s.id
    WHERE t.workspace_id IS NULL
      AND COALESCE(c.user_id, s.user_id) IS NOT NULL
  LOOP
    SELECT id INTO default_workspace_id 
    FROM workspaces 
    WHERE user_id = task_record.owner_id 
      AND is_default = true 
    LIMIT 1;
    
    IF default_workspace_id IS NOT NULL THEN
      UPDATE tasks 
      SET workspace_id = default_workspace_id 
      WHERE id = task_record.id;
    END IF;
  END LOOP;
END $$;

-- Make workspace_id NOT NULL after backfilling
ALTER TABLE tasks ALTER COLUMN workspace_id SET NOT NULL;

-- Add index for faster workspace-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;

-- Create new workspace-isolated policies
CREATE POLICY "Users can view tasks in their workspaces"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = tasks.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks in their workspaces"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = tasks.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their workspaces"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = tasks.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = tasks.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their workspaces"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = tasks.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );