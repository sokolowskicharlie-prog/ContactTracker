/*
  # Fix contacts DELETE policy to allow workspace contact deletion

  ## Problem
  The DELETE policy for contacts only allowed deleting contacts where `user_id = auth.uid()`.
  This prevented bulk deletion of workspace contacts, even though users could update them.

  ## Changes
  - Drop the restrictive DELETE policy
  - Create a new DELETE policy that matches the UPDATE policy logic
  - Allow deletion of own contacts OR workspace contacts that the user owns
*/

-- Drop the old restrictive delete policy
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;

-- Create new delete policy matching update policy logic
CREATE POLICY "Users can delete own contacts or workspace contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() = user_id) 
    OR (workspace_id IS NULL) 
    OR (EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = contacts.workspace_id 
      AND workspaces.user_id = auth.uid()
    ))
  );
