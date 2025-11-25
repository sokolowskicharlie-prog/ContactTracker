/*
  # Update Timezones for Existing Contacts

  This migration automatically assigns timezones to all contacts that have a country but no timezone set.
  It maps country names (case-insensitive) to their appropriate IANA timezone identifiers.

  ## Changes
  - Updates contacts.timezone for all records where country is set but timezone is null
  - Supports various country name formats including full names and abbreviations
  - Maps 60+ countries to their corresponding timezones

  ## Coverage
  Major countries covered include:
  - European countries (UK, Greece, Switzerland, Netherlands, etc.)
  - Middle Eastern countries (UAE, Kuwait, Israel, etc.)
  - Asian countries (Singapore, Japan, Hong Kong, South Korea, etc.)
  - Americas (USA, Canada, Brazil, Panama, Bahamas, etc.)
  - African countries (Egypt, South Africa, Algeria, etc.)
  - Island nations (Malta, Cyprus, Mauritius, Bermuda, etc.)
*/

-- Update timezones based on country (case-insensitive matching)
UPDATE contacts SET timezone = 'Europe/London' WHERE UPPER(country) IN ('UNITED KINGDOM', 'UK', 'SCOTLAND', 'GIBRALTAR') AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Athens' WHERE UPPER(country) = 'GREECE' AND timezone IS NULL;
UPDATE contacts SET timezone = 'America/New_York' WHERE UPPER(country) IN ('UNITED STATES OF AMERICA', 'UNITED STATES', 'USA', 'US') AND timezone IS NULL;
UPDATE contacts SET timezone = 'Asia/Dubai' WHERE UPPER(country) IN ('UNITED ARAB EMIRATES', 'UAE') AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Zurich' WHERE UPPER(country) = 'SWITZERLAND' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Africa/Monrovia' WHERE UPPER(country) = 'LIBERIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Amsterdam' WHERE UPPER(country) IN ('NETHERLANDS', 'ROTTERDAM') AND timezone IS NULL;
UPDATE contacts SET timezone = 'Asia/Nicosia' WHERE UPPER(country) = 'CYPRUS' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Oslo' WHERE UPPER(country) = 'NORWAY' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Rome' WHERE UPPER(country) = 'ITALY' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Brussels' WHERE UPPER(country) = 'BELGIUM' AND timezone IS NULL;
UPDATE contacts SET timezone = 'America/Panama' WHERE UPPER(country) = 'PANAMA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Malta' WHERE UPPER(country) = 'MALTA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Dublin' WHERE UPPER(country) = 'IRELAND' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Madrid' WHERE UPPER(country) = 'SPAIN' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Paris' WHERE UPPER(country) = 'FRANCE' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Asia/Singapore' WHERE UPPER(country) = 'SINGAPORE' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Berlin' WHERE UPPER(country) = 'GERMANY' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Atlantic/Bermuda' WHERE UPPER(country) = 'BERMUDA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Istanbul' WHERE UPPER(country) = 'TURKEY' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Tallinn' WHERE UPPER(country) = 'ESTONIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Copenhagen' WHERE UPPER(country) = 'DENMARK' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Vilnius' WHERE UPPER(country) = 'LITHUANIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'America/Toronto' WHERE UPPER(country) = 'CANADA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'America/Nassau' WHERE UPPER(country) = 'BAHAMAS' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Vienna' WHERE UPPER(country) = 'AUSTRIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Asia/Hong_Kong' WHERE UPPER(country) = 'HONG KONG' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Sofia' WHERE UPPER(country) = 'BULGARIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'America/Tortola' WHERE UPPER(country) = 'BRITISH VIRGIN ISLANDS' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Ljubljana' WHERE UPPER(country) = 'SLOVENIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Stockholm' WHERE UPPER(country) = 'SWEDEN' AND timezone IS NULL;
UPDATE contacts SET timezone = 'America/Sao_Paulo' WHERE UPPER(country) = 'BRAZIL' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Zagreb' WHERE UPPER(country) = 'CROATIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Podgorica' WHERE UPPER(country) = 'MONTENEGRO' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Budapest' WHERE UPPER(country) = 'HUNGARY' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Vaduz' WHERE UPPER(country) = 'LIECHTENSTEIN' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Africa/Cairo' WHERE UPPER(country) = 'EGYPT' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Kiev' WHERE UPPER(country) = 'UKRAINE' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Africa/Algiers' WHERE UPPER(country) = 'ALGERIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Asia/Kuwait' WHERE UPPER(country) = 'KUWAIT' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Asia/Tokyo' WHERE UPPER(country) = 'JAPAN' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Minsk' WHERE UPPER(country) = 'BELARUS' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Riga' WHERE UPPER(country) = 'LATVIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Monaco' WHERE UPPER(country) = 'MONACO' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Asia/Jerusalem' WHERE UPPER(country) = 'ISRAEL' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Lisbon' WHERE UPPER(country) = 'PORTUGAL' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Africa/Johannesburg' WHERE UPPER(country) = 'SOUTH AFRICA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'America/Barbados' WHERE UPPER(country) = 'BARBADOS' AND timezone IS NULL;
UPDATE contacts SET timezone = 'America/Santiago' WHERE UPPER(country) = 'CHILE' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Indian/Mauritius' WHERE UPPER(country) = 'MAURITIUS' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Warsaw' WHERE UPPER(country) = 'POLAND' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Asia/Amman' WHERE UPPER(country) = 'JORDAN' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Helsinki' WHERE UPPER(country) = 'FINLAND' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Australia/Sydney' WHERE UPPER(country) = 'AUSTRALIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Asia/Seoul' WHERE UPPER(country) = 'SOUTH KOREA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Bucharest' WHERE UPPER(country) = 'ROMANIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Moscow' WHERE UPPER(country) = 'RUSSIA' AND timezone IS NULL;
UPDATE contacts SET timezone = 'Europe/Tirane' WHERE UPPER(country) = 'ALBANIA' AND timezone IS NULL;
