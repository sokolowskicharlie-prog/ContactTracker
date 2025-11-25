/*
  # Add Contact Persons Table for Multiple Phone Numbers

  1. New Tables
    - `contact_persons`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key) - References contacts table
      - `name` (text) - Person in Charge name
      - `phone` (text, optional) - Phone number
      - `email` (text, optional) - Email address
      - `is_primary` (boolean, default false) - Mark as primary contact
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on contact_persons table
    - Public access policies for demo purposes

  3. Indexes
    - Index on contact_id for faster lookups

  4. Important Notes
    - Contacts can have multiple contact persons (one-to-many relationship)
    - Contact persons are automatically deleted when a contact is deleted (CASCADE)
    - At least one person should be marked as primary
*/

-- Create contact_persons table
CREATE TABLE IF NOT EXISTS contact_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_persons_contact_id ON contact_persons(contact_id);

-- Enable Row Level Security
ALTER TABLE contact_persons ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_persons' AND policyname = 'Allow public read access to contact_persons'
  ) THEN
    CREATE POLICY "Allow public read access to contact_persons"
      ON contact_persons
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_persons' AND policyname = 'Allow public insert access to contact_persons'
  ) THEN
    CREATE POLICY "Allow public insert access to contact_persons"
      ON contact_persons
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_persons' AND policyname = 'Allow public update access to contact_persons'
  ) THEN
    CREATE POLICY "Allow public update access to contact_persons"
      ON contact_persons
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_persons' AND policyname = 'Allow public delete access to contact_persons'
  ) THEN
    CREATE POLICY "Allow public delete access to contact_persons"
      ON contact_persons
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;