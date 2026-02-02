/*
  # Add Vessel Destination and ETA Fields

  1. Changes
    - Add `destination` field to track where vessel is headed
    - Add `eta` field to track estimated time of arrival
    - Add `last_updated` field to track when vessel info was last updated
  
  2. Notes
    - Destination is text field for port/location name
    - ETA is timestamptz for accurate timezone handling
    - Last updated helps track data freshness
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vessels' AND column_name = 'destination'
  ) THEN
    ALTER TABLE vessels ADD COLUMN destination text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vessels' AND column_name = 'eta'
  ) THEN
    ALTER TABLE vessels ADD COLUMN eta timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vessels' AND column_name = 'last_updated'
  ) THEN
    ALTER TABLE vessels ADD COLUMN last_updated timestamptz DEFAULT now();
  END IF;
END $$;