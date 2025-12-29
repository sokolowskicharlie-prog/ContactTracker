/*
  # Add Panel Order Preference
  
  1. Changes
    - Add `panel_order` column to `user_preferences` table
    - Stores the order of toggle panels (notes, goals, priority)
    - Default order: ['notes', 'goals', 'priority']
  
  2. Details
    - Column type: text array
    - Allows users to customize the vertical stacking order of side panels
    - Default value maintains current behavior
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'panel_order'
  ) THEN
    ALTER TABLE user_preferences 
    ADD COLUMN panel_order text[] DEFAULT ARRAY['notes', 'goals', 'priority'];
  END IF;
END $$;