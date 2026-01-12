/*
  # Add Business Classification to Suppliers

  1. Changes
    - Add `business_classification` column to `suppliers` table
      - Allows marking suppliers as "Trader", "Supplier", or "Trader/Supplier"
      - Optional field with default value of null

  2. Notes
    - This is separate from `supplier_type` which categorizes by products/services
    - `business_classification` categorizes by business model
*/

-- Add business_classification column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'business_classification'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN business_classification text;
  END IF;
END $$;