/*
  # Add Phone Types to Contacts

  1. Changes to contacts table
    - Add `phone_type` (text, optional) - Type of phone number (office, whatsapp, general)

  2. Changes to contact_persons table
    - Add `phone_type` (text, optional) - Type of phone number (office, whatsapp, general)
    - Add `mobile_type` (text, optional) - Type of mobile number (whatsapp, general)

  3. Important Notes
    - Phone types help identify the best contact method
    - WhatsApp numbers can be identified for quick messaging
    - Office phones are for formal business communication
    - General numbers can be used for any purpose
    - Applies to both main contacts and additional contact persons
*/

-- Add phone type to contacts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'phone_type'
  ) THEN
    ALTER TABLE contacts ADD COLUMN phone_type text DEFAULT 'general';
  END IF;
END $$;

-- Add phone types to contact_persons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_persons' AND column_name = 'phone_type'
  ) THEN
    ALTER TABLE contact_persons ADD COLUMN phone_type text DEFAULT 'general';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_persons' AND column_name = 'mobile_type'
  ) THEN
    ALTER TABLE contact_persons ADD COLUMN mobile_type text DEFAULT 'general';
  END IF;
END $$;