/*
  # Create workspace sharing tables

  1. New Tables
    - `workspace_members`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, foreign key to workspaces)
      - `user_id` (uuid, foreign key to auth.users) - user who has access
      - `added_by` (uuid, foreign key to auth.users) - user who added this member
      - `role` (text) - 'owner', 'admin', or 'member'
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on workspace_members table
    - Users can view members of workspaces they have access to
    - Workspace owners and admins can add/remove members
    - Update workspace policies to allow viewing/editing shared workspaces
    - Update related tables (contacts, suppliers, tasks, notes) to allow access to shared workspace data

  3. Indexes
    - Add indexes on workspace_id and user_id for faster lookups

  4. Important Notes
    - Workspace owners have full control over the workspace
    - Admins can add/remove members but cannot delete the workspace
    - Members can view and edit workspace content
    - When a workspace is shared, all its contacts, suppliers, tasks, and notes become accessible
*/

CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_workspace_member UNIQUE (workspace_id, user_id)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace members if they have access"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners and admins can add members"
  ON workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_members.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace owners and admins can remove members"
  ON workspace_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace owners and admins can update member roles"
  ON workspace_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can update own or shared editable workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can delete own workspaces" ON workspaces;

CREATE POLICY "Users can update own workspaces or shared with admin/owner role"
  ON workspaces
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Only workspace owners can delete workspaces"
  ON workspaces
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view contacts in their workspaces" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in their workspaces" ON contacts;

CREATE POLICY "Users can view contacts in owned or shared workspaces"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = contacts.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = contacts.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can update contacts in owned or shared workspaces"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = contacts.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = contacts.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    ))
  )
  WITH CHECK (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = contacts.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = contacts.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    ))
  );

DROP POLICY IF EXISTS "Users can view suppliers in their workspaces" ON suppliers;
DROP POLICY IF EXISTS "Users can update suppliers in their workspaces" ON suppliers;

CREATE POLICY "Users can view suppliers in owned or shared workspaces"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = suppliers.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = suppliers.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can update suppliers in owned or shared workspaces"
  ON suppliers
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = suppliers.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = suppliers.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    ))
  )
  WITH CHECK (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = suppliers.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = suppliers.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    ))
  );

DROP POLICY IF EXISTS "Users can view tasks in workspaces they have access to" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in workspaces they have access to" ON tasks;

CREATE POLICY "Users can view tasks in workspaces they have access to"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = tasks.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = tasks.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )) OR
    EXISTS (
      SELECT 1 FROM task_shares
      WHERE task_shares.task_id = tasks.id
      AND task_shares.shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in workspaces they have access to"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = tasks.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = tasks.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )) OR
    EXISTS (
      SELECT 1 FROM task_shares
      WHERE task_shares.task_id = tasks.id
      AND task_shares.shared_with = auth.uid()
      AND task_shares.permission = 'edit'
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = tasks.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = tasks.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )) OR
    EXISTS (
      SELECT 1 FROM task_shares
      WHERE task_shares.task_id = tasks.id
      AND task_shares.shared_with = auth.uid()
      AND task_shares.permission = 'edit'
    )
  );

DROP POLICY IF EXISTS "Users can view notes in workspaces they have access to" ON saved_notes;
DROP POLICY IF EXISTS "Users can update notes in workspaces they have access to" ON saved_notes;

CREATE POLICY "Users can view notes in workspaces they have access to"
  ON saved_notes
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = saved_notes.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = saved_notes.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )) OR
    EXISTS (
      SELECT 1 FROM note_shares
      WHERE note_shares.note_id = saved_notes.id
      AND note_shares.shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can update notes in workspaces they have access to"
  ON saved_notes
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = saved_notes.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = saved_notes.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )) OR
    EXISTS (
      SELECT 1 FROM note_shares
      WHERE note_shares.note_id = saved_notes.id
      AND note_shares.shared_with = auth.uid()
      AND note_shares.can_edit = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    (workspace_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = saved_notes.workspace_id
        AND workspaces.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = saved_notes.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )) OR
    EXISTS (
      SELECT 1 FROM note_shares
      WHERE note_shares.note_id = saved_notes.id
      AND note_shares.shared_with = auth.uid()
      AND note_shares.can_edit = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);

CREATE OR REPLACE FUNCTION add_workspace_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspace_members (workspace_id, user_id, added_by, role)
  VALUES (NEW.id, NEW.user_id, NEW.user_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_add_workspace_owner ON workspaces;
CREATE TRIGGER trigger_add_workspace_owner
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION add_workspace_owner_as_member();