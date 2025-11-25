/*
  # Add Phone Type Fields to Supplier Contacts

  1. Changes to supplier_contacts table
    - Add `phone_type` (text, optional) - Type of phone number (office, whatsapp, general)
    - Add `mobile_type` (text, optional) - Type of mobile number (whatsapp, general)

  2. Important Notes
    - Phone types help identify how to best reach contacts
    - WhatsApp numbers can be identified for quick messaging
    - Office phones are for formal business communication
    - General numbers can be used for any purpose
    - Default values not set to allow flexibility
*/

-- Add phone type fields to supplier_contacts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplier_contacts' AND column_name = 'phone_type'
  ) THEN
    ALTER TABLE supplier_contacts ADD COLUMN phone_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplier_contacts' AND column_name = 'mobile_type'
  ) THEN
    ALTER TABLE supplier_contacts ADD COLUMN mobile_type text;
  END IF;
END $$;