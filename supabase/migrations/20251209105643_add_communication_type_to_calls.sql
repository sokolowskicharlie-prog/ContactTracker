/*
  # Add communication type to calls table

  1. Changes
    - Add `communication_type` column to `calls` table
      - Values: 'phone_call', 'whatsapp', 'email'
      - Default: 'phone_call' for backward compatibility
    - Update existing records to have 'phone_call' type
  
  2. Notes
    - This allows the CallModal to handle multiple communication types
    - Email type will still save to emails table for backward compatibility
    - WhatsApp messages will be stored in calls table with type 'whatsapp'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calls' AND column_name = 'communication_type'
  ) THEN
    ALTER TABLE calls ADD COLUMN communication_type text DEFAULT 'phone_call';
    ALTER TABLE calls ADD CONSTRAINT calls_communication_type_check 
      CHECK (communication_type IN ('phone_call', 'whatsapp', 'email'));
  END IF;
END $$;