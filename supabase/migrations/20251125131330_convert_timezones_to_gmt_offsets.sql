/*
  # Convert Timezones to GMT Offsets

  This migration converts all existing IANA timezone identifiers (e.g., "Europe/London", "Asia/Dubai")
  to simple GMT offset format (e.g., "GMT+0", "GMT+4").

  ## Changes
  - Updates all contacts.timezone values from IANA format to GMT offset format
  - Covers all major timezones used in the application
  - Maintains accurate timezone offset information for each region

  ## Note
  Standard time offsets are used (not accounting for daylight saving time variations)
*/

-- Europe
UPDATE contacts SET timezone = 'GMT+0' WHERE timezone IN ('Europe/London', 'Europe/Lisbon', 'Europe/Dublin', 'Atlantic/Reykjavik');
UPDATE contacts SET timezone = 'GMT+1' WHERE timezone IN ('Europe/Berlin', 'Europe/Paris', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Zurich', 'Europe/Vienna', 'Europe/Stockholm', 'Europe/Oslo', 'Europe/Copenhagen', 'Europe/Warsaw', 'Europe/Prague', 'Africa/Lagos', 'Europe/Belgrade', 'Europe/Budapest', 'Europe/Ljubljana', 'Europe/Zagreb');
UPDATE contacts SET timezone = 'GMT+2' WHERE timezone IN ('Europe/Athens', 'Europe/Helsinki', 'Europe/Bucharest', 'Europe/Sofia', 'Africa/Cairo', 'Africa/Johannesburg', 'Asia/Jerusalem', 'Europe/Tallinn', 'Europe/Riga', 'Europe/Vilnius', 'Asia/Nicosia', 'Europe/Kiev');
UPDATE contacts SET timezone = 'GMT+3' WHERE timezone IN ('Europe/Moscow', 'Asia/Riyadh', 'Africa/Nairobi', 'Europe/Istanbul', 'Asia/Kuwait', 'Europe/Minsk', 'Asia/Baghdad', 'Europe/Podgorica', 'Europe/Tirane');

-- Asia
UPDATE contacts SET timezone = 'GMT+4' WHERE timezone = 'Asia/Dubai';
UPDATE contacts SET timezone = 'GMT+5:30' WHERE timezone = 'Asia/Kolkata';
UPDATE contacts SET timezone = 'GMT+7' WHERE timezone IN ('Asia/Bangkok', 'Asia/Jakarta', 'Asia/Ho_Chi_Minh');
UPDATE contacts SET timezone = 'GMT+8' WHERE timezone IN ('Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Kuala_Lumpur', 'Asia/Manila');
UPDATE contacts SET timezone = 'GMT+9' WHERE timezone IN ('Asia/Tokyo', 'Asia/Seoul');

-- Americas
UPDATE contacts SET timezone = 'GMT-5' WHERE timezone IN ('America/New_York', 'America/Toronto', 'America/Bogota', 'America/Lima');
UPDATE contacts SET timezone = 'GMT-6' WHERE timezone = 'America/Mexico_City';
UPDATE contacts SET timezone = 'GMT-4' WHERE timezone IN ('America/Halifax', 'Atlantic/Bermuda', 'America/Barbados', 'America/Tortola');
UPDATE contacts SET timezone = 'GMT-3' WHERE timezone IN ('America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'America/Santiago');

-- Africa
UPDATE contacts SET timezone = 'GMT+0' WHERE timezone = 'Africa/Monrovia';
UPDATE contacts SET timezone = 'GMT+1' WHERE timezone = 'Africa/Algiers';
UPDATE contacts SET timezone = 'GMT+2' WHERE timezone IN ('Africa/Maputo', 'Europe/Malta');

-- Pacific & Oceania
UPDATE contacts SET timezone = 'GMT+10' WHERE timezone = 'Australia/Sydney';
UPDATE contacts SET timezone = 'GMT+12' WHERE timezone = 'Pacific/Auckland';

-- Special Cases & Caribbean
UPDATE contacts SET timezone = 'GMT-5' WHERE timezone = 'America/Panama';
UPDATE contacts SET timezone = 'GMT-4' WHERE timezone = 'America/Nassau';
UPDATE contacts SET timezone = 'GMT+1' WHERE timezone IN ('Europe/Monaco', 'Europe/Vaduz');
UPDATE contacts SET timezone = 'GMT+2' WHERE timezone = 'Asia/Amman';
UPDATE contacts SET timezone = 'GMT+4' WHERE timezone = 'Indian/Mauritius';
UPDATE contacts SET timezone = 'GMT+1' WHERE timezone = 'Europe/Gibraltar';
