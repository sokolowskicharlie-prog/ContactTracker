/*
  # Add Supplier Contacts and Ports

  1. Changes to suppliers table
    - Add `ports` (text, optional) - Comma-separated list of ports they supply
    - Add `general_email` (text, optional) - General company email for inquiries

  2. New Tables
    - `supplier_contacts`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, foreign key) - References suppliers table
      - `name` (text) - Contact person name
      - `title` (text, optional) - Job title/position
      - `email` (text, optional) - Contact email
      - `phone` (text, optional) - Contact phone
      - `mobile` (text, optional) - Mobile phone
      - `notes` (text, optional) - Additional notes about contact
      - `is_primary` (boolean) - Whether this is the primary contact
      - `created_at` (timestamptz) - Record creation time

  3. Security
    - Enable RLS on supplier_contacts table
    - Public access policies for demo purposes

  4. Indexes
    - Index on supplier_id in contacts table
    - Index on is_primary for quick primary contact lookup

  5. Important Notes
    - Ports field stores multiple ports as comma-separated values
    - Multiple contacts can be added per supplier
    - Contacts are automatically deleted when supplier is deleted (CASCADE)
    - Primary contact flag helps identify main point of contact
*/

-- Add fields to suppliers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'ports'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN ports text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'general_email'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN general_email text;
  END IF;
END $$;

-- Create supplier_contacts table
CREATE TABLE IF NOT EXISTS supplier_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  email text,
  phone text,
  mobile text,
  notes text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier_id ON supplier_contacts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_primary ON supplier_contacts(supplier_id, is_primary);

-- Enable Row Level Security
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for supplier_contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_contacts' AND policyname = 'Allow public read access to supplier_contacts'
  ) THEN
    CREATE POLICY "Allow public read access to supplier_contacts"
      ON supplier_contacts
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_contacts' AND policyname = 'Allow public insert access to supplier_contacts'
  ) THEN
    CREATE POLICY "Allow public insert access to supplier_contacts"
      ON supplier_contacts
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_contacts' AND policyname = 'Allow public update access to supplier_contacts'
  ) THEN
    CREATE POLICY "Allow public update access to supplier_contacts"
      ON supplier_contacts
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_contacts' AND policyname = 'Allow public delete access to supplier_contacts'
  ) THEN
    CREATE POLICY "Allow public delete access to supplier_contacts"
      ON supplier_contacts
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;