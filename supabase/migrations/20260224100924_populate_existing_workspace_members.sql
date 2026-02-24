/*
  # Populate workspace members for existing workspaces

  1. Changes
    - Add workspace owner as member with 'owner' role for all existing workspaces
    - This ensures that all workspace owners appear in the workspace_members table

  2. Important Notes
    - Uses INSERT ... ON CONFLICT DO NOTHING to avoid duplicate entries
    - All existing workspace owners will be added as members
*/

INSERT INTO workspace_members (workspace_id, user_id, added_by, role)
SELECT 
  id as workspace_id,
  user_id,
  user_id as added_by,
  'owner' as role
FROM workspaces
WHERE NOT EXISTS (
  SELECT 1 FROM workspace_members 
  WHERE workspace_members.workspace_id = workspaces.id 
  AND workspace_members.user_id = workspaces.user_id
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;