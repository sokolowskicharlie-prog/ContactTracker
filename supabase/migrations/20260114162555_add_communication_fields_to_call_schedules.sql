/*
  # Add communication fields to call_schedules table

  1. Changes
    - Add `communication_type` (text, nullable) - type of communication: 'phone_call', 'email', 'whatsapp'
    - Add `contact_person_name` (text, nullable) - name of the contact person for email/whatsapp
    - Add `contact_person_email` (text, nullable) - email address for email communications
    - Add `email_subject` (text, nullable) - subject line for email communications
    - Add `whatsapp_message` (text, nullable) - message content for WhatsApp communications

  2. Notes
    - These fields allow the schedule to store different types of communications
    - When checking off an item, the appropriate modal (call, email, or WhatsApp) will be opened
    - Existing schedules will have null values and default to phone calls
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_schedules' AND column_name = 'communication_type'
  ) THEN
    ALTER TABLE call_schedules ADD COLUMN communication_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_schedules' AND column_name = 'contact_person_name'
  ) THEN
    ALTER TABLE call_schedules ADD COLUMN contact_person_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_schedules' AND column_name = 'contact_person_email'
  ) THEN
    ALTER TABLE call_schedules ADD COLUMN contact_person_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_schedules' AND column_name = 'email_subject'
  ) THEN
    ALTER TABLE call_schedules ADD COLUMN email_subject text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_schedules' AND column_name = 'whatsapp_message'
  ) THEN
    ALTER TABLE call_schedules ADD COLUMN whatsapp_message text;
  END IF;
END $$;
