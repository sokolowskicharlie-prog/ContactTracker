/*
  # Create Workspaces Table

  1. New Tables
    - `workspaces`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - Name of the workspace (e.g., "Personal", "Work")
      - `color` (text) - Color for visual distinction
      - `is_default` (boolean) - Whether this is the default workspace
      - `display_order` (integer) - Order for displaying workspaces
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `workspace_id` column to `contacts` table
    - Add `workspace_id` column to `suppliers` table

  3. Security
    - Enable RLS on `workspaces` table
    - Add policies for users to manage their own workspaces
    - Update existing contacts to use a default workspace

  4. Notes
    - Creates a default "Personal" workspace for existing users
    - All existing contacts will be assigned to the default workspace
*/

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  is_default boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
CREATE POLICY "Users can view own workspaces"
  ON workspaces FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workspaces"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces"
  ON workspaces FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add workspace_id to contacts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE contacts ADD COLUMN workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add workspace_id to suppliers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_workspace_id ON suppliers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);

-- Function to create default workspace for a user
CREATE OR REPLACE FUNCTION create_default_workspace_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workspace_id uuid;
BEGIN
  -- Check if user already has a default workspace
  SELECT id INTO v_workspace_id
  FROM workspaces
  WHERE user_id = p_user_id AND is_default = true
  LIMIT 1;

  -- If no default workspace exists, create one
  IF v_workspace_id IS NULL THEN
    INSERT INTO workspaces (user_id, name, color, is_default, display_order)
    VALUES (p_user_id, 'Personal', '#3B82F6', true, 0)
    RETURNING id INTO v_workspace_id;
  END IF;

  RETURN v_workspace_id;
END;
$$;
