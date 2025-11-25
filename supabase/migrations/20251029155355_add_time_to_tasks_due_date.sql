/*
  # Update tasks due_date to support time

  1. Changes
    - Alter `tasks.due_date` from `date` to `timestamptz` to support both date and time
    - This allows users to set specific times for task reminders
    
  2. Notes
    - Existing date values will be automatically converted to timestamptz at midnight
    - The index on due_date will continue to work properly
*/

ALTER TABLE tasks ALTER COLUMN due_date TYPE timestamptz USING due_date::timestamptz;
