/*
  # Create Custom Countries Table

  1. New Tables
    - `custom_countries`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References auth.users
      - `name` (text) - Country name
      - `timezone` (text) - GMT offset for the country
      - `display_order` (integer) - Order for display
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on `custom_countries` table
    - Users can only view and manage their own custom countries

  3. Indexes
    - Index on user_id for fast lookups
    - Index on display_order for sorting

  4. Important Notes
    - Allows users to add custom country options beyond the default list
    - Each country has an associated timezone (GMT offset)
    - Display order allows users to organize their country list
*/

CREATE TABLE IF NOT EXISTS custom_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  timezone text DEFAULT 'GMT+0',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_countries_user_id ON custom_countries(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_countries_display_order ON custom_countries(display_order);

ALTER TABLE custom_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom countries"
  ON custom_countries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom countries"
  ON custom_countries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom countries"
  ON custom_countries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom countries"
  ON custom_countries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);