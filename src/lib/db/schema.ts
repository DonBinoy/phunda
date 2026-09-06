/** Embedded schema — avoids readFileSync issues on Vercel serverless */
export const OUTSIDE_EATING_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS outside_eating_days (
  eat_date DATE PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export const EXPENSE_TEMPLATES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS expense_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  person_id VARCHAR(30),
  split_equally BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export const PEOPLE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS people (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  baseline_task_index INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export const CHORE_DEFINITIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS chore_definitions (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  short_name VARCHAR(100) NOT NULL,
  category VARCHAR(10) NOT NULL CHECK (category IN ('daily', 'weekend')),
  slots INT NOT NULL DEFAULT 1 CHECK (slots >= 1),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export const HOUSEHOLD_SEED_SQL = `
INSERT INTO people (id, name, baseline_task_index, sort_order)
VALUES
  ('don', 'Don', 0, 0),
  ('bijo', 'Bijo', 3, 1),
  ('suraj', 'Suraj', 1, 2),
  ('adithyan', 'Adithyan', 2, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO chore_definitions (id, name, short_name, category, slots, sort_order)
VALUES
  ('paathram', 'Paathram Kazhukk', 'Paathram', 'daily', 1, 0),
  ('veg', 'Veg Ariyal', 'Veg Ariyal', 'daily', 1, 1),
  ('kari', 'Cooking (Kari)', 'Kari', 'daily', 1, 2),
  ('rice', 'Cooking (Rice/Main)', 'Rice/Main', 'daily', 1, 3),
  ('kitchen', 'Kitchen Cleaning', 'Kitchen Cleaning', 'weekend', 2, 0),
  ('bathroom', 'Bathroom Cleaning', 'Bathroom Cleaning', 'weekend', 1, 1),
  ('room', 'Room Cleaning', 'Room Cleaning', 'weekend', 1, 2)
ON CONFLICT (id) DO NOTHING;
`;

export const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS task_completions (
  id SERIAL PRIMARY KEY,
  task_date DATE NOT NULL,
  category VARCHAR(10) NOT NULL CHECK (category IN ('daily', 'weekend')),
  task_id VARCHAR(20) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_date, category, task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_completions_date
  ON task_completions (task_date);

CREATE TABLE IF NOT EXISTS expense_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE expense_entries
  ADD COLUMN IF NOT EXISTS person_id VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_expense_entries_created_at
  ON expense_entries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expense_entries_person
  ON expense_entries (person_id);

CREATE TABLE IF NOT EXISTS custom_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  person_id VARCHAR(30) NOT NULL,
  task_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_tasks_date
  ON custom_tasks (task_date);

CREATE TABLE IF NOT EXISTS todo_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  person_id VARCHAR(30) NOT NULL,
  task_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todo_lists_date
  ON todo_lists (task_date);

CREATE TABLE IF NOT EXISTS todo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_list_id UUID NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todo_items_list
  ON todo_items (todo_list_id);
${OUTSIDE_EATING_TABLE_SQL.trim()}

${EXPENSE_TEMPLATES_TABLE_SQL.trim()}

${PEOPLE_TABLE_SQL.trim()}

${CHORE_DEFINITIONS_TABLE_SQL.trim()}

${HOUSEHOLD_SEED_SQL.trim()}
`;
