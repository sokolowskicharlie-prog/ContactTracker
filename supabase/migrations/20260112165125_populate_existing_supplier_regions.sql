/*
  # Populate Regions for Existing Suppliers

  1. Changes
    - Runs the auto-assignment logic for all existing suppliers
    - Matches their ports against uk_port_regions
    - Assigns appropriate regions to each supplier
    
  2. Notes
    - One-time data migration for existing suppliers
    - Future assignments will be handled automatically by triggers
*/

-- Populate regions for all existing suppliers based on their ports
INSERT INTO supplier_regions (supplier_id, region_id)
SELECT DISTINCT
  sp.supplier_id,
  upr.region_id
FROM supplier_ports sp
JOIN uk_port_regions upr ON UPPER(sp.port_name) = UPPER(upr.port_name)
ON CONFLICT (supplier_id, region_id) DO NOTHING;
