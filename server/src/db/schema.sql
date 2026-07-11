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
  ADD COLUMN IF NOT EXISTS person_id VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expense_entries_person_id_check'
  ) THEN
    ALTER TABLE expense_entries
      ADD CONSTRAINT expense_entries_person_id_check
      CHECK (
        person_id IS NULL OR person_id IN ('don', 'bijo', 'suraj', 'adithyan')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expense_entries_created_at
  ON expense_entries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expense_entries_person
  ON expense_entries (person_id);

CREATE TABLE IF NOT EXISTS custom_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  person_id VARCHAR(20) NOT NULL CHECK (
    person_id IN ('don', 'bijo', 'suraj', 'adithyan')
  ),
  task_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_tasks_date
  ON custom_tasks (task_date);

CREATE TABLE IF NOT EXISTS todo_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  person_id VARCHAR(20) NOT NULL CHECK (
    person_id IN ('don', 'bijo', 'suraj', 'adithyan')
  ),
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

CREATE TABLE IF NOT EXISTS outside_eating_days (
  eat_date DATE PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  person_id VARCHAR(20) CHECK (
    person_id IS NULL OR person_id IN ('don', 'bijo', 'suraj', 'adithyan')
  ),
  split_equally BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
