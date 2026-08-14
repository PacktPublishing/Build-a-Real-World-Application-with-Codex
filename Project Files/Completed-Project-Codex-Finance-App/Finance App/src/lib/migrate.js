import db from './db.js'

const migrate = db.transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_clients_name
      ON clients (name);

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      hourly_rate_cents INTEGER,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT,
      CHECK (status IN ('active', 'paused', 'completed', 'archived')),
      CHECK (hourly_rate_cents IS NULL OR hourly_rate_cents >= 0)
    );

    CREATE INDEX IF NOT EXISTS idx_projects_client_id
      ON projects (client_id);

    CREATE INDEX IF NOT EXISTS idx_projects_status
      ON projects (status);

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'draft',
      issue_date TEXT NOT NULL,
      due_date TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      subtotal_cents INTEGER NOT NULL DEFAULT 0,
      total_cents INTEGER NOT NULL DEFAULT 0,
      paid_cents INTEGER NOT NULL DEFAULT 0,
      sent_at TEXT,
      paid_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE RESTRICT,
      CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'void')),
      CHECK (length(currency) = 3 AND currency = upper(currency)),
      CHECK (subtotal_cents >= 0),
      CHECK (total_cents >= 0),
      CHECK (paid_cents >= 0),
      CHECK (paid_cents <= total_cents)
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_project_id
      ON invoices (project_id);

    CREATE INDEX IF NOT EXISTS idx_invoices_status
      ON invoices (status);

    CREATE INDEX IF NOT EXISTS idx_invoices_due_date
      ON invoices (due_date);

    CREATE INDEX IF NOT EXISTS idx_invoices_issue_date
      ON invoices (issue_date);

    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      line_total_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
      UNIQUE (invoice_id, position),
      CHECK (position >= 0),
      CHECK (quantity > 0),
      CHECK (unit_price_cents >= 0),
      CHECK (line_total_cents >= 0)
    );

    CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id
      ON invoice_line_items (invoice_id);
  `)
})

migrate()
