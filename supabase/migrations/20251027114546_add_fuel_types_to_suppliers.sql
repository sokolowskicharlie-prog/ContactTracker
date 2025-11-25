/*
  # Add Fuel Types to Suppliers

  1. Changes
    - Add `fuel_types` (text, optional) - Comma-separated list of fuel types supplied (e.g., VLSFO, LSMGO, MGO, HFO)
  
  2. Important Notes
    - Fuel types field stores multiple fuel types as comma-separated values
    - This allows filtering suppliers by the types of fuel they provide
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'fuel_types'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN fuel_types text;
  END IF;
END $$;
