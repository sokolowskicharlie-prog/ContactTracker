/*
  # Add Last Activity Tracking to Contacts

  1. Changes
    - Add `last_called` column to track the most recent call date
    - Add `last_emailed` column to track the most recent email date
    - These columns help users quickly see when they last interacted with a contact
  
  2. Purpose
    - Improves contact management by showing recent activity at a glance
    - Helps users identify contacts they haven't reached out to recently
    - Provides quick reference in table view without querying related tables
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'last_called'
  ) THEN
    ALTER TABLE contacts ADD COLUMN last_called timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'last_emailed'
  ) THEN
    ALTER TABLE contacts ADD COLUMN last_emailed timestamptz;
  END IF;
END $$;