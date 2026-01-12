/*
  # Add 'dead' to valid reason types
  
  1. Changes
    - Update check constraint on custom_jammed_reasons table to include 'dead' as a valid reason type
  
  2. Notes
    - This allows users to create and save custom reasons for the 'dead' status
    - Existing constraints will be dropped and recreated with the updated valid values
*/

-- Drop the existing constraint
ALTER TABLE custom_jammed_reasons DROP CONSTRAINT IF EXISTS valid_reason_type;

-- Add updated constraint that includes 'dead'
ALTER TABLE custom_jammed_reasons
ADD CONSTRAINT valid_reason_type CHECK (reason_type IN ('jammed', 'traction', 'client', 'dead'));