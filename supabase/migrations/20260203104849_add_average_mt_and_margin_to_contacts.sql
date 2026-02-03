/*
  # Add average MT and margin fields to contacts

  1. Changes
    - Add `average_mt_enquiry` column to contacts table (numeric type for storing metric tons)
    - Add `average_margin` column to contacts table (numeric type for storing margin percentage/amount)
  
  2. Notes
    - These fields store financial and volume metrics for each contact
    - Both fields are optional (nullable) as not all contacts may have this data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'average_mt_enquiry'
  ) THEN
    ALTER TABLE contacts ADD COLUMN average_mt_enquiry numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'average_margin'
  ) THEN
    ALTER TABLE contacts ADD COLUMN average_margin numeric;
  END IF;
END $$;