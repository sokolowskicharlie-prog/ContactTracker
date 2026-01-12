/*
  # Remove duplicate supplier ports

  1. Changes
    - Keep only the first port entry for each unique supplier_id + port_name combination
    - Delete duplicates based on created_at timestamp

  2. Notes
    - Uses ROW_NUMBER to identify duplicates
    - Keeps the entry with the earliest created_at timestamp
*/

DELETE FROM supplier_ports
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY supplier_id, port_name 
        ORDER BY created_at ASC
      ) as rn
    FROM supplier_ports
  ) sub
  WHERE rn > 1
);
