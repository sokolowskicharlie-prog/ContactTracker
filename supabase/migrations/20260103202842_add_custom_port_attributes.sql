/*
  # Add Custom Fuel Types and Delivery Methods for Ports

  1. New Tables
    - `custom_fuel_types`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, the custom fuel type name)
      - `created_at` (timestamptz)
    
    - `custom_delivery_methods`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, the custom delivery method name)
      - `created_at` (timestamptz)
    
    - `supplier_port_fuel_types`
      - `id` (uuid, primary key)
      - `port_id` (uuid, references supplier_ports)
      - `fuel_type_id` (uuid, references custom_fuel_types)
      - `created_at` (timestamptz)
    
    - `supplier_port_delivery_methods`
      - `id` (uuid, primary key)
      - `port_id` (uuid, references supplier_ports)
      - `delivery_method_id` (uuid, references custom_delivery_methods)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Users can only access their own custom types
    - Users can only manage port associations for their own ports

  3. Indexes
    - Add indexes for foreign keys and user lookups
*/

-- Create custom fuel types table
CREATE TABLE IF NOT EXISTS custom_fuel_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create custom delivery methods table
CREATE TABLE IF NOT EXISTS custom_delivery_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create junction table for port fuel types
CREATE TABLE IF NOT EXISTS supplier_port_fuel_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  port_id uuid REFERENCES supplier_ports(id) ON DELETE CASCADE NOT NULL,
  fuel_type_id uuid REFERENCES custom_fuel_types(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(port_id, fuel_type_id)
);

-- Create junction table for port delivery methods
CREATE TABLE IF NOT EXISTS supplier_port_delivery_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  port_id uuid REFERENCES supplier_ports(id) ON DELETE CASCADE NOT NULL,
  delivery_method_id uuid REFERENCES custom_delivery_methods(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(port_id, delivery_method_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_fuel_types_user ON custom_fuel_types(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_delivery_methods_user ON custom_delivery_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_port_fuel_types_port ON supplier_port_fuel_types(port_id);
CREATE INDEX IF NOT EXISTS idx_port_fuel_types_fuel ON supplier_port_fuel_types(fuel_type_id);
CREATE INDEX IF NOT EXISTS idx_port_delivery_methods_port ON supplier_port_delivery_methods(port_id);
CREATE INDEX IF NOT EXISTS idx_port_delivery_methods_delivery ON supplier_port_delivery_methods(delivery_method_id);

-- Enable RLS
ALTER TABLE custom_fuel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_delivery_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_port_fuel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_port_delivery_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_fuel_types
CREATE POLICY "Users can view own fuel types"
  ON custom_fuel_types FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fuel types"
  ON custom_fuel_types FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fuel types"
  ON custom_fuel_types FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fuel types"
  ON custom_fuel_types FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for custom_delivery_methods
CREATE POLICY "Users can view own delivery methods"
  ON custom_delivery_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own delivery methods"
  ON custom_delivery_methods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own delivery methods"
  ON custom_delivery_methods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own delivery methods"
  ON custom_delivery_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for supplier_port_fuel_types
CREATE POLICY "Users can view port fuel types for own ports"
  ON supplier_port_fuel_types FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM supplier_ports sp
      JOIN suppliers s ON s.id = sp.supplier_id
      WHERE sp.id = port_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert port fuel types for own ports"
  ON supplier_port_fuel_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplier_ports sp
      JOIN suppliers s ON s.id = sp.supplier_id
      WHERE sp.id = port_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete port fuel types for own ports"
  ON supplier_port_fuel_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM supplier_ports sp
      JOIN suppliers s ON s.id = sp.supplier_id
      WHERE sp.id = port_id
      AND s.user_id = auth.uid()
    )
  );

-- RLS Policies for supplier_port_delivery_methods
CREATE POLICY "Users can view port delivery methods for own ports"
  ON supplier_port_delivery_methods FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM supplier_ports sp
      JOIN suppliers s ON s.id = sp.supplier_id
      WHERE sp.id = port_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert port delivery methods for own ports"
  ON supplier_port_delivery_methods FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplier_ports sp
      JOIN suppliers s ON s.id = sp.supplier_id
      WHERE sp.id = port_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete port delivery methods for own ports"
  ON supplier_port_delivery_methods FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM supplier_ports sp
      JOIN suppliers s ON s.id = sp.supplier_id
      WHERE sp.id = port_id
      AND s.user_id = auth.uid()
    )
  );
