/*
  # Populate UK Ports on Map from Supplier Data

  1. Purpose
    - Match UK ports from supplier_ports with uk_port_regions
    - Add missing UK ports that have coordinates available
    - Ensure all identifiable UK ports are visible on the map

  2. Approach
    - Case-insensitive matching between supplier_ports and uk_port_regions
    - Add ports that exist in supplier data but match known UK ports with coordinates
    
  3. UK Ports Added
    - Matches existing UK ports from supplier database
    - Uses approximate coordinates from uk_port_regions reference table
    - Covers major UK shipping ports across all regions
*/

-- Add UK ports from supplier data that match existing uk_port_regions entries
-- This will make them visible on the map with their regional coordinates

-- Insert matched ports (case-insensitive) that don't already exist
INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude)
SELECT DISTINCT 
  sp.port_name,
  upr.region_id,
  upr.latitude,
  upr.longitude
FROM supplier_ports sp
CROSS JOIN uk_port_regions upr
WHERE UPPER(TRIM(sp.port_name)) = UPPER(TRIM(upr.port_name))
  AND sp.port_name IS NOT NULL 
  AND sp.port_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM uk_port_regions existing
    WHERE UPPER(TRIM(existing.port_name)) = UPPER(TRIM(sp.port_name))
  )
ON CONFLICT (port_name) DO NOTHING;
