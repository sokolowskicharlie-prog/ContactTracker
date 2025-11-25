/*
  # Add Vessels Table for Ship Tracking

  1. New Tables
    - `vessels`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key) - References contacts table
      - `vessel_name` (text) - Name of the vessel
      - `imo_number` (text, optional) - International Maritime Organization number
      - `vessel_type` (text, optional) - Type of vessel (e.g., Container, Tanker, Bulk Carrier)
      - `marine_traffic_url` (text, optional) - Direct link to Marine Traffic page
      - `notes` (text, optional) - Additional notes about the vessel
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on vessels table
    - Public access policies for demo purposes

  3. Indexes
    - Index on contact_id for faster lookups
    - Index on imo_number for searching

  4. Important Notes
    - Vessels are linked to contacts (companies)
    - Vessels are automatically deleted when a contact is deleted (CASCADE)
    - IMO numbers are unique identifiers for vessels
    - Marine Traffic URLs can be auto-generated from IMO numbers
*/

-- Create vessels table
CREATE TABLE IF NOT EXISTS vessels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  vessel_name text NOT NULL,
  imo_number text,
  vessel_type text,
  marine_traffic_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vessels_contact_id ON vessels(contact_id);
CREATE INDEX IF NOT EXISTS idx_vessels_imo_number ON vessels(imo_number);

-- Enable Row Level Security
ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vessels' AND policyname = 'Allow public read access to vessels'
  ) THEN
    CREATE POLICY "Allow public read access to vessels"
      ON vessels
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vessels' AND policyname = 'Allow public insert access to vessels'
  ) THEN
    CREATE POLICY "Allow public insert access to vessels"
      ON vessels
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vessels' AND policyname = 'Allow public update access to vessels'
  ) THEN
    CREATE POLICY "Allow public update access to vessels"
      ON vessels
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vessels' AND policyname = 'Allow public delete access to vessels'
  ) THEN
    CREATE POLICY "Allow public delete access to vessels"
      ON vessels
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;