/*
  # Set Business Classification Based on Supplier Type

  1. Changes
    - Sets business_classification to 'Supplier' for all records with supplier_type = 'Supplier'
    - Sets business_classification to 'Trader' for all records where supplier_type is not 'Supplier'
    
  2. Notes
    - This ensures all suppliers have appropriate business classifications
    - Records with supplier_type = 'Supplier' are classified as business 'Supplier'
    - All other records (other types or null) are classified as business 'Trader'
*/

UPDATE suppliers
SET business_classification = 'Supplier'
WHERE supplier_type = 'Supplier' AND (business_classification IS NULL OR business_classification != 'Supplier');

UPDATE suppliers
SET business_classification = 'Trader'
WHERE (supplier_type IS NULL OR supplier_type != 'Supplier') AND (business_classification IS NULL OR business_classification != 'Trader');
