/*
  # Add Fuel Deals Table for Bunkering Transactions

  1. New Tables
    - `fuel_deals`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key) - References contacts table
      - `vessel_id` (uuid, foreign key, optional) - References vessels table
      - `vessel_name` (text) - Name of the vessel (stored even if vessel deleted)
      - `fuel_quantity` (numeric) - Metric tons of fuel
      - `fuel_type` (text) - Type of fuel (e.g., VLSFO, LSMGO, MGO, HFO)
      - `deal_date` (timestamptz) - Date when the deal was done
      - `port` (text) - Port where fueling took place
      - `notes` (text, optional) - Additional notes about the deal
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on fuel_deals table
    - Public access policies for demo purposes

  3. Indexes
    - Index on contact_id for faster lookups
    - Index on vessel_id for vessel-based queries
    - Index on deal_date for date-based sorting

  4. Important Notes
    - Fuel deals are linked to contacts (companies)
    - Can optionally be linked to vessels in the system
    - Vessel name is stored to preserve history even if vessel is deleted
    - Fuel deals are automatically deleted when a contact is deleted (CASCADE)
    - Deals are NOT deleted if vessel is deleted (vessel_id set to NULL)
*/

-- Create fuel_deals table
CREATE TABLE IF NOT EXISTS fuel_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  vessel_id uuid REFERENCES vessels(id) ON DELETE SET NULL,
  vessel_name text NOT NULL,
  fuel_quantity numeric NOT NULL,
  fuel_type text NOT NULL,
  deal_date timestamptz NOT NULL,
  port text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fuel_deals_contact_id ON fuel_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_fuel_deals_vessel_id ON fuel_deals(vessel_id);
CREATE INDEX IF NOT EXISTS idx_fuel_deals_deal_date ON fuel_deals(deal_date DESC);

-- Enable Row Level Security
ALTER TABLE fuel_deals ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fuel_deals' AND policyname = 'Allow public read access to fuel_deals'
  ) THEN
    CREATE POLICY "Allow public read access to fuel_deals"
      ON fuel_deals
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fuel_deals' AND policyname = 'Allow public insert access to fuel_deals'
  ) THEN
    CREATE POLICY "Allow public insert access to fuel_deals"
      ON fuel_deals
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fuel_deals' AND policyname = 'Allow public update access to fuel_deals'
  ) THEN
    CREATE POLICY "Allow public update access to fuel_deals"
      ON fuel_deals
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fuel_deals' AND policyname = 'Allow public delete access to fuel_deals'
  ) THEN
    CREATE POLICY "Allow public delete access to fuel_deals"
      ON fuel_deals
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;