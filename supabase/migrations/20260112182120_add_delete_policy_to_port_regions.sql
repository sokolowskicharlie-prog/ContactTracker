/*
  # Add Delete Policy for Port Regions

  1. Changes
    - Add DELETE policy for uk_port_regions to allow authenticated users to remove ports
    
  2. Security
    - Only authenticated users can delete port regions
    
  3. Notes
    - This allows users to clean up unused or incorrect ports
*/

-- Add DELETE policy for uk_port_regions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'uk_port_regions'
    AND policyname = 'Authenticated users can delete port regions'
  ) THEN
    CREATE POLICY "Authenticated users can delete port regions"
      ON uk_port_regions FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;
