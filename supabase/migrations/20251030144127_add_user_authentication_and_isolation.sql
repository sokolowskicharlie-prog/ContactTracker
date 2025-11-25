/*
  # Add User Authentication and Data Isolation

  ## Overview
  This migration enables multi-user support with authentication and ensures each user can only access their own data.

  ## Changes

  ### 1. Add user_id columns to all tables
  - contacts
  - contact_persons
  - calls
  - emails
  - suppliers
  - supplier_contacts
  - supplier_orders
  - vessels
  - fuel_deals
  - tasks
  - user_preferences
  - notification_settings

  ### 2. Create indexes for performance
  - Index on user_id for all tables for faster queries

  ### 3. Update Row Level Security (RLS) policies
  - Enable RLS on all tables (already enabled)
  - Add restrictive policies that check auth.uid()
  - Users can only see/modify their own data
  - Policies for SELECT, INSERT, UPDATE, DELETE

  ## Security Notes
  - All tables require authentication
  - Users are completely isolated from each other
  - No data sharing between users
*/

-- Add user_id column to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to contact_persons table
ALTER TABLE contact_persons 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to calls table
ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to emails table
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to supplier_contacts table
ALTER TABLE supplier_contacts 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to supplier_orders table
ALTER TABLE supplier_orders 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to vessels table
ALTER TABLE vessels 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to fuel_deals table
ALTER TABLE fuel_deals 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to notification_settings table
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update user_preferences table to use uuid instead of text for user_id
ALTER TABLE user_preferences 
DROP COLUMN IF EXISTS user_id CASCADE;

ALTER TABLE user_preferences 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_persons_user_id ON contact_persons(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_user_id ON supplier_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_user_id ON supplier_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_vessels_user_id ON vessels(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_deals_user_id ON fuel_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;

DROP POLICY IF EXISTS "Users can read own contact persons" ON contact_persons;
DROP POLICY IF EXISTS "Users can insert own contact persons" ON contact_persons;
DROP POLICY IF EXISTS "Users can update own contact persons" ON contact_persons;
DROP POLICY IF EXISTS "Users can delete own contact persons" ON contact_persons;

DROP POLICY IF EXISTS "Users can read own calls" ON calls;
DROP POLICY IF EXISTS "Users can insert own calls" ON calls;
DROP POLICY IF EXISTS "Users can update own calls" ON calls;
DROP POLICY IF EXISTS "Users can delete own calls" ON calls;

DROP POLICY IF EXISTS "Users can read own emails" ON emails;
DROP POLICY IF EXISTS "Users can insert own emails" ON emails;
DROP POLICY IF EXISTS "Users can update own emails" ON emails;
DROP POLICY IF EXISTS "Users can delete own emails" ON emails;

DROP POLICY IF EXISTS "Users can read own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can insert own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete own suppliers" ON suppliers;

DROP POLICY IF EXISTS "Users can read own supplier contacts" ON supplier_contacts;
DROP POLICY IF EXISTS "Users can insert own supplier contacts" ON supplier_contacts;
DROP POLICY IF EXISTS "Users can update own supplier contacts" ON supplier_contacts;
DROP POLICY IF EXISTS "Users can delete own supplier contacts" ON supplier_contacts;

DROP POLICY IF EXISTS "Users can read own supplier orders" ON supplier_orders;
DROP POLICY IF EXISTS "Users can insert own supplier orders" ON supplier_orders;
DROP POLICY IF EXISTS "Users can update own supplier orders" ON supplier_orders;
DROP POLICY IF EXISTS "Users can delete own supplier orders" ON supplier_orders;

DROP POLICY IF EXISTS "Users can read own vessels" ON vessels;
DROP POLICY IF EXISTS "Users can insert own vessels" ON vessels;
DROP POLICY IF EXISTS "Users can update own vessels" ON vessels;
DROP POLICY IF EXISTS "Users can delete own vessels" ON vessels;

DROP POLICY IF EXISTS "Users can read own fuel deals" ON fuel_deals;
DROP POLICY IF EXISTS "Users can insert own fuel deals" ON fuel_deals;
DROP POLICY IF EXISTS "Users can update own fuel deals" ON fuel_deals;
DROP POLICY IF EXISTS "Users can delete own fuel deals" ON fuel_deals;

DROP POLICY IF EXISTS "Users can read own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can read own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;

DROP POLICY IF EXISTS "Users can read own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can delete own notification settings" ON notification_settings;

-- Contacts table policies
CREATE POLICY "Users can read own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Contact persons table policies
CREATE POLICY "Users can read own contact persons"
  ON contact_persons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contact persons"
  ON contact_persons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact persons"
  ON contact_persons FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact persons"
  ON contact_persons FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Calls table policies
CREATE POLICY "Users can read own calls"
  ON calls FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calls"
  ON calls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calls"
  ON calls FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calls"
  ON calls FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Emails table policies
CREATE POLICY "Users can read own emails"
  ON emails FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emails"
  ON emails FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emails"
  ON emails FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Suppliers table policies
CREATE POLICY "Users can read own suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Supplier contacts table policies
CREATE POLICY "Users can read own supplier contacts"
  ON supplier_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplier contacts"
  ON supplier_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplier contacts"
  ON supplier_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own supplier contacts"
  ON supplier_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Supplier orders table policies
CREATE POLICY "Users can read own supplier orders"
  ON supplier_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplier orders"
  ON supplier_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplier orders"
  ON supplier_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own supplier orders"
  ON supplier_orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Vessels table policies
CREATE POLICY "Users can read own vessels"
  ON vessels FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vessels"
  ON vessels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vessels"
  ON vessels FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vessels"
  ON vessels FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fuel deals table policies
CREATE POLICY "Users can read own fuel deals"
  ON fuel_deals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fuel deals"
  ON fuel_deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fuel deals"
  ON fuel_deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fuel deals"
  ON fuel_deals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tasks table policies
CREATE POLICY "Users can read own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User preferences table policies
CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notification settings table policies
CREATE POLICY "Users can read own notification settings"
  ON notification_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON notification_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification settings"
  ON notification_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);