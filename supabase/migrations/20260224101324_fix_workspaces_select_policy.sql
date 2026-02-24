/*
  # Fix workspaces SELECT policy to use workspace_members

  1. Security Changes
    - Drop old policy that references non-existent workspace_shares table
    - Create new policy that checks workspace_members table instead
    - Users can view workspaces they own or are members of

  2. Important Notes
    - Fixes workspace loading issues
    - Aligns with the workspace_members table structure
*/

DROP POLICY IF EXISTS "Users can view own or shared workspaces" ON workspaces;

CREATE POLICY "Users can view own or shared workspaces"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 
      FROM workspace_members 
      WHERE workspace_members.workspace_id = workspaces.id 
      AND workspace_members.user_id = auth.uid()
    )
  );