/*
  # Add oil prices order to user preferences

  1. Changes
    - Add `oil_prices_order` column to `user_preferences` table
      - Stores the order of oil price displays (WTI, Brent, MGO)
      - Default order: ['WTI', 'Brent', 'MGO']
  
  2. Notes
    - Users can customize the order of oil price graphs
    - The order is stored as an array of strings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'oil_prices_order'
  ) THEN
    ALTER TABLE user_preferences 
    ADD COLUMN oil_prices_order text[] DEFAULT ARRAY['WTI', 'Brent', 'MGO'];
  END IF;
END $$;