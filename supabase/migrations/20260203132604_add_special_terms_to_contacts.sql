/*
  # Add special terms field to contacts

  1. Changes
    - Add `special_terms` column to `contacts` table to store custom payment terms
    - Column is text type, nullable, with no default value
  
  2. Purpose
    - Allow users to store custom payment terms like "LC at sight", "Net 60", etc.
    - Provides flexibility beyond the standard average_days_credit_required field
*/

-- Add special_terms column to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS special_terms TEXT;
