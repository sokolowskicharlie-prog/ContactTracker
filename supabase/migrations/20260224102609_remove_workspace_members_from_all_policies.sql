/*
  # Remove workspace_members references from all table policies

  1. Security Changes
    - Remove workspace_members checks from suppliers policies
    - Remove workspace_members checks from tasks policies
    - Remove workspace_members checks from saved_notes policies
    - All tables now only check workspaces table for access control
    
  2. Important Notes
    - Eliminates all circular dependencies in RLS policies
    - Users can access data in workspaces they own
    - Shared workspace support will be added later with proper architecture
*/

-- Fix suppliers policies
DROP POLICY IF EXISTS "Users can view own suppliers or suppliers in accessible workspa" ON suppliers;
DROP POLICY IF EXISTS "Users can update own suppliers or suppliers in accessible works" ON suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers into accessible workspaces" ON suppliers;

CREATE POLICY "Users can view own suppliers or workspace suppliers"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = suppliers.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own suppliers or workspace suppliers"
  ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = suppliers.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own suppliers or workspace suppliers"
  ON suppliers
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = suppliers.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = suppliers.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

-- Fix tasks policies
DROP POLICY IF EXISTS "Users can view tasks in accessible workspaces" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in accessible workspaces" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks in accessible workspaces" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks into accessible workspaces" ON tasks;

CREATE POLICY "Users can view tasks in own workspaces"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = tasks.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks into own workspaces"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = tasks.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in own workspaces"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = tasks.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = tasks.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in own workspaces"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = tasks.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

-- Fix saved_notes policies
DROP POLICY IF EXISTS "Users can view notes in accessible workspaces" ON saved_notes;
DROP POLICY IF EXISTS "Users can update notes in accessible workspaces" ON saved_notes;
DROP POLICY IF EXISTS "Users can insert notes into accessible workspaces" ON saved_notes;
DROP POLICY IF EXISTS "Users can delete notes in accessible workspaces" ON saved_notes;

CREATE POLICY "Users can view notes in own workspaces"
  ON saved_notes
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = saved_notes.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notes into own workspaces"
  ON saved_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = saved_notes.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes in own workspaces"
  ON saved_notes
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = saved_notes.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = saved_notes.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes in own workspaces"
  ON saved_notes
  FOR DELETE
  TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = saved_notes.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );