/*
  # Add Region Field to Suppliers Table

  1. Changes
    - Add `region` column to suppliers table for organizing UK suppliers by region
    - Column is optional (nullable) to maintain backward compatibility
    
  2. Notes
    - This field will primarily be used for UK-based suppliers
    - Common UK regions: Scotland, Wales, Northern Ireland, North East England, 
      North West England, Yorkshire and the Humber, East Midlands, West Midlands, 
      East of England, London, South East England, South West England
    - Field can also be used for other regional organization systems
*/

-- Add region column to suppliers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'region'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN region text;
  END IF;
END $$;

-- Create index for region filtering
CREATE INDEX IF NOT EXISTS idx_suppliers_region ON suppliers(region);