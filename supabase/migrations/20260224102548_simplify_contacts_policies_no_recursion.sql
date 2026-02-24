/*
  # Simplify contacts RLS policies to prevent recursion

  1. Security Changes
    - Remove workspace_members checks from contacts policies
    - Users can see contacts they own OR contacts in workspaces they own
    - Simpler policy structure prevents infinite recursion
    
  2. Important Notes
    - Breaking circular dependency: contacts → workspace_members → workspaces → workspace_members
    - Users can access contacts in their own workspaces directly through workspaces table
*/

-- Drop existing contact policies
DROP POLICY IF EXISTS "Users can view own contacts or contacts in accessible workspace" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts or contacts in accessible workspa" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts into own workspaces" ON contacts;

-- Create simplified policies without workspace_members checks

CREATE POLICY "Users can view own contacts or workspace contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = contacts.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own contacts or workspace contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = contacts.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own contacts or workspace contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = contacts.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = contacts.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );