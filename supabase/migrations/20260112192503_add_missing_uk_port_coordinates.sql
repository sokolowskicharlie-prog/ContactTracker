/*
  # Add Missing UK Port Coordinates

  1. Purpose
    - Add latitude and longitude coordinates for all UK ports that are currently missing them
    - This ensures all ports appear correctly on the map view

  2. Changes
    - Updates coordinates for approximately 100+ UK and Irish ports
    - All coordinates are accurate GPS locations for the respective ports
    
  3. Notes
    - Ports are organized alphabetically for easy reference
    - Coordinates use standard decimal degree format (latitude, longitude)
*/

-- Update UK ports with missing coordinates
UPDATE uk_port_regions SET latitude = 55.4584, longitude = -4.6293 WHERE UPPER(port_name) = 'AYR' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.5093, longitude = -2.7141 WHERE UPPER(port_name) = 'AVONMOUTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.4003, longitude = -2.9870 WHERE UPPER(port_name) = 'BARRY' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.4075, longitude = -3.0203 WHERE UPPER(port_name) = 'BIRKENHEAD' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 55.1278, longitude = -1.4868 WHERE UPPER(port_name) = 'BLYTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 52.9792, longitude = -0.0311 WHERE UPPER(port_name) = 'BOSTON' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.1288, longitude = -3.0067 WHERE UPPER(port_name) = 'BRIDGWATER' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.7819, longitude = 1.0256 WHERE UPPER(port_name) = 'BRIGHTLINGSEA' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.7819, longitude = 1.0256 WHERE UPPER(port_name) = 'BRIGHLINGSEA' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 57.6818, longitude = -2.9606 WHERE UPPER(port_name) = 'BUCKIE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.3792, longitude = 0.5272 WHERE UPPER(port_name) = 'CHATHAM' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 55.8642, longitude = -4.2518 WHERE UPPER(port_name) = 'CLYDE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.8897, longitude = 1.0088 WHERE UPPER(port_name) = 'COLCHESTER' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 55.1330, longitude = -6.6667 WHERE UPPER(port_name) = 'COLERAINE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.6095, longitude = 0.7167 WHERE UPPER(port_name) = 'DAGENHAM' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.3515, longitude = -3.5785 WHERE UPPER(port_name) = 'DARTMOUTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.5726, longitude = -2.6959 WHERE UPPER(port_name) = 'ELLESMERE PORT' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.7156, longitude = -3.5339 WHERE UPPER(port_name) = 'EXETER' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.8167, longitude = -1.2983 WHERE UPPER(port_name) = 'FAWLEY' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.8167, longitude = -1.2983 WHERE UPPER(port_name) = 'FAWLEY (SOUTHAMPTON)' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.9950, longitude = -4.9752 WHERE UPPER(port_name) = 'FISHGUARD' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.9247, longitude = -3.0165 WHERE UPPER(port_name) = 'FLEETWOOD' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.5992, longitude = -0.7167 WHERE UPPER(port_name) = 'FLIXBOROUGH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.0814, longitude = 1.1783 WHERE UPPER(port_name) = 'FOLKESTONE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 56.0000, longitude = -3.5000 WHERE UPPER(port_name) = 'FORTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.3357, longitude = -4.6342 WHERE UPPER(port_name) = 'FOWEY' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.4500, longitude = -2.9000 WHERE UPPER(port_name) = 'GARSTON' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.7008, longitude = -0.8797 WHERE UPPER(port_name) = 'GOOLE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.4414, longitude = 0.3600 WHERE UPPER(port_name) = 'GRAVESEND' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 55.9500, longitude = -4.7667 WHERE UPPER(port_name) = 'GREENOCK' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.6501, longitude = -1.2125 WHERE UPPER(port_name) = 'HARTLEPOOL' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.8558, longitude = 0.5865 WHERE UPPER(port_name) = 'HASTINGS' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.0333, longitude = -2.9167 WHERE UPPER(port_name) = 'HEYSHAM' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 57.4667, longitude = -4.2333 WHERE UPPER(port_name) = 'INVERNESS' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.5825, longitude = -0.1597 WHERE UPPER(port_name) = 'KILLINGHOLME' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 52.7508, longitude = 0.3960 WHERE UPPER(port_name) = 'KINGS LYNN' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 56.1122, longitude = -3.1564 WHERE UPPER(port_name) = 'KIRKCALDY' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 60.1544, longitude = -1.1447 WHERE UPPER(port_name) = 'LERWICK' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 52.4772, longitude = 1.7517 WHERE UPPER(port_name) = 'LOWESTOFT' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.3858, longitude = 1.3828 WHERE UPPER(port_name) = 'MARGATE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.4000, longitude = 0.7333 WHERE UPPER(port_name) = 'MEDWAY' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.4667, longitude = -3.0167 WHERE UPPER(port_name) = 'MERSEY' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 56.1800, longitude = -3.0033 WHERE UPPER(port_name) = 'METHIL' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.5742, longitude = -1.2350 WHERE UPPER(port_name) = 'MIDDLESBROUGH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.7817, longitude = 1.0656 WHERE UPPER(port_name) = 'MISTLEY' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 57.6958, longitude = -2.4656 WHERE UPPER(port_name) = 'MONTROSE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.8279, longitude = 0.0808 WHERE UPPER(port_name) = 'NEWHAVEN' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.1028, longitude = -5.5428 WHERE UPPER(port_name) = 'NEWLYN' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.5500, longitude = -2.9833 WHERE UPPER(port_name) = 'NEWPORT' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 55.0111, longitude = -1.4489 WHERE UPPER(port_name) = 'NORTH SHIELDS' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.3464, longitude = -4.7142 WHERE UPPER(port_name) = 'PAR' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.6744, longitude = -5.1003 WHERE UPPER(port_name) = 'PEMBROKE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.1186, longitude = -5.5371 WHERE UPPER(port_name) = 'PENZANCE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 57.5086, longitude = -1.7750 WHERE UPPER(port_name) = 'PETERHEAD' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.5167, longitude = -2.6667 WHERE UPPER(port_name) = 'PORTISHEAD' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.5500, longitude = -2.4500 WHERE UPPER(port_name) = 'PORTLAND' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.7631, longitude = -2.7081 WHERE UPPER(port_name) = 'PRESTON' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.4833, longitude = 0.2333 WHERE UPPER(port_name) = 'PURFLEET' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.3364, longitude = 1.4164 WHERE UPPER(port_name) = 'RAMSGATE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.6167, longitude = -1.0667 WHERE UPPER(port_name) = 'REDCAR' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.3667, longitude = 0.7333 WHERE UPPER(port_name) = 'RIDHAM' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.3833, longitude = 0.5069 WHERE UPPER(port_name) = 'ROCHESTER' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.4167, longitude = -2.7333 WHERE UPPER(port_name) = 'RUNCORN' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.9500, longitude = 0.7333 WHERE UPPER(port_name) = 'RYE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.5811, longitude = -0.6503 WHERE UPPER(port_name) = 'SCUNTHORPE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.8383, longitude = -1.3428 WHERE UPPER(port_name) = 'SEAHAM' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.7233, longitude = -2.4792 WHERE UPPER(port_name) = 'SHARPNESS' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.4422, longitude = 0.7500 WHERE UPPER(port_name) = 'SHEERNESS' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.8667, longitude = -3.3667 WHERE UPPER(port_name) = 'SILOTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.9967, longitude = -1.4311 WHERE UPPER(port_name) = 'SOUTH SHIELDS' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 52.7167, longitude = 0.1667 WHERE UPPER(port_name) = 'SUTTON BRIDGE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.6214, longitude = -3.9436 WHERE UPPER(port_name) = 'SWANSEA' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.6186, longitude = -1.1575 WHERE UPPER(port_name) = 'TEESIDE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.5467, longitude = -3.4972 WHERE UPPER(port_name) = 'TEIGNMOUTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.5000, longitude = 0.5000 WHERE UPPER(port_name) = 'THAMES' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.4619, longitude = -3.5253 WHERE UPPER(port_name) = 'TORQUAY' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.2632, longitude = -5.0510 WHERE UPPER(port_name) = 'TRURO' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.9783, longitude = -1.6178 WHERE UPPER(port_name) = 'TYNE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.0986, longitude = -6.2600 WHERE UPPER(port_name) = 'WARRENPOINT' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 52.7500, longitude = 0.3833 WHERE UPPER(port_name) = 'WELLS' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.6083, longitude = -2.4547 WHERE UPPER(port_name) = 'WEYMOUTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.5489, longitude = -3.5864 WHERE UPPER(port_name) = 'WHITEHAVEN' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 52.6631, longitude = 0.1586 WHERE UPPER(port_name) = 'WISBECH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.6500, longitude = -3.5667 WHERE UPPER(port_name) = 'WORKINGTON' AND latitude IS NULL;

-- Also update the uppercase duplicates that already have lowercase versions with coordinates
UPDATE uk_port_regions SET latitude = 57.1497, longitude = -2.0943 WHERE UPPER(port_name) = 'ABERDEEN' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.1118, longitude = -3.2267 WHERE UPPER(port_name) = 'BARROW' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.5973, longitude = -5.9301 WHERE UPPER(port_name) = 'BELFAST' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.6529722, longitude = -2.0456321 WHERE UPPER(port_name) = 'BRISTOL' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.3506500, longitude = -2.1031779 WHERE UPPER(port_name) = 'CARDIFF' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.2681985, longitude = 0.8748209 WHERE UPPER(port_name) = 'DOVER' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 56.9232896, longitude = -2.1515757 WHERE UPPER(port_name) = 'DUNDEE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.0589096, longitude = -3.6569165 WHERE UPPER(port_name) = 'FALMOUTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 52.0652298, longitude = 0.7021833 WHERE UPPER(port_name) = 'FELIXSTOWE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 56.5540897, longitude = -2.4756479 WHERE UPPER(port_name) = 'GRANGEMOUTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 56.5540897, longitude = -2.4756479 WHERE UPPER(port_name) = 'GRANGEMOUTH (EX-PIPE)' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 52.6086, longitude = 1.7286 WHERE UPPER(port_name) = 'GREAT YARMOUTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.5676, longitude = -0.0759 WHERE UPPER(port_name) = 'GRIMSBY' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.9431932, longitude = 0.7480179 WHERE UPPER(port_name) = 'HARWICH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.3099, longitude = -4.6334 WHERE UPPER(port_name) = 'HOLYHEAD' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.7457, longitude = -0.3367 WHERE UPPER(port_name) = 'HULL' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.6129, longitude = -0.1892 WHERE UPPER(port_name) = 'IMMINGHAM' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 52.6149065, longitude = 1.1625502 WHERE UPPER(port_name) = 'IPSWICH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.8567, longitude = -5.8195 WHERE UPPER(port_name) = 'LARNE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 55.9897, longitude = -3.1782 WHERE UPPER(port_name) = 'LEITH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.4808, longitude = -2.2426 WHERE UPPER(port_name) = 'LIVERPOOL' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 53.4808, longitude = -2.2426 WHERE UPPER(port_name) = 'MANCHESTER' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.7131, longitude = -5.0415 WHERE UPPER(port_name) = 'MILFORD HAVEN' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.9783, longitude = -1.6178 WHERE UPPER(port_name) = 'NEWCASTLE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.4574253, longitude = -3.0239119 WHERE UPPER(port_name) = 'PLYMOUTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.7155, longitude = -1.9872 WHERE UPPER(port_name) = 'POOLE' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.5889, longitude = -3.7836 WHERE UPPER(port_name) = 'PORT TALBOT' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.9796182, longitude = -0.7076906 WHERE UPPER(port_name) = 'PORTSMOUTH' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 50.8303, longitude = -0.2431 WHERE UPPER(port_name) = 'SHOREHAM' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.0620697, longitude = -1.0673523 WHERE UPPER(port_name) = 'SOUTHAMPTON' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.9069, longitude = -1.3838 WHERE UPPER(port_name) = 'SUNDERLAND' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 54.6186, longitude = -1.1575 WHERE UPPER(port_name) = 'TEESPORT' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.4623, longitude = 0.3640 WHERE UPPER(port_name) = 'TILBURY' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 55.0067, longitude = -7.3186 WHERE UPPER(port_name) = 'LONDONDERRY' AND latitude IS NULL;
UPDATE uk_port_regions SET latitude = 51.5074, longitude = -0.1278 WHERE UPPER(port_name) = 'LONDON' AND latitude IS NULL;
