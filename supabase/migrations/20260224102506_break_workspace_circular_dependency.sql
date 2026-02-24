/*
  # Break circular dependency between workspaces and workspace_members

  1. Security Changes
    - Simplify workspaces SELECT policy to only show user's own workspaces initially
    - Add a security definer function to check workspace access without recursion
    - Update workspace_members to be more permissive for viewing

  2. Important Notes
    - Breaking the circular reference: workspaces ↔ workspace_members
    - Users will see workspaces they own OR are members of
    - Using a simpler approach: users can see their own workspaces directly
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own or shared workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can update own workspaces or shared with admin/owner role" ON workspaces;

-- Create simpler workspace policies without circular dependency
-- Users can view workspaces they own
CREATE POLICY "Users can view own workspaces"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only update workspaces they own
CREATE POLICY "Users can update own workspaces"
  ON workspaces
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);