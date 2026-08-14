<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Freelancer Invoice Tracker

A single-user freelancer bookkeeping app for managing clients, projects, invoices, and invoice line items.

## Tech Stack

- Next.js 16 App Router
- React 19
- JavaScript
- Tailwind CSS 4
- SQLite
- better-sqlite3
- ESLint 9 with `eslint-config-next`
- npm

## Key Commands

- Dev server: `npm run dev`
- Tests: `npm run test`
- Lint: `npm run lint`
- Database migration: `node src/lib/migrate.js`
- Database seed: `node src/lib/seed.js`

## Database Schema

Use SQLite with foreign keys enabled. Store money as integer cents and dates/timestamps as ISO text.

### `clients`

- Stores freelancer clients and contact details.
- Key columns: `id`, `name`, `email`, `phone`, `company`, `address`, `notes`, `created_at`, `updated_at`.
- Constraints: `name` is required.
- Index: client name.

### `projects`

- Stores projects owned by clients.
- Key columns: `id`, `client_id`, `name`, `description`, `status`, `hourly_rate_cents`, `created_at`, `updated_at`.
- Relationship: `client_id` references `clients(id)` with restricted deletion.
- Constraints: status is one of `active`, `paused`, `completed`, `archived`; hourly rate must be null or non-negative.
- Indexes: client, status.

### `invoices`

- Stores invoices for projects.
- Key columns: `id`, `project_id`, `invoice_number`, `status`, `issue_date`, `due_date`, `currency`, `subtotal_cents`, `total_cents`, `paid_cents`, `sent_at`, `paid_at`, `notes`, `created_at`, `updated_at`.
- Relationship: `project_id` references `projects(id)` with restricted deletion.
- Constraints: invoice number is unique; status is one of `draft`, `sent`, `paid`, `overdue`, `void`; totals and paid amounts are non-negative; paid amount cannot exceed total; currency is a 3-letter code.
- Indexes: project, status, due date, issue date.

### `invoice_line_items`

- Stores ordered line items for invoices.
- Key columns: `id`, `invoice_id`, `position`, `description`, `quantity`, `unit_price_cents`, `line_total_cents`, `created_at`, `updated_at`.
- Relationship: `invoice_id` references `invoices(id)` with cascade deletion.
- Constraints: position is non-negative; quantity is positive; unit price and line total are non-negative; each invoice has unique line item positions.
- Index: invoice.

Invoice totals are recalculated server-side whenever line items change. In v1, `subtotal_cents` and `total_cents` are equal because tax and discounts are out of scope.

## Data Layer

- All database access goes through `src/lib/services.js`.
- Never write raw SQL queries inside components or pages.
- All money values are stored and passed as integer cents.
- Run `npm run test` before completing any task that touches the service layer.

## Server Actions

- All data mutations go through Server Actions in `src/actions/`.
- Actions import from `src/lib/services.js` only; never query the database directly.
- Every action returns `{ data, error }`; `error` is a string message or null.
- Action files must start with `'use server'`.
- For reads, use service functions directly in Server Components; no action needed.
- Never use `fetch()` to call our own data; use actions or service functions directly.

## Page Structure

Use `src/app` routes with shared navigation for Dashboard, Clients, Projects, and Invoices.

- `/`: dashboard with unpaid total, overdue invoices, paid this month, active projects, recent invoices, upcoming due invoices, and links to create core records.
- `/clients`: client list with search/filter, project counts, unpaid totals, and links to detail/create pages.
- `/clients/new`: create client form.
- `/clients/[clientId]`: client detail with contact info, notes, projects, and invoices across the client's projects.
- `/clients/[clientId]/edit`: edit client form.
- `/projects`: project list with status/client filters, invoice counts, unpaid totals, and links to detail/create pages.
- `/projects/new`: create project form.
- `/projects/[projectId]`: project detail with client link, invoices, and totals by status.
- `/projects/[projectId]/edit`: edit project form.
- `/invoices`: invoice list with status, client/project, due date, and invoice number filtering.
- `/invoices/new`: create invoice form with project selection and editable line items.
- `/invoices/[invoiceId]`: invoice detail and print-friendly invoice view with actions to edit, mark sent, mark paid, or void.
- `/invoices/[invoiceId]/edit`: edit invoice metadata and line items.

## Conventions

- Read the relevant guide in `node_modules/next/dist/docs/` before changing App Router code.
- Keep routes under `src/app`.
- Use `page.js` for route UI and `layout.js` for shared route shells.
- Use dynamic route segment folders with bracket names, such as `[clientId]`, `[projectId]`, and `[invoiceId]`.
- Use lowercase kebab-case folder names for static route segments.
- Keep shared UI components outside route folders when reused across multiple sections.
- Keep route-specific components close to the route that owns them.
- Use Server Components by default.
- Use Client Components only for interactive browser state.
- Put server-only database access behind a dedicated data layer instead of querying SQLite directly from UI components.
- Use Server Functions for form mutations.
- Recalculate derived invoice totals on the server, not from trusted client input.
- Use integer cents for all money values.
- Use ISO text values for dates and timestamps.
- Name database columns in snake_case.
- Name JavaScript variables and functions in camelCase.
- Name React components in PascalCase.

## Shared Components

- Use `StatusBadge` at `src/components/StatusBadge.jsx` for all status display. Never hardcode status colours inline.
- Use `formatCurrency`, `formatDate`, and `formatInvoiceNumber` at `src/lib/formatters.js` for all currency, date, and invoice number formatting. Never format these values inline.

## Critical Rules

- NEVER run npm run build — it hangs in this environment. Use npm run test for the test suite only.
- In InvoiceForm, quantity inputs must have step="1" and min="1" — never leave number inputs without explicit step and min attributes.
