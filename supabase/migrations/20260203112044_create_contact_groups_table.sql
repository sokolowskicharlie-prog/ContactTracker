/*
  # Create contact groups functionality

  1. New Tables
    - `contact_groups`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `workspace_id` (uuid, references workspaces)
      - `name` (text, group name)
      - `color` (text, optional color for visual distinction)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contact_group_members`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references contact_groups)
      - `contact_id` (uuid, references contacts)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Users can only manage their own groups
    - Users can only add their own contacts to groups
  
  3. Notes
    - Groups are workspace-specific
    - Many-to-many relationship allows contacts to be in multiple groups
    - Color field helps visually distinguish groups in the UI
*/

-- Create contact_groups table
CREATE TABLE IF NOT EXISTS contact_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  workspace_id uuid REFERENCES workspaces NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contact_group_members junction table
CREATE TABLE IF NOT EXISTS contact_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES contact_groups ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, contact_id)
);

-- Enable RLS
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;

-- Policies for contact_groups
CREATE POLICY "Users can view own groups"
  ON contact_groups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own groups"
  ON contact_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own groups"
  ON contact_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own groups"
  ON contact_groups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for contact_group_members
CREATE POLICY "Users can view own group members"
  ON contact_group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = contact_group_members.group_id
      AND contact_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add contacts to own groups"
  ON contact_group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = contact_group_members.group_id
      AND contact_groups.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_group_members.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove contacts from own groups"
  ON contact_group_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = contact_group_members.group_id
      AND contact_groups.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_groups_user_workspace 
  ON contact_groups(user_id, workspace_id);

CREATE INDEX IF NOT EXISTS idx_contact_group_members_group 
  ON contact_group_members(group_id);

CREATE INDEX IF NOT EXISTS idx_contact_group_members_contact 
  ON contact_group_members(contact_id);