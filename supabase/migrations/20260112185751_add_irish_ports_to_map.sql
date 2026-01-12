/*
  # Add Irish Ports to Map

  1. New Region
    - Add "Republic of Ireland" to uk_regions table
    
  2. Irish Ports Added (18 ports from Republic of Ireland)
    - Major commercial ports: Dublin, Cork, Limerick, Waterford
    - Regional ports: Galway, Rosslare, Drogheda, New Ross
    - Specialized ports: Foynes, Ringaskiddy, Aughinish, Moneypoint
    - Smaller ports: Cobh, Dun Laoghaire, Howth, Greenore, Killybegs, Rushbrooke
    
  3. Coordinates
    - Uses approximate latitude/longitude for each port location
    - Enables ports to be displayed on the supplier map view
    
  Note: Warrenpoint is in Northern Ireland and already covered in previous migration
*/

-- Add Republic of Ireland region
INSERT INTO uk_regions (name) VALUES
  ('Republic of Ireland')
ON CONFLICT (name) DO NOTHING;

-- Get the Ireland region ID and insert ports
DO $$
DECLARE
  ireland_region_id uuid;
BEGIN
  SELECT id INTO ireland_region_id FROM uk_regions WHERE name = 'Republic of Ireland';
  
  -- Insert Irish ports with coordinates
  INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) VALUES
    ('DUBLIN', ireland_region_id, 53.3498, -6.2603),
    ('CORK', ireland_region_id, 51.8969, -8.4863),
    ('LIMERICK', ireland_region_id, 52.6638, -8.6267),
    ('WATERFORD', ireland_region_id, 52.2583, -7.1119),
    ('GALWAY', ireland_region_id, 53.2707, -9.0568),
    ('ROSSLARE', ireland_region_id, 52.2535, -6.3396),
    ('DROGHEDA', ireland_region_id, 53.7189, -6.3478),
    ('NEW ROSS', ireland_region_id, 52.3964, -6.9378),
    ('FOYNES', ireland_region_id, 52.6106, -9.1117),
    ('RINGASKIDDY', ireland_region_id, 51.8350, -8.3167),
    ('AUGHINISH', ireland_region_id, 52.6214, -9.0681),
    ('MONEYPOINT', ireland_region_id, 52.6147, -9.2814),
    ('COBH', ireland_region_id, 51.8503, -8.2944),
    ('DUN LAOGHAIRE', ireland_region_id, 53.2942, -6.1307),
    ('HOWTH', ireland_region_id, 53.3883, -6.0692),
    ('GREENORE', ireland_region_id, 54.0336, -6.1350),
    ('KILLYBEGS', ireland_region_id, 54.6340, -8.4481),
    ('RUSHBROOKE', ireland_region_id, 51.8567, -8.2897)
  ON CONFLICT (port_name) DO NOTHING;
END $$;
