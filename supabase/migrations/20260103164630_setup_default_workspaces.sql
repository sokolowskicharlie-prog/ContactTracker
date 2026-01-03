/*
  # Setup Default Workspaces

  1. Changes
    - Creates three workspaces for each user:
      - "Work" (default) - contains all existing contacts
      - "Personal" - empty
      - "Architect Project" - empty
    - Assigns all existing contacts to the "Work" workspace
    - Ensures only one workspace is marked as default per user

  2. Notes
    - Existing contacts will be moved to the "Work" workspace
    - New empty workspaces will be created for future use
    - This migration is idempotent and safe to run multiple times
*/

-- Function to setup workspaces for a user
CREATE OR REPLACE FUNCTION setup_user_workspaces()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  work_workspace_id uuid;
  personal_workspace_id uuid;
  architect_workspace_id uuid;
BEGIN
  -- Loop through all users who have contacts
  FOR user_record IN 
    SELECT DISTINCT user_id FROM contacts WHERE user_id IS NOT NULL
  LOOP
    -- Delete any existing workspaces for this user to start fresh
    DELETE FROM workspaces WHERE user_id = user_record.user_id;
    
    -- Create "Work" workspace (default)
    INSERT INTO workspaces (user_id, name, color, is_default, display_order)
    VALUES (user_record.user_id, 'Work', '#3B82F6', true, 0)
    RETURNING id INTO work_workspace_id;
    
    -- Create "Personal" workspace
    INSERT INTO workspaces (user_id, name, color, is_default, display_order)
    VALUES (user_record.user_id, 'Personal', '#10B981', false, 1)
    RETURNING id INTO personal_workspace_id;
    
    -- Create "Architect Project" workspace
    INSERT INTO workspaces (user_id, name, color, is_default, display_order)
    VALUES (user_record.user_id, 'Architect Project', '#F59E0B', false, 2)
    RETURNING id INTO architect_workspace_id;
    
    -- Assign all existing contacts to the "Work" workspace
    UPDATE contacts 
    SET workspace_id = work_workspace_id 
    WHERE user_id = user_record.user_id;
    
    -- Assign all existing suppliers to the "Work" workspace
    UPDATE suppliers 
    SET workspace_id = work_workspace_id 
    WHERE user_id = user_record.user_id;
    
  END LOOP;
END;
$$;

-- Execute the function
SELECT setup_user_workspaces();

-- Clean up the function
DROP FUNCTION setup_user_workspaces();
