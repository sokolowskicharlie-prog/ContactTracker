/*
  # Change average_margin field type to support both dollar amounts and percentages

  1. Changes
    - Convert `average_margin` column from numeric to text type
    - This allows storing both numeric values (treated as dollars) and percentage values (e.g., "5%")
  
  2. Migration Steps
    - Preserve existing data by casting numeric values to text
    - Update column type to text
  
  3. Notes
    - Values without '%' symbol will be displayed with '$' prefix
    - Values with '%' symbol will be displayed as-is
*/

DO $$
BEGIN
  -- Check if the column exists and is numeric type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' 
    AND column_name = 'average_margin'
    AND data_type IN ('numeric', 'double precision', 'real', 'integer')
  ) THEN
    -- Convert existing numeric values to text, preserving the data
    ALTER TABLE contacts 
    ALTER COLUMN average_margin TYPE text USING average_margin::text;
  END IF;
END $$;