/*
  # Create tasks table

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key to contacts, nullable)
      - `supplier_id` (uuid, foreign key to suppliers, nullable)
      - `task_type` (text) - 'email_back', 'call_back', 'text_back', or 'other'
      - `title` (text) - brief title of the task
      - `notes` (text) - detailed notes about the task
      - `due_date` (date) - when the task is due
      - `completed` (boolean) - whether the task is completed
      - `completed_at` (timestamptz) - when the task was completed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on `tasks` table
    - Add policy for all users to manage tasks (no auth in this app yet)
    
  3. Indexes
    - Add index on contact_id for faster lookups
    - Add index on supplier_id for faster lookups
    - Add index on due_date for task sorting
    - Add index on completed for filtering
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN ('email_back', 'call_back', 'text_back', 'other')),
  title text NOT NULL,
  notes text DEFAULT '',
  due_date date,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT task_has_contact_or_supplier CHECK (
    (contact_id IS NOT NULL AND supplier_id IS NULL) OR
    (contact_id IS NULL AND supplier_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_supplier_id ON tasks(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on tasks"
  ON tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);