/*
  # Create Supplier Regions Tables with Port-to-Region Mapping

  1. New Tables
    - `uk_regions`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Region name (e.g., "Scotland", "North West England")
      - `created_at` (timestamptz)
    
    - `uk_port_regions`
      - `id` (uuid, primary key)
      - `port_name` (text, unique) - Port name
      - `region_id` (uuid, references uk_regions)
      - `created_at` (timestamptz)
    
    - `supplier_regions`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, references suppliers)
      - `region_id` (uuid, references uk_regions)
      - `created_at` (timestamptz)
      - Unique constraint on (supplier_id, region_id)

  2. Security
    - Enable RLS on all tables
    - Public read access for uk_regions and uk_port_regions (reference data)
    - Users can only manage supplier_regions for their own suppliers

  3. Indexes
    - Add indexes for foreign keys and lookups

  4. Important Notes
    - Replaces single region field with many-to-many relationship
    - Allows automatic region assignment based on ports
    - UK regions include: Scotland, Wales, Northern Ireland, and 9 English regions
*/

-- Create UK regions table
CREATE TABLE IF NOT EXISTS uk_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create UK port to region mapping table
CREATE TABLE IF NOT EXISTS uk_port_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  port_name text UNIQUE NOT NULL,
  region_id uuid REFERENCES uk_regions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create supplier regions junction table
CREATE TABLE IF NOT EXISTS supplier_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  region_id uuid REFERENCES uk_regions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(supplier_id, region_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_uk_port_regions_port ON uk_port_regions(port_name);
CREATE INDEX IF NOT EXISTS idx_uk_port_regions_region ON uk_port_regions(region_id);
CREATE INDEX IF NOT EXISTS idx_supplier_regions_supplier ON supplier_regions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_regions_region ON supplier_regions(region_id);

-- Enable RLS
ALTER TABLE uk_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uk_port_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_regions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for uk_regions (public read)
CREATE POLICY "Anyone can view UK regions"
  ON uk_regions FOR SELECT
  TO public
  USING (true);

-- RLS Policies for uk_port_regions (public read)
CREATE POLICY "Anyone can view port regions"
  ON uk_port_regions FOR SELECT
  TO public
  USING (true);

-- RLS Policies for supplier_regions
CREATE POLICY "Users can view supplier regions for own suppliers"
  ON supplier_regions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      WHERE s.id = supplier_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert supplier regions for own suppliers"
  ON supplier_regions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers s
      WHERE s.id = supplier_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete supplier regions for own suppliers"
  ON supplier_regions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      WHERE s.id = supplier_id
      AND s.user_id = auth.uid()
    )
  );

-- Insert UK regions
INSERT INTO uk_regions (name) VALUES
  ('Scotland'),
  ('Wales'),
  ('Northern Ireland'),
  ('North East England'),
  ('North West England'),
  ('Yorkshire and the Humber'),
  ('East Midlands'),
  ('West Midlands'),
  ('East of England'),
  ('London'),
  ('South East England'),
  ('South West England')
ON CONFLICT (name) DO NOTHING;
