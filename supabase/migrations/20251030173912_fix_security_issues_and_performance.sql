/*
  # Fix Security and Performance Issues

  This migration addresses multiple security and performance concerns identified in the database audit:

  ## 1. Foreign Key Indexes
  Adds indexes to foreign key columns that were missing them:
    - `fuel_deals.vessel_id`
    - `supplier_contacts.supplier_id`
    - `supplier_orders.supplier_id`
    - `tasks.contact_id`
    - `tasks.supplier_id`

  ## 2. RLS Policy Performance Optimization
  Updates all RLS policies to use `(select auth.uid())` instead of `auth.uid()` directly.
  This prevents re-evaluation of the auth function for each row, significantly improving query performance at scale.
  
  Affects policies on tables:
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

  ## 3. Remove Unused Indexes
  Drops indexes that have not been used:
    - idx_calls_user_id
    - idx_vessels_user_id
    - idx_tasks_user_id
    - idx_user_preferences_user_id

  ## 4. Security Note
  Leaked password protection should be enabled in Supabase Auth settings via the dashboard.
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_fuel_deals_vessel_id ON fuel_deals(vessel_id);
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier_id ON supplier_contacts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier_id ON supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_supplier_id ON tasks(supplier_id);

-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES - CONTACTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;

CREATE POLICY "Users can read own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 3. OPTIMIZE RLS POLICIES - CONTACT_PERSONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own contact persons" ON contact_persons;
DROP POLICY IF EXISTS "Users can insert own contact persons" ON contact_persons;
DROP POLICY IF EXISTS "Users can update own contact persons" ON contact_persons;
DROP POLICY IF EXISTS "Users can delete own contact persons" ON contact_persons;

CREATE POLICY "Users can read own contact persons"
  ON contact_persons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_persons.contact_id
      AND contacts.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own contact persons"
  ON contact_persons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_persons.contact_id
      AND contacts.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own contact persons"
  ON contact_persons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_persons.contact_id
      AND contacts.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_persons.contact_id
      AND contacts.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own contact persons"
  ON contact_persons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_persons.contact_id
      AND contacts.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 4. OPTIMIZE RLS POLICIES - CALLS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own calls" ON calls;
DROP POLICY IF EXISTS "Users can insert own calls" ON calls;
DROP POLICY IF EXISTS "Users can update own calls" ON calls;
DROP POLICY IF EXISTS "Users can delete own calls" ON calls;

CREATE POLICY "Users can read own calls"
  ON calls FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own calls"
  ON calls FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own calls"
  ON calls FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own calls"
  ON calls FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 5. OPTIMIZE RLS POLICIES - EMAILS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own emails" ON emails;
DROP POLICY IF EXISTS "Users can insert own emails" ON emails;
DROP POLICY IF EXISTS "Users can update own emails" ON emails;
DROP POLICY IF EXISTS "Users can delete own emails" ON emails;

CREATE POLICY "Users can read own emails"
  ON emails FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own emails"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own emails"
  ON emails FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own emails"
  ON emails FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 6. OPTIMIZE RLS POLICIES - SUPPLIERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can insert own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete own suppliers" ON suppliers;

CREATE POLICY "Users can read own suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 7. OPTIMIZE RLS POLICIES - SUPPLIER_CONTACTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own supplier contacts" ON supplier_contacts;
DROP POLICY IF EXISTS "Users can insert own supplier contacts" ON supplier_contacts;
DROP POLICY IF EXISTS "Users can update own supplier contacts" ON supplier_contacts;
DROP POLICY IF EXISTS "Users can delete own supplier contacts" ON supplier_contacts;

CREATE POLICY "Users can read own supplier contacts"
  ON supplier_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_contacts.supplier_id
      AND suppliers.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own supplier contacts"
  ON supplier_contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_contacts.supplier_id
      AND suppliers.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own supplier contacts"
  ON supplier_contacts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_contacts.supplier_id
      AND suppliers.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_contacts.supplier_id
      AND suppliers.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own supplier contacts"
  ON supplier_contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_contacts.supplier_id
      AND suppliers.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 8. OPTIMIZE RLS POLICIES - SUPPLIER_ORDERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own supplier orders" ON supplier_orders;
DROP POLICY IF EXISTS "Users can insert own supplier orders" ON supplier_orders;
DROP POLICY IF EXISTS "Users can update own supplier orders" ON supplier_orders;
DROP POLICY IF EXISTS "Users can delete own supplier orders" ON supplier_orders;

CREATE POLICY "Users can read own supplier orders"
  ON supplier_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_orders.supplier_id
      AND suppliers.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own supplier orders"
  ON supplier_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_orders.supplier_id
      AND suppliers.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own supplier orders"
  ON supplier_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_orders.supplier_id
      AND suppliers.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_orders.supplier_id
      AND suppliers.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own supplier orders"
  ON supplier_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_orders.supplier_id
      AND suppliers.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 9. OPTIMIZE RLS POLICIES - VESSELS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own vessels" ON vessels;
DROP POLICY IF EXISTS "Users can insert own vessels" ON vessels;
DROP POLICY IF EXISTS "Users can update own vessels" ON vessels;
DROP POLICY IF EXISTS "Users can delete own vessels" ON vessels;

CREATE POLICY "Users can read own vessels"
  ON vessels FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own vessels"
  ON vessels FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own vessels"
  ON vessels FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own vessels"
  ON vessels FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 10. OPTIMIZE RLS POLICIES - FUEL_DEALS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own fuel deals" ON fuel_deals;
DROP POLICY IF EXISTS "Users can insert own fuel deals" ON fuel_deals;
DROP POLICY IF EXISTS "Users can update own fuel deals" ON fuel_deals;
DROP POLICY IF EXISTS "Users can delete own fuel deals" ON fuel_deals;

CREATE POLICY "Users can read own fuel deals"
  ON fuel_deals FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own fuel deals"
  ON fuel_deals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own fuel deals"
  ON fuel_deals FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own fuel deals"
  ON fuel_deals FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 11. OPTIMIZE RLS POLICIES - TASKS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

CREATE POLICY "Users can read own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 12. OPTIMIZE RLS POLICIES - USER_PREFERENCES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;

CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 13. OPTIMIZE RLS POLICIES - NOTIFICATION_SETTINGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can delete own notification settings" ON notification_settings;

CREATE POLICY "Users can read own notification settings"
  ON notification_settings FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own notification settings"
  ON notification_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own notification settings"
  ON notification_settings FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 14. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_calls_user_id;
DROP INDEX IF EXISTS idx_vessels_user_id;
DROP INDEX IF EXISTS idx_tasks_user_id;
DROP INDEX IF EXISTS idx_user_preferences_user_id;