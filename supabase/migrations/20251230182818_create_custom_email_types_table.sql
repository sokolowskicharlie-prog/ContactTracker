/*
  # Create custom email types table

  1. New Tables
    - `custom_email_types`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `label` (text) - Display label for the email type
      - `value` (text) - Internal value for the email type
      - `is_default` (boolean) - Whether this is a system default type
      - `display_order` (integer) - Order in which to display the email type
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `custom_email_types` table
    - Add policies for authenticated users to manage their own email types
    
  3. Initial Data
    - Seed default email types for all existing users
*/

CREATE TABLE IF NOT EXISTS custom_email_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  is_default boolean DEFAULT false,
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_email_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email types"
  ON custom_email_types FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email types"
  ON custom_email_types FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email types"
  ON custom_email_types FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email types"
  ON custom_email_types FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false);

CREATE INDEX IF NOT EXISTS idx_custom_email_types_user_id ON custom_email_types(user_id);

CREATE OR REPLACE FUNCTION initialize_default_email_types(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO custom_email_types (user_id, label, value, is_default, display_order)
  VALUES
    (p_user_id, 'Personal', 'personal', true, 1),
    (p_user_id, 'General', 'general', true, 2)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM initialize_default_email_types(user_record.id);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION trigger_initialize_email_types()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_default_email_types(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created_email_types
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_email_types();