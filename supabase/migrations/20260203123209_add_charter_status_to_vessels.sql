/*
  # Add Charter Status to Vessels

  1. Changes
    - Add `charter_status` column to vessels table
      - Stores whether vessel is on TC (Time Charter), Bunkers Managed, or neither
      - Optional field (nullable)
      - Options: 'TC', 'Bunkers Managed', or null

  2. Notes
    - This field helps track the operational status of vessels
    - TC = Time Charter
    - Bunkers Managed = Bunker fuel is managed by the company
*/

-- Add charter_status column to vessels table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vessels' AND column_name = 'charter_status'
  ) THEN
    ALTER TABLE vessels ADD COLUMN charter_status text;
  END IF;
END $$;