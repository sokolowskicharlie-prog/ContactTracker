/*
  # Populate Major UK Port Coordinates

  1. Data Updates
    - Add coordinates for major UK ports
    - Covers key ports across all UK regions
  
  2. Important Notes
    - Coordinates are approximate center points
    - Uses decimal degrees format (WGS84)
    - Organized by region for clarity
*/

-- Scotland Ports
INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Aberdeen', id, 57.1497, -2.0943 FROM uk_regions WHERE name = 'Scotland'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Grangemouth', id, 56.0108, -3.7174 FROM uk_regions WHERE name = 'Scotland'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Leith', id, 55.9897, -3.1782 FROM uk_regions WHERE name = 'Scotland'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Dundee', id, 56.4620, -2.9707 FROM uk_regions WHERE name = 'Scotland'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- North East England Ports
INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Tees', id, 54.6186, -1.1575 FROM uk_regions WHERE name = 'North East England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Teesport', id, 54.6186, -1.1575 FROM uk_regions WHERE name = 'North East England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Newcastle', id, 54.9783, -1.6178 FROM uk_regions WHERE name = 'North East England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Sunderland', id, 54.9069, -1.3838 FROM uk_regions WHERE name = 'North East England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- North West England Ports
INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Liverpool', id, 53.4084, -2.9916 FROM uk_regions WHERE name = 'North West England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Manchester', id, 53.4808, -2.2426 FROM uk_regions WHERE name = 'North West England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Barrow', id, 54.1118, -3.2267 FROM uk_regions WHERE name = 'North West England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Yorkshire and the Humber Ports
INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Hull', id, 53.7457, -0.3367 FROM uk_regions WHERE name = 'Yorkshire and the Humber'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Immingham', id, 53.6129, -0.1892 FROM uk_regions WHERE name = 'Yorkshire and the Humber'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Grimsby', id, 53.5676, -0.0759 FROM uk_regions WHERE name = 'Yorkshire and the Humber'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- East of England Ports
INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Felixstowe', id, 51.9642, 1.3519 FROM uk_regions WHERE name = 'East of England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Harwich', id, 51.9462, 1.2882 FROM uk_regions WHERE name = 'East of England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Ipswich', id, 52.0594, 1.1556 FROM uk_regions WHERE name = 'East of England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Great Yarmouth', id, 52.6086, 1.7286 FROM uk_regions WHERE name = 'East of England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- London Ports
INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'London', id, 51.5074, -0.1278 FROM uk_regions WHERE name = 'London'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Tilbury', id, 51.4623, 0.3640 FROM uk_regions WHERE name = 'London'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- South East England Ports
INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Southampton', id, 50.9097, -1.4044 FROM uk_regions WHERE name = 'South East England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Portsmouth', id, 50.8198, -1.0880 FROM uk_regions WHERE name = 'South East England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Dover', id, 51.1279, 1.3134 FROM uk_regions WHERE name = 'South East England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Shoreham', id, 50.8303, -0.2431 FROM uk_regions WHERE name = 'South East England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- South West England Ports
INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Bristol', id, 51.4545, -2.5879 FROM uk_regions WHERE name = 'South West England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Plymouth', id, 50.3755, -4.1427 FROM uk_regions WHERE name = 'South West England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Falmouth', id, 50.1503, -5.0704 FROM uk_regions WHERE name = 'South West England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Poole', id, 50.7155, -1.9872 FROM uk_regions WHERE name = 'South West England'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Wales Ports
INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Milford Haven', id, 51.7131, -5.0415 FROM uk_regions WHERE name = 'Wales'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Port Talbot', id, 51.5889, -3.7836 FROM uk_regions WHERE name = 'Wales'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Cardiff', id, 51.4816, -3.1791 FROM uk_regions WHERE name = 'Wales'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Holyhead', id, 53.3099, -4.6334 FROM uk_regions WHERE name = 'Wales'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Northern Ireland Ports
INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Belfast', id, 54.5973, -5.9301 FROM uk_regions WHERE name = 'Northern Ireland'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Londonderry', id, 55.0067, -7.3186 FROM uk_regions WHERE name = 'Northern Ireland'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

INSERT INTO uk_port_regions (port_name, region_id, latitude, longitude) 
SELECT 'Larne', id, 54.8567, -5.8195 FROM uk_regions WHERE name = 'Northern Ireland'
ON CONFLICT (port_name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;
