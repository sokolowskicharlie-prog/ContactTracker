/*
  # Assign contacts with NULL workspace_id to user's default workspace

  1. Changes
    - Update all contacts with NULL workspace_id to their user's default workspace
    - This ensures all contacts are visible in a workspace

  2. Important Notes
    - Only updates contacts that have a valid user_id
    - Assigns to the user's default workspace (is_default = true)
    - Preserves all other contact data
*/

UPDATE contacts c
SET workspace_id = w.id
FROM workspaces w
WHERE c.workspace_id IS NULL
  AND c.user_id IS NOT NULL
  AND w.user_id = c.user_id
  AND w.is_default = true;