/*
  # Update Fuel Supplier Type to Supplier

  1. Changes
    - Updates all existing records with supplier_type 'Fuel Supplier' to 'Supplier'
    
  2. Notes
    - This is a data migration to simplify supplier type naming
    - Affects existing supplier records in the database
*/

UPDATE suppliers
SET supplier_type = 'Supplier'
WHERE supplier_type = 'Fuel Supplier';
