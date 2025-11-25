/*
  # Create Suppliers Table

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `company_name` (text) - Supplier company name
      - `contact_person` (text, optional) - Primary contact person
      - `email` (text, optional) - Contact email
      - `phone` (text, optional) - Contact phone
      - `website` (text, optional) - Company website
      - `address` (text, optional) - Physical address
      - `country` (text, optional) - Country location
      - `supplier_type` (text, optional) - Type of supplier (e.g., Fuel, Provisions, Ship Supplies)
      - `products_services` (text, optional) - Products/services offered
      - `payment_terms` (text, optional) - Payment terms
      - `currency` (text, optional) - Preferred currency
      - `notes` (text, optional) - Additional notes
      - `rating` (integer, optional) - Rating 1-5
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

    - `supplier_orders`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, foreign key) - References suppliers table
      - `order_number` (text, optional) - Order reference number
      - `order_date` (timestamptz) - Date of order
      - `delivery_date` (timestamptz, optional) - Expected/actual delivery date
      - `total_amount` (numeric, optional) - Total order amount
      - `currency` (text, optional) - Currency used
      - `status` (text) - Order status (pending, delivered, cancelled)
      - `items` (text, optional) - Order items description
      - `notes` (text, optional) - Additional notes
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on both tables
    - Public access policies for demo purposes

  3. Indexes
    - Index on supplier_id in orders table
    - Index on company_name for search
    - Index on supplier_type for filtering

  4. Important Notes
    - Suppliers track vendor/supplier companies
    - Orders are automatically deleted when supplier is deleted (CASCADE)
    - Rating helps track supplier performance
    - Multiple currency support for international suppliers
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  website text,
  address text,
  country text,
  supplier_type text,
  products_services text,
  payment_terms text,
  currency text DEFAULT 'USD',
  notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create supplier_orders table
CREATE TABLE IF NOT EXISTS supplier_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  order_number text,
  order_date timestamptz NOT NULL,
  delivery_date timestamptz,
  total_amount numeric,
  currency text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  items text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier_id ON supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_order_date ON supplier_orders(order_date DESC);

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'suppliers' AND policyname = 'Allow public read access to suppliers'
  ) THEN
    CREATE POLICY "Allow public read access to suppliers"
      ON suppliers
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'suppliers' AND policyname = 'Allow public insert access to suppliers'
  ) THEN
    CREATE POLICY "Allow public insert access to suppliers"
      ON suppliers
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'suppliers' AND policyname = 'Allow public update access to suppliers'
  ) THEN
    CREATE POLICY "Allow public update access to suppliers"
      ON suppliers
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'suppliers' AND policyname = 'Allow public delete access to suppliers'
  ) THEN
    CREATE POLICY "Allow public delete access to suppliers"
      ON suppliers
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;

-- Create policies for supplier_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_orders' AND policyname = 'Allow public read access to supplier_orders'
  ) THEN
    CREATE POLICY "Allow public read access to supplier_orders"
      ON supplier_orders
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_orders' AND policyname = 'Allow public insert access to supplier_orders'
  ) THEN
    CREATE POLICY "Allow public insert access to supplier_orders"
      ON supplier_orders
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_orders' AND policyname = 'Allow public update access to supplier_orders'
  ) THEN
    CREATE POLICY "Allow public update access to supplier_orders"
      ON supplier_orders
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'supplier_orders' AND policyname = 'Allow public delete access to supplier_orders'
  ) THEN
    CREATE POLICY "Allow public delete access to supplier_orders"
      ON supplier_orders
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;