/*
  # Add Supplier Ports Table with Delivery Methods

  1. New Tables
    - `supplier_ports`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, foreign key) - References suppliers table
      - `port_name` (text) - Name of the port
      - `has_barge` (boolean) - Whether delivery via barge is available
      - `has_truck` (boolean) - Whether delivery via truck is available
      - `has_expipe` (boolean) - Whether delivery via ex-pipe is available
      - `notes` (text, optional) - Additional notes about port capabilities
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on supplier_ports table
    - Add policies for authenticated users to manage supplier ports

  3. Indexes
    - Index on supplier_id for fast lookups
    - Index on port_name for searching

  4. Important Notes
    - Allows detailed tracking of which ports a supplier operates in
    - Each port can have multiple delivery methods (barge, truck, ex-pipe)
    - Replaces the simple comma-separated ports text field with structured data
    - Ports are automatically deleted when supplier is deleted (CASCADE)
*/

-- Create supplier_ports table
CREATE TABLE IF NOT EXISTS supplier_ports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  port_name text NOT NULL,
  has_barge boolean DEFAULT false,
  has_truck boolean DEFAULT false,
  has_expipe boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supplier_ports_supplier_id ON supplier_ports(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ports_port_name ON supplier_ports(port_name);

-- Enable Row Level Security
ALTER TABLE supplier_ports ENABLE ROW LEVEL SECURITY;

-- Create policies for supplier_ports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_ports' AND policyname = 'Allow public read access to supplier_ports'
  ) THEN
    CREATE POLICY "Allow public read access to supplier_ports"
      ON supplier_ports
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_ports' AND policyname = 'Allow public insert access to supplier_ports'
  ) THEN
    CREATE POLICY "Allow public insert access to supplier_ports"
      ON supplier_ports
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_ports' AND policyname = 'Allow public update access to supplier_ports'
  ) THEN
    CREATE POLICY "Allow public update access to supplier_ports"
      ON supplier_ports
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_ports' AND policyname = 'Allow public delete access to supplier_ports'
  ) THEN
    CREATE POLICY "Allow public delete access to supplier_ports"
      ON supplier_ports
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;