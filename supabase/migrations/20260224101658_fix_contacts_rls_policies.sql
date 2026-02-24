/*
  # Fix contacts RLS policies

  1. Security Changes
    - Remove duplicate and conflicting SELECT policies
    - Remove policies referencing non-existent workspace_shares table
    - Create clean, consolidated policies for contacts access
    - Users can view contacts they own OR contacts in workspaces they're members of

  2. Important Notes
    - Fixes contact loading issues
    - Ensures proper access control through workspace membership
*/

-- Drop all existing policies on contacts
DROP POLICY IF EXISTS "Users can read own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view contacts in own or shared workspaces" ON contacts;
DROP POLICY IF EXISTS "Users can view contacts in owned or shared workspaces" ON contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in own or shared editable workspaces" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in owned or shared workspaces" ON contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;

-- Create clean, consolidated policies

CREATE POLICY "Users can view own contacts or contacts in accessible workspaces"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR (
      workspace_id IS NOT NULL 
      AND (
        EXISTS (
          SELECT 1 FROM workspaces 
          WHERE workspaces.id = contacts.workspace_id 
          AND workspaces.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM workspace_members 
          WHERE workspace_members.workspace_id = contacts.workspace_id 
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert contacts into own workspaces"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = contacts.workspace_id 
        AND workspaces.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own contacts or contacts in accessible workspaces"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR (
      workspace_id IS NOT NULL 
      AND (
        EXISTS (
          SELECT 1 FROM workspaces 
          WHERE workspaces.id = contacts.workspace_id 
          AND workspaces.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM workspace_members 
          WHERE workspace_members.workspace_id = contacts.workspace_id 
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
          WHERE workspaces.id = contacts.workspace_id 
          AND workspaces.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM workspace_members 
          WHERE workspace_members.workspace_id = contacts.workspace_id 
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete own contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);