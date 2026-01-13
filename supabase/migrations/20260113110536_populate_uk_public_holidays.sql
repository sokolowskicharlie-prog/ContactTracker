/*
  # Populate UK Public Holidays

  1. Changes
    - Insert UK public holidays for 2025 and 2026
    - These are visible to all users (is_public = true, user_id = null)
*/

-- Insert UK public holidays for 2025
INSERT INTO holidays (name, date, is_public, country, description, user_id) VALUES
  ('New Year''s Day', '2025-01-01', true, 'GB', 'New Year''s Day', null),
  ('Good Friday', '2025-04-18', true, 'GB', 'Good Friday', null),
  ('Easter Monday', '2025-04-21', true, 'GB', 'Easter Monday', null),
  ('Early May Bank Holiday', '2025-05-05', true, 'GB', 'Early May Bank Holiday', null),
  ('Spring Bank Holiday', '2025-05-26', true, 'GB', 'Spring Bank Holiday', null),
  ('Summer Bank Holiday', '2025-08-25', true, 'GB', 'Summer Bank Holiday', null),
  ('Christmas Day', '2025-12-25', true, 'GB', 'Christmas Day', null),
  ('Boxing Day', '2025-12-26', true, 'GB', 'Boxing Day', null)
ON CONFLICT DO NOTHING;

-- Insert UK public holidays for 2026
INSERT INTO holidays (name, date, is_public, country, description, user_id) VALUES
  ('New Year''s Day', '2026-01-01', true, 'GB', 'New Year''s Day', null),
  ('Good Friday', '2026-04-03', true, 'GB', 'Good Friday', null),
  ('Easter Monday', '2026-04-06', true, 'GB', 'Easter Monday', null),
  ('Early May Bank Holiday', '2026-05-04', true, 'GB', 'Early May Bank Holiday', null),
  ('Spring Bank Holiday', '2026-05-25', true, 'GB', 'Spring Bank Holiday', null),
  ('Summer Bank Holiday', '2026-08-31', true, 'GB', 'Summer Bank Holiday', null),
  ('Christmas Day', '2026-12-25', true, 'GB', 'Christmas Day', null),
  ('Boxing Day', '2026-12-28', true, 'GB', 'Boxing Day (substitute)', null)
ON CONFLICT DO NOTHING;
