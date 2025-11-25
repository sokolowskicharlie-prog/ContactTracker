/*
  # Remove insecure public access policies

  1. Security Issue
    - Currently, there are overly permissive "public" policies that allow anyone to access all data
    - These policies use USING (true) which grants unrestricted access
    - This violates the principle of least privilege and data isolation

  2. Changes
    - Drop all "Allow public" policies across all tables
    - Keep only the authenticated user policies that properly check auth.uid() = user_id
    - This ensures each user can ONLY see their own data

  3. Tables affected
    - contacts
    - calls
    - emails
    - contact_persons
    - vessels
    - fuel_deals
    - suppliers
    - supplier_contacts
    - supplier_orders
    - tasks
    - user_preferences
    - notification_settings

  4. Security Impact
    - After this migration, unauthenticated users will have NO access
    - Authenticated users will ONLY see their own data
    - This properly isolates data between users
*/

-- Drop all insecure public policies
DROP POLICY IF EXISTS "Allow public read access to contacts" ON contacts;
DROP POLICY IF EXISTS "Allow public insert access to contacts" ON contacts;
DROP POLICY IF EXISTS "Allow public update access to contacts" ON contacts;
DROP POLICY IF EXISTS "Allow public delete access to contacts" ON contacts;

DROP POLICY IF EXISTS "Allow public read access to calls" ON calls;
DROP POLICY IF EXISTS "Allow public insert access to calls" ON calls;
DROP POLICY IF EXISTS "Allow public update access to calls" ON calls;
DROP POLICY IF EXISTS "Allow public delete access to calls" ON calls;

DROP POLICY IF EXISTS "Allow public read access to emails" ON emails;
DROP POLICY IF EXISTS "Allow public insert access to emails" ON emails;
DROP POLICY IF EXISTS "Allow public update access to emails" ON emails;
DROP POLICY IF EXISTS "Allow public delete access to emails" ON emails;

DROP POLICY IF EXISTS "Allow public read access to contact_persons" ON contact_persons;
DROP POLICY IF EXISTS "Allow public insert access to contact_persons" ON contact_persons;
DROP POLICY IF EXISTS "Allow public update access to contact_persons" ON contact_persons;
DROP POLICY IF EXISTS "Allow public delete access to contact_persons" ON contact_persons;

DROP POLICY IF EXISTS "Allow public read access to vessels" ON vessels;
DROP POLICY IF EXISTS "Allow public insert access to vessels" ON vessels;
DROP POLICY IF EXISTS "Allow public update access to vessels" ON vessels;
DROP POLICY IF EXISTS "Allow public delete access to vessels" ON vessels;

DROP POLICY IF EXISTS "Allow public read access to fuel_deals" ON fuel_deals;
DROP POLICY IF EXISTS "Allow public insert access to fuel_deals" ON fuel_deals;
DROP POLICY IF EXISTS "Allow public update access to fuel_deals" ON fuel_deals;
DROP POLICY IF EXISTS "Allow public delete access to fuel_deals" ON fuel_deals;

DROP POLICY IF EXISTS "Allow public read access to suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow public insert access to suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow public update access to suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow public delete access to suppliers" ON suppliers;

DROP POLICY IF EXISTS "Allow public read access to supplier_contacts" ON supplier_contacts;
DROP POLICY IF EXISTS "Allow public insert access to supplier_contacts" ON supplier_contacts;
DROP POLICY IF EXISTS "Allow public update access to supplier_contacts" ON supplier_contacts;
DROP POLICY IF EXISTS "Allow public delete access to supplier_contacts" ON supplier_contacts;

DROP POLICY IF EXISTS "Allow public read access to supplier_orders" ON supplier_orders;
DROP POLICY IF EXISTS "Allow public insert access to supplier_orders" ON supplier_orders;
DROP POLICY IF EXISTS "Allow public update access to supplier_orders" ON supplier_orders;
DROP POLICY IF EXISTS "Allow public delete access to supplier_orders" ON supplier_orders;

DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;

DROP POLICY IF EXISTS "Anyone can read preferences" ON user_preferences;
DROP POLICY IF EXISTS "Anyone can insert preferences" ON user_preferences;
DROP POLICY IF EXISTS "Anyone can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Anyone can delete own preferences" ON user_preferences;

DROP POLICY IF EXISTS "Allow public read access to notification_settings" ON notification_settings;
DROP POLICY IF EXISTS "Allow public insert access to notification_settings" ON notification_settings;
DROP POLICY IF EXISTS "Allow public update access to notification_settings" ON notification_settings;
DROP POLICY IF EXISTS "Allow public delete access to notification_settings" ON notification_settings;