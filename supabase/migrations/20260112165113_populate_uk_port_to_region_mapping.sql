/*
  # Populate UK Port to Region Mapping

  1. Changes
    - Map all common UK ports to their respective regions
    - Includes ports from Scotland, Wales, Northern Ireland, and all English regions
    
  2. Notes
    - This mapping is based on geographical location of ports
    - Ports are mapped case-insensitively for easier matching
    - Covers all major and minor UK ports commonly used in marine fuel supply
*/

-- Insert port mappings for Scotland
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('ABERDEEN'),
  ('INVERNESS'),
  ('KIRKCALDY'),
  ('GRANGEMOUTH'),
  ('GRANGEMOUTH (EX-PIPE)'),
  ('LEITH'),
  ('DUNDEE'),
  ('MONTROSE'),
  ('PETERHEAD'),
  ('AYR'),
  ('LERWICK'),
  ('BUCKIE'),
  ('METHIL'),
  ('GREENOCK'),
  ('CLYDE'),
  ('FORTH')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'Scotland'
ON CONFLICT (port_name) DO NOTHING;

-- Insert port mappings for Wales
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('CARDIFF'),
  ('SWANSEA'),
  ('MILFORD HAVEN'),
  ('NEWPORT'),
  ('HOLYHEAD'),
  ('BARRY'),
  ('PORT TALBOT'),
  ('PEMBROKE'),
  ('FISHGUARD')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'Wales'
ON CONFLICT (port_name) DO NOTHING;

-- Insert port mappings for Northern Ireland
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('BELFAST'),
  ('LONDONDERRY'),
  ('LARNE'),
  ('WARRENPOINT'),
  ('COLERAINE')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'Northern Ireland'
ON CONFLICT (port_name) DO NOTHING;

-- Insert port mappings for North East England
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('NEWCASTLE'),
  ('SUNDERLAND'),
  ('MIDDLESBROUGH'),
  ('TYNE'),
  ('BLYTH'),
  ('REDCAR'),
  ('TEESPORT'),
  ('TEESIDE'),
  ('HARTLEPOOL'),
  ('SEAHAM'),
  ('NORTH SHIELDS'),
  ('SOUTH SHIELDS')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'North East England'
ON CONFLICT (port_name) DO NOTHING;

-- Insert port mappings for North West England
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('LIVERPOOL'),
  ('MANCHESTER'),
  ('BARROW'),
  ('HEYSHAM'),
  ('PRESTON'),
  ('FLEETWOOD'),
  ('MERSEY'),
  ('ELLESMERE PORT'),
  ('RUNCORN'),
  ('GARSTON'),
  ('BIRKENHEAD'),
  ('WORKINGTON'),
  ('WHITEHAVEN')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'North West England'
ON CONFLICT (port_name) DO NOTHING;

-- Insert port mappings for Yorkshire and the Humber
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('HULL'),
  ('GRIMSBY'),
  ('IMMINGHAM'),
  ('GOOLE'),
  ('FLIXBOROUGH'),
  ('SCUNTHORPE'),
  ('KILLINGHOLME')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'Yorkshire and the Humber'
ON CONFLICT (port_name) DO NOTHING;

-- Insert port mappings for East Midlands
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('BOSTON'),
  ('SUTTON BRIDGE'),
  ('WISBECH')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'East Midlands'
ON CONFLICT (port_name) DO NOTHING;

-- Insert port mappings for East of England
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('IPSWICH'),
  ('GREAT YARMOUTH'),
  ('LOWESTOFT'),
  ('FELIXSTOWE'),
  ('HARWICH'),
  ('KINGS LYNN'),
  ('MISTLEY'),
  ('BRIGHTLINGSEA'),
  ('BRIGHLINGSEA'),
  ('COLCHESTER'),
  ('WELLS')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'East of England'
ON CONFLICT (port_name) DO NOTHING;

-- Insert port mappings for London
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('LONDON'),
  ('TILBURY'),
  ('DAGENHAM'),
  ('THAMES'),
  ('PURFLEET'),
  ('GRAVESEND')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'London'
ON CONFLICT (port_name) DO NOTHING;

-- Insert port mappings for South East England
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('SOUTHAMPTON'),
  ('PORTSMOUTH'),
  ('DOVER'),
  ('SHEERNESS'),
  ('ROCHESTER'),
  ('CHATHAM'),
  ('NEWHAVEN'),
  ('SHOREHAM'),
  ('RYE'),
  ('RIDHAM'),
  ('FAWLEY'),
  ('FAWLEY (SOUTHAMPTON)'),
  ('MEDWAY'),
  ('FOLKESTONE'),
  ('HASTINGS'),
  ('RAMSGATE'),
  ('MARGATE')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'South East England'
ON CONFLICT (port_name) DO NOTHING;

-- Insert port mappings for South West England
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('PLYMOUTH'),
  ('FALMOUTH'),
  ('POOLE'),
  ('AVONMOUTH'),
  ('BRISTOL'),
  ('TEIGNMOUTH'),
  ('EXETER'),
  ('FOWEY'),
  ('PAR'),
  ('TRURO'),
  ('PENZANCE'),
  ('NEWLYN'),
  ('DARTMOUTH'),
  ('TORQUAY'),
  ('WEYMOUTH'),
  ('PORTLAND'),
  ('BRIDGWATER'),
  ('PORTISHEAD'),
  ('SHARPNESS')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'South West England'
ON CONFLICT (port_name) DO NOTHING;

-- Insert additional regional variations
INSERT INTO uk_port_regions (port_name, region_id)
SELECT port, id FROM (VALUES
  ('SILOTH')
) AS ports(port)
CROSS JOIN uk_regions
WHERE uk_regions.name = 'North West England'
ON CONFLICT (port_name) DO NOTHING;
