/*
  # Add Unique Constraint to user_preferences.user_id

  1. Changes
    - Remove any orphaned preferences records with NULL user_id (from before auth was implemented)
    - Remove any duplicate records (keep the most recent per user)
    - Add UNIQUE constraint to `user_id` column in `user_preferences` table
    - Set user_id to NOT NULL since it's essential for data integrity

  2. Notes
    - This fixes the "no unique or exclusion constraint matching the ON CONFLICT specification" error
    - Each user should only have one preferences record
    - Orphaned records are safely removed as users will recreate preferences on next login
*/

-- Remove any preferences without a user_id (orphaned from before auth)
DELETE FROM user_preferences WHERE user_id IS NULL;

-- Remove any duplicate records (keep the most recent)
DELETE FROM user_preferences a USING user_preferences b
WHERE a.id < b.id AND a.user_id = b.user_id;

-- Make user_id NOT NULL
ALTER TABLE user_preferences 
ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint
ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id);
