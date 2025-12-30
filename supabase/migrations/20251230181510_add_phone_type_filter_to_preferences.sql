/*
  # Add Phone Type and Priority to Visible Filters

  1. Changes
    - Update default visible_filters to include 'phoneType' and 'priority'
    - Update existing user preferences to include these new filter options

  2. Details
    - Phone Type filter allows filtering contacts by phone types (WhatsApp, Mobile, WeChat, Office, General)
    - Searches both main contact phone_type and contact persons' phone_type/mobile_type
    - Priority filter already exists in UI but was missing from default visible_filters
*/

-- Update the default for visible_filters to include phoneType and priority
ALTER TABLE user_preferences 
ALTER COLUMN visible_filters 
SET DEFAULT '{
  "name": true,
  "company": true,
  "companySize": true,
  "email": true,
  "phone": true,
  "phoneType": true,
  "city": true,
  "postCode": true,
  "website": true,
  "address": true,
  "country": true,
  "timezone": true,
  "priority": true
}'::jsonb;

-- Update existing users' visible_filters to include phoneType and priority if not already present
UPDATE user_preferences
SET visible_filters = visible_filters || '{"phoneType": true, "priority": true}'::jsonb
WHERE NOT (visible_filters ? 'phoneType') OR NOT (visible_filters ? 'priority');