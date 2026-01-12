/*
  # Add Coordinates to UK Port Regions

  1. Schema Changes
    - Add `latitude` (numeric) to `uk_port_regions` table
    - Add `longitude` (numeric) to `uk_port_regions` table
  
  2. Important Notes
    - Coordinates will be used for map visualization
    - Uses decimal degrees format (WGS84)
*/

-- Add latitude and longitude columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uk_port_regions' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE uk_port_regions ADD COLUMN latitude numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uk_port_regions' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE uk_port_regions ADD COLUMN longitude numeric(10, 7);
  END IF;
END $$;
