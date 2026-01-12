/*
  # Fix supplier_ports parsing to use semicolons

  1. Changes
    - Delete any port entries that contain semicolons (these are malformed full strings)
    - Re-parse the ports field from suppliers table using semicolons as separators
    - Create supplier_ports entries for each port listed
    - Set has_truck = true and has_lsmgo = true for all auto-created ports

  2. Notes
    - Ports field uses semicolons, not commas as separators
    - This fixes the previous migration that incorrectly used comma splitting
*/

-- First, delete any port entries that contain semicolons (these are the full unparsed strings)
DELETE FROM supplier_ports WHERE port_name LIKE '%;%';

-- Now properly parse and insert ports using semicolons
DO $$
DECLARE
  supplier_record RECORD;
  port_name_text TEXT;
  port_names TEXT[];
BEGIN
  FOR supplier_record IN 
    SELECT id, ports 
    FROM suppliers 
    WHERE ports IS NOT NULL AND ports != ''
  LOOP
    -- Split on semicolons instead of commas
    port_names := string_to_array(supplier_record.ports, ';');
    
    FOREACH port_name_text IN ARRAY port_names
    LOOP
      port_name_text := trim(port_name_text);
      
      -- Only insert if not empty and doesn't already exist
      IF port_name_text != '' THEN
        INSERT INTO supplier_ports (
          supplier_id,
          port_name,
          has_truck,
          has_lsmgo,
          has_barge,
          has_expipe,
          has_vlsfo
        )
        VALUES (
          supplier_record.id,
          port_name_text,
          true,
          true,
          false,
          false,
          false
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;
