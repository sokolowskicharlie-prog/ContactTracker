/*
  # Create custom jammed reasons table

  1. New Tables
    - `custom_jammed_reasons`
      - `id` (uuid, primary key) - Unique identifier for each custom reason
      - `user_id` (uuid, foreign key) - References auth.users
      - `reason` (text) - The custom jammed reason text
      - `created_at` (timestamptz) - When the reason was created
      - `display_order` (integer) - Order in which reasons should be displayed
  
  2. Security
    - Enable RLS on `custom_jammed_reasons` table
    - Add policy for users to read their own custom reasons
    - Add policy for users to insert their own custom reasons
    - Add policy for users to update their own custom reasons
    - Add policy for users to delete their own custom reasons

  3. Indexes
    - Index on user_id for fast lookups
    - Index on user_id and display_order for ordering
*/

-- Create custom jammed reasons table
CREATE TABLE IF NOT EXISTS custom_jammed_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_jammed_reasons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own custom jammed reasons"
  ON custom_jammed_reasons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom jammed reasons"
  ON custom_jammed_reasons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom jammed reasons"
  ON custom_jammed_reasons FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom jammed reasons"
  ON custom_jammed_reasons FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_jammed_reasons_user_id 
  ON custom_jammed_reasons(user_id);

CREATE INDEX IF NOT EXISTS idx_custom_jammed_reasons_user_order 
  ON custom_jammed_reasons(user_id, display_order);