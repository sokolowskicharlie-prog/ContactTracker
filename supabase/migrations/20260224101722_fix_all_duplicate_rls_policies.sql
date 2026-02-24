/*
  # Fix duplicate RLS policies on suppliers, tasks, and saved_notes

  1. Security Changes
    - Remove duplicate SELECT and UPDATE policies on suppliers
    - Remove duplicate policies on tasks and saved_notes
    - Remove policies referencing non-existent workspace_shares table
    - Create clean, consolidated policies using workspace_members table

  2. Important Notes
    - Fixes data loading issues across all workspace-aware tables
    - Ensures consistent access control through workspace membership
*/

-- Fix suppliers table policies
DROP POLICY IF EXISTS "Users can read own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can view suppliers in own or shared workspaces" ON suppliers;
DROP POLICY IF EXISTS "Users can view suppliers in owned or shared workspaces" ON suppliers;
DROP POLICY IF EXISTS "Users can update own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update suppliers in own or shared editable workspaces" ON suppliers;
DROP POLICY IF EXISTS "Users can update suppliers in owned or shared workspaces" ON suppliers;

CREATE POLICY "Users can view own suppliers or suppliers in accessible workspaces"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR (
      workspace_id IS NOT NULL 
      AND (
        EXISTS (
          SELECT 1 FROM workspaces 
          WHERE workspaces.id = suppliers.workspace_id 
          AND workspaces.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM workspace_members 
          WHERE workspace_members.workspace_id = suppliers.workspace_id 
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update own suppliers or suppliers in accessible workspaces"
  ON suppliers
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR (
      workspace_id IS NOT NULL 
      AND (
        EXISTS (
          SELECT 1 FROM workspaces 
          WHERE workspaces.id = suppliers.workspace_id 
          AND workspaces.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM workspace_members 
          WHERE workspace_members.workspace_id = suppliers.workspace_id 
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (
      workspace_id IS NOT NULL 
      AND (
        EXISTS (
          SELECT 1 FROM workspaces 
          WHERE workspaces.id = suppliers.workspace_id 
          AND workspaces.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM workspace_members 
          WHERE workspace_members.workspace_id = suppliers.workspace_id 
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

-- Fix tasks table policies
DROP POLICY IF EXISTS "Users can view own or shared tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks in workspaces they have access to" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their workspaces" ON tasks;
DROP POLICY IF EXISTS "Users can update own or shared editable tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in workspaces they have access to" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their workspaces" ON tasks;

CREATE POLICY "Users can view tasks in accessible workspaces"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IS NOT NULL 
    AND (
      EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = tasks.workspace_id 
        AND workspaces.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_members.workspace_id = tasks.workspace_id 
        AND workspace_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert tasks in accessible workspaces"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL 
    AND (
      EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = tasks.workspace_id 
        AND workspaces.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_members.workspace_id = tasks.workspace_id 
        AND workspace_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update tasks in accessible workspaces"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IS NOT NULL 
    AND (
      EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = tasks.workspace_id 
        AND workspaces.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_members.workspace_id = tasks.workspace_id 
        AND workspace_members.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    workspace_id IS NOT NULL 
    AND (
      EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = tasks.workspace_id 
        AND workspaces.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_members.workspace_id = tasks.workspace_id 
        AND workspace_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete tasks in accessible workspaces"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    workspace_id IS NOT NULL 
    AND (
      EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = tasks.workspace_id 
        AND workspaces.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_members.workspace_id = tasks.workspace_id 
        AND workspace_members.user_id = auth.uid()
      )
    )
  );

-- Fix saved_notes table policies
DROP POLICY IF EXISTS "Users can view own or shared notes" ON saved_notes;
DROP POLICY IF EXISTS "Users can view notes in workspaces they have access to" ON saved_notes;
DROP POLICY IF EXISTS "Users can update own notes or shared with edit permission" ON saved_notes;
DROP POLICY IF EXISTS "Users can update notes in workspaces they have access to" ON saved_notes;

CREATE POLICY "Users can view notes in accessible workspaces"
  ON saved_notes
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IS NOT NULL 
    AND (
      EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = saved_notes.workspace_id 
        AND workspaces.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_members.workspace_id = saved_notes.workspace_id 
        AND workspace_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update notes in accessible workspaces"
  ON saved_notes
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IS NOT NULL 
    AND (
      EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = saved_notes.workspace_id 
        AND workspaces.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_members.workspace_id = saved_notes.workspace_id 
        AND workspace_members.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    workspace_id IS NOT NULL 
    AND (
      EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = saved_notes.workspace_id 
        AND workspaces.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_members.workspace_id = saved_notes.workspace_id 
        AND workspace_members.user_id = auth.uid()
      )
    )
  );