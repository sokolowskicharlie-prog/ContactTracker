/*
  # Add Country Field to UK Port Regions

  1. Changes
    - Add `country` column to `uk_port_regions` table
    - Defaults to 'United Kingdom' for existing ports
    - Allows tracking ports from any country

  2. Important Notes
    - Existing ports will default to 'United Kingdom'
    - Display logic will show region for UK/Ireland, country for others
*/

-- Add country column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uk_port_regions' AND column_name = 'country'
  ) THEN
    ALTER TABLE uk_port_regions ADD COLUMN country text DEFAULT 'United Kingdom';
  END IF;
END $$;

-- Update existing ports to have explicit country
UPDATE uk_port_regions
SET country = 'United Kingdom'
WHERE country IS NULL OR country = '';
