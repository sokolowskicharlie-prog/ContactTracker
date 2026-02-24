/*
  # Add UPDATE policy for note_shares

  1. Security
    - Allow users who created the share to update permissions (can_edit flag)
    - This enables toggling edit permissions for shared notes
*/

CREATE POLICY "Users can update shares they created"
  ON note_shares
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);
