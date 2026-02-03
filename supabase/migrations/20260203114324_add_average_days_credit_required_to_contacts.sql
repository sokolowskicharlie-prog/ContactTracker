/*
  # Add Average Days Credit Required to Contacts

  1. Changes
    - Add `average_days_credit_required` column to `contacts` table
      - Type: integer
      - Nullable: true (not all contacts may have credit terms)
      - Description: Stores the average number of days of credit required by the contact
  
  2. Notes
    - This field helps track payment terms and credit requirements for each contact
    - Can be used for financial planning and credit management
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'average_days_credit_required'
  ) THEN
    ALTER TABLE contacts ADD COLUMN average_days_credit_required integer;
  END IF;
END $$;