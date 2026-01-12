/*
  # Allow Port Region Management for Authenticated Users

  1. Changes
    - Add INSERT policy for uk_port_regions to allow authenticated users to add new ports
    - Add UPDATE policy for uk_port_regions to allow authenticated users to change port regions
    
  2. Security
    - Only authenticated users can insert or update port regions
    - Anyone can still view port regions (existing policy)
    
  3. Notes
    - This allows users to manage the port-to-region mapping
    - Useful for adding custom ports or correcting region assignments
*/

-- Add INSERT policy for uk_port_regions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'uk_port_regions'
    AND policyname = 'Authenticated users can add port regions'
  ) THEN
    CREATE POLICY "Authenticated users can add port regions"
      ON uk_port_regions FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Add UPDATE policy for uk_port_regions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'uk_port_regions'
    AND policyname = 'Authenticated users can update port regions'
  ) THEN
    CREATE POLICY "Authenticated users can update port regions"
      ON uk_port_regions FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Ensure latitude and longitude columns exist (they should from previous migrations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uk_port_regions' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE uk_port_regions ADD COLUMN latitude numeric;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uk_port_regions' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE uk_port_regions ADD COLUMN longitude numeric;
  END IF;
END $$;
