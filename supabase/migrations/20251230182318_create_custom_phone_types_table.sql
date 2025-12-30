/*
  # Create custom phone types table

  1. New Tables
    - `custom_phone_types`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `label` (text) - Display label for the phone type
      - `value` (text) - Internal value for the phone type
      - `is_default` (boolean) - Whether this is a system default type
      - `display_order` (integer) - Order in which to display the phone type
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `custom_phone_types` table
    - Add policies for authenticated users to manage their own phone types
    
  3. Initial Data
    - Seed default phone types for all existing users
*/

-- Create the custom_phone_types table
CREATE TABLE IF NOT EXISTS custom_phone_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  is_default boolean DEFAULT false,
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_phone_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own phone types"
  ON custom_phone_types FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own phone types"
  ON custom_phone_types FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone types"
  ON custom_phone_types FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own phone types"
  ON custom_phone_types FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_phone_types_user_id ON custom_phone_types(user_id);

-- Function to initialize default phone types for a user
CREATE OR REPLACE FUNCTION initialize_default_phone_types(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO custom_phone_types (user_id, label, value, is_default, display_order)
  VALUES
    (p_user_id, 'Office', 'office', true, 1),
    (p_user_id, 'Mobile', 'mobile', true, 2),
    (p_user_id, 'Personal', 'personal', true, 3),
    (p_user_id, 'Reception', 'reception', true, 4),
    (p_user_id, 'WhatsApp', 'whatsapp', true, 5),
    (p_user_id, 'WeChat', 'wechat', true, 6),
    (p_user_id, 'General', 'general', true, 7)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize default phone types for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM initialize_default_phone_types(user_record.id);
  END LOOP;
END $$;

-- Create trigger to automatically initialize phone types for new users
CREATE OR REPLACE FUNCTION trigger_initialize_phone_types()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_default_phone_types(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created_phone_types
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_phone_types();