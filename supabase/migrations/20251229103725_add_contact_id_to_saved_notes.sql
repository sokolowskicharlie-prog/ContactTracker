/*
  # Add contact association to saved notes

  1. Changes
    - Add `contact_id` column to `saved_notes` table
      - Optional foreign key to `contacts` table
      - Allows notes to be attached to specific contacts
    - Add index on contact_id for faster queries

  2. Important Notes
    - contact_id is optional (nullable) - notes can exist without being attached to a contact
    - When a contact is deleted, the note remains but contact_id is set to NULL
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_notes' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE saved_notes ADD COLUMN contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_saved_notes_contact_id ON saved_notes(contact_id);