/*
  # Add Default Transport Types to Suppliers

  1. Changes
    - Add default transport type columns to `suppliers` table:
      - `default_has_barge` (boolean) - Default barge availability
      - `default_has_truck` (boolean) - Default truck availability
      - `default_has_expipe` (boolean) - Default ex-pipe availability
  
  2. Purpose
    - Allow suppliers to have default transport types that can be assumed for all ports
    - These can be overridden at the individual port level
  
  3. Notes
    - All default to false
    - These values serve as fallback when port-specific transport info is not set
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'default_has_barge'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN default_has_barge boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'default_has_truck'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN default_has_truck boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'default_has_expipe'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN default_has_expipe boolean DEFAULT false;
  END IF;
END $$;