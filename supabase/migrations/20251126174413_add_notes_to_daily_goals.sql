/*
  # Add Notes to Daily Goals

  1. Changes
    - Add `notes` column to `daily_goals` table
      - Allows users to add personal notes or context to their daily goals
      - Optional text field
      - Can be used for tracking strategies, reflections, or reminders
    
  2. Notes
    - Notes field is completely optional
    - Users can add, edit, or remove notes at any time
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_goals' AND column_name = 'notes'
  ) THEN
    ALTER TABLE daily_goals ADD COLUMN notes text;
  END IF;
END $$;