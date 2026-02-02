/*
  # Add visible oil prices column to user preferences

  1. Changes
    - Add `visible_oil_prices` column to `user_preferences` table
      - Type: jsonb (array of strings)
      - Nullable: yes (defaults handled in application)
      - Stores which oil price graphs are visible to the user
  
  2. Notes
    - Users can hide/show individual oil price graphs (WTI, Brent, MGO, VLSFO, IFO 380)
    - Default visibility handled in application layer
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'visible_oil_prices'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN visible_oil_prices jsonb;
  END IF;
END $$;
