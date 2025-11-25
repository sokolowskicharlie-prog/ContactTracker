/*
  # Add Country and Timezone to Contacts

  1. Changes to contacts table
    - Add `country` (text, optional) - Country name or code
    - Add `timezone` (text, optional) - Timezone identifier (e.g., America/New_York, Asia/Tokyo)

  2. Important Notes
    - Uses standard timezone identifiers (IANA Time Zone Database)
    - Allows filtering and organizing contacts by location
    - Existing contacts will have NULL values for these fields
*/

-- Add country and timezone columns to contacts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'country'
  ) THEN
    ALTER TABLE contacts ADD COLUMN country text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE contacts ADD COLUMN timezone text;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_country ON contacts(country);
CREATE INDEX IF NOT EXISTS idx_contacts_timezone ON contacts(timezone);