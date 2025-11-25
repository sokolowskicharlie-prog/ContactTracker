/*
  # Remove Unused Indexes and Fix Security Issues

  1. Security Improvements
    - Remove all unused indexes that are not being utilized by queries
    - Fix function search_path vulnerability by setting explicit search_path

  2. Indexes Removed
    - `idx_fuel_deals_vessel_id` on `fuel_deals` table
    - `idx_tasks_completed` on `tasks` table
    - `idx_suppliers_type` on `suppliers` table
    - `idx_supplier_orders_supplier_id` on `supplier_orders` table
    - `idx_supplier_contacts_supplier_id` on `supplier_contacts` table
    - `idx_supplier_contacts_primary` on `supplier_contacts` table
    - `idx_tasks_contact_id` on `tasks` table
    - `idx_tasks_supplier_id` on `tasks` table
    - `idx_tasks_due_date` on `tasks` table
    - `idx_contacts_country` on `contacts` table
    - `idx_contacts_timezone` on `contacts` table
    - `idx_vessels_imo_number` on `vessels` table

  3. Function Security
    - Update `update_updated_at_column` function with immutable search_path

  Notes:
    - Unused indexes consume storage space and slow down write operations
    - Removing them improves database performance
    - The function search_path fix prevents potential security vulnerabilities
*/

-- Drop unused indexes if they exist
DROP INDEX IF EXISTS idx_fuel_deals_vessel_id;
DROP INDEX IF EXISTS idx_tasks_completed;
DROP INDEX IF EXISTS idx_suppliers_type;
DROP INDEX IF EXISTS idx_supplier_orders_supplier_id;
DROP INDEX IF EXISTS idx_supplier_contacts_supplier_id;
DROP INDEX IF EXISTS idx_supplier_contacts_primary;
DROP INDEX IF EXISTS idx_tasks_contact_id;
DROP INDEX IF EXISTS idx_tasks_supplier_id;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_contacts_country;
DROP INDEX IF EXISTS idx_contacts_timezone;
DROP INDEX IF EXISTS idx_vessels_imo_number;

-- Recreate the update_updated_at_column function with explicit search_path
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Reattach triggers if they existed
DO $$
BEGIN
  -- Check and recreate trigger for contacts table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'contacts'
  ) THEN
    DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
    CREATE TRIGGER update_contacts_updated_at
      BEFORE UPDATE ON contacts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Check and recreate trigger for suppliers table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'suppliers'
  ) THEN
    DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
    CREATE TRIGGER update_suppliers_updated_at
      BEFORE UPDATE ON suppliers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Check and recreate trigger for tasks table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tasks'
  ) THEN
    DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Check and recreate trigger for notification_settings table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_settings'
  ) THEN
    DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
    CREATE TRIGGER update_notification_settings_updated_at
      BEFORE UPDATE ON notification_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
