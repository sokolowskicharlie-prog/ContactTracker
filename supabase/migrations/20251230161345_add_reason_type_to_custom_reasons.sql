/*
  # Add reason type to custom reasons table

  1. Changes
    - Add `reason_type` column to `custom_jammed_reasons` table to support 'jammed', 'traction', and 'client' reasons
    - Add check constraint to ensure reason_type is one of the valid values
    - Update indexes to include reason_type for efficient filtering

  2. Notes
    - Existing jammed reasons will default to 'jammed' type
    - This allows the same table to store custom reasons for all status types
*/

-- Add reason_type column with default value 'jammed'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_jammed_reasons' AND column_name = 'reason_type'
  ) THEN
    ALTER TABLE custom_jammed_reasons ADD COLUMN reason_type text DEFAULT 'jammed' NOT NULL;
  END IF;
END $$;

-- Add check constraint to ensure valid reason types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_reason_type'
  ) THEN
    ALTER TABLE custom_jammed_reasons
    ADD CONSTRAINT valid_reason_type CHECK (reason_type IN ('jammed', 'traction', 'client'));
  END IF;
END $$;

-- Drop old index and create new composite index with reason_type
DROP INDEX IF EXISTS idx_custom_jammed_reasons_user_order;

CREATE INDEX IF NOT EXISTS idx_custom_reasons_user_type_order 
  ON custom_jammed_reasons(user_id, reason_type, display_order);