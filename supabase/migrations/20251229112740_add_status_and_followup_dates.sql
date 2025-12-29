/*
  # Add Status and Follow-up Date Tracking

  1. Changes
    - Add `jammed_date` column to track when contact was marked as jammed
    - Add `client_date` column to track when contact was marked as client
    - Add `traction_date` column to track when contact gained traction
    - Add `follow_up_date` column to track when to follow up with contact
  
  2. Details
    - All new columns are nullable timestamp with timezone
    - Timestamps will be set automatically when status changes from false to true
    - Follow-up date can be manually set by user
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'jammed_date'
  ) THEN
    ALTER TABLE contacts ADD COLUMN jammed_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'client_date'
  ) THEN
    ALTER TABLE contacts ADD COLUMN client_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'traction_date'
  ) THEN
    ALTER TABLE contacts ADD COLUMN traction_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'follow_up_date'
  ) THEN
    ALTER TABLE contacts ADD COLUMN follow_up_date timestamptz;
  END IF;
END $$;