/*
  # Add Marine Traffic ID to vessels

  1. Changes
    - Add `marine_traffic_id` column to `vessels` table
    - This stores the Marine Traffic ship ID for direct linking
    - Example: For "Maran Voyager", the ID would be "5437592"
    - URL format: https://www.marinetraffic.com/en/ais/details/ships/shipid:5437592
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vessels' AND column_name = 'marine_traffic_id'
  ) THEN
    ALTER TABLE vessels ADD COLUMN marine_traffic_id text;
  END IF;
END $$;