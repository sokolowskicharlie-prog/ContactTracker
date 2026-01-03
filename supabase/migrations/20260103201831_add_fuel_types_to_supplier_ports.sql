/*
  # Add Fuel Types to Supplier Ports

  1. Changes
    - Add `has_vlsfo` boolean column to track if port supplies VLSFO fuel
    - Add `has_lsmgo` boolean column to track if port supplies LSMGO fuel
    - Both columns default to false for existing records

  2. Notes
    - VLSFO: Very Low Sulfur Fuel Oil
    - LSMGO: Low Sulfur Marine Gas Oil
    - These are common marine fuel types that suppliers can provide at different ports
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplier_ports' AND column_name = 'has_vlsfo'
  ) THEN
    ALTER TABLE supplier_ports ADD COLUMN has_vlsfo boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplier_ports' AND column_name = 'has_lsmgo'
  ) THEN
    ALTER TABLE supplier_ports ADD COLUMN has_lsmgo boolean DEFAULT false NOT NULL;
  END IF;
END $$;