/*
  # Add Follow-up Reason to Contacts

  1. Changes
    - Add `follow_up_reason` column to `contacts` table
      - Stores the reason for the follow-up date
      - Text field, nullable
      - Allows users to track why they need to follow up with a contact

  2. Notes
    - This field will be displayed alongside the follow-up date in various views
    - Helps users remember the context of scheduled follow-ups
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'follow_up_reason'
  ) THEN
    ALTER TABLE contacts ADD COLUMN follow_up_reason text;
  END IF;
END $$;