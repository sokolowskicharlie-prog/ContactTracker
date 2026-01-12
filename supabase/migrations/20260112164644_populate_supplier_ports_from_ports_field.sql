/*
  # Populate supplier_ports from existing ports field

  1. Changes
    - Parse the comma-separated `ports` field from suppliers table
    - Create supplier_ports entries for each port listed
    - Set has_truck = true and has_lsmgo = true for all auto-created ports
    - Only create entries for ports that don't already exist

  2. Notes
    - This migration handles existing data where suppliers have ports listed in the text field
    - but don't have corresponding structured entries in supplier_ports
    - The ports field remains as a reference, but detailed port info moves to supplier_ports
*/

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
    port_names := string_to_array(supplier_record.ports, ',');
    
    FOREACH port_name_text IN ARRAY port_names
    LOOP
      port_name_text := trim(port_name_text);
      
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
