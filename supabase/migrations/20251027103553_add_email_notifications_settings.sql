/*
  # Add Email Notification Settings

  1. New Tables
    - `notification_settings`
      - `id` (uuid, primary key)
      - `user_email` (text) - Email address to send notifications to
      - `days_before_reminder` (integer, default 1) - How many days before due date to send reminder
      - `enabled` (boolean, default true) - Whether notifications are enabled
      - `last_check` (timestamptz) - Last time notifications were checked
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Record update time

  2. Security
    - Enable RLS on notification_settings table
    - Public access policies for demo purposes

  3. Important Notes
    - Only one settings record should exist (singleton pattern)
    - The edge function will check this table to determine when to send reminders
    - Emails are sent X days before the call is due based on days_before_reminder
*/

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  days_before_reminder integer DEFAULT 1,
  enabled boolean DEFAULT true,
  last_check timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_settings' AND policyname = 'Allow public read access to notification_settings'
  ) THEN
    CREATE POLICY "Allow public read access to notification_settings"
      ON notification_settings
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_settings' AND policyname = 'Allow public insert access to notification_settings'
  ) THEN
    CREATE POLICY "Allow public insert access to notification_settings"
      ON notification_settings
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_settings' AND policyname = 'Allow public update access to notification_settings'
  ) THEN
    CREATE POLICY "Allow public update access to notification_settings"
      ON notification_settings
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_settings' AND policyname = 'Allow public delete access to notification_settings'
  ) THEN
    CREATE POLICY "Allow public delete access to notification_settings"
      ON notification_settings
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;