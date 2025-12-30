/*
  # Add alerts button to user preferences

  1. Changes
    - Update default button_order to include 'alerts'
    - Update default button_visibility to include 'alerts': true
    - Update existing user preferences to include alerts in their button visibility

  2. Details
    - Alerts button allows users to configure notification settings
    - Uses amber color scheme to match alert/notification theme
    - Added to end of default button order for non-intrusive placement
*/

-- Update the default for button_order to include 'alerts'
ALTER TABLE user_preferences 
ALTER COLUMN button_order 
SET DEFAULT ARRAY['history', 'delete-all', 'settings', 'import', 'add-contact', 'alerts'];

-- Update the default for button_visibility to include 'alerts'
ALTER TABLE user_preferences 
ALTER COLUMN button_visibility 
SET DEFAULT '{
  "export": true,
  "import": true,
  "history": true,
  "settings": true,
  "delete-all": true,
  "add-contact": true,
  "copy-emails": true,
  "duplicates": true,
  "bulk-search": true,
  "alerts": true
}'::jsonb;

-- Update existing users' button_visibility to include alerts if not already present
UPDATE user_preferences
SET button_visibility = button_visibility || '{"alerts": true}'::jsonb
WHERE NOT (button_visibility ? 'alerts');