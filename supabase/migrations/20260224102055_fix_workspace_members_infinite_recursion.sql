/*
  # Fix infinite recursion in workspace_members RLS policies

  1. Security Changes
    - Fix SELECT policy to avoid infinite recursion
    - Fix INSERT policy logic and remove infinite recursion
    - Fix UPDATE and DELETE policies to avoid infinite recursion
    - Users can see their own memberships directly
    - Workspace owners can see all members through workspaces table

  2. Important Notes
    - The old policies created infinite recursion by checking workspace_members while querying workspace_members
    - New policies check workspaces table instead to break the recursion cycle
*/

-- Drop existing policies on workspace_members
DROP POLICY IF EXISTS "Users can view workspace members if they have access" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can add members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can update member roles" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can remove members" ON workspace_members;

-- Create fixed policies without infinite recursion

-- Users can see their own memberships OR memberships in workspaces they own
CREATE POLICY "Users can view own memberships or memberships in owned workspaces"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

-- Only workspace owners can add members
CREATE POLICY "Workspace owners can add members"
  ON workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

-- Only workspace owners can update member roles
CREATE POLICY "Workspace owners can update member roles"
  ON workspace_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

-- Only workspace owners can remove members
CREATE POLICY "Workspace owners can remove members"
  ON workspace_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );