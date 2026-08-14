import 'server-only'

import db from './db.js'

const PROJECT_STATUSES = new Set(['active', 'paused', 'completed', 'archived'])
const INVOICE_STATUSES = new Set(['draft', 'sent', 'paid', 'overdue', 'void'])

function nowIso() {
  return new Date().toISOString()
}

function monthStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function addMonths(date, count) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1))
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10)
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function normalizeId(id, label = 'id') {
  const value = Number(id)

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${label}: expected a positive integer`)
  }

  return value
}

function normalizeOptionalText(value) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()
  return text === '' ? null : text
}

function requireText(value, label) {
  const text = normalizeOptionalText(value)

  if (!text) {
    throw new Error(`${label} is required`)
  }

  return text
}

function normalizeMoney(value, label, { allowNull = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (allowNull) {
      return null
    }

    throw new Error(`${label} is required`)
  }

  const cents = Number(value)

  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error(`${label} must be a non-negative integer number of cents`)
  }

  return cents
}

function normalizeQuantity(value, label = 'Quantity') {
  const quantity = Number(value)

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`${label} must be greater than zero`)
  }

  return quantity
}

function normalizeCurrency(value) {
  const currency = value === undefined || value === null || value === ''
    ? 'USD'
    : String(value).trim().toUpperCase()

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error('Currency must be a 3-letter ISO code')
  }

  return currency
}

function normalizeProjectStatus(value) {
  const status = value === undefined || value === null || value === ''
    ? 'active'
    : String(value).trim()

  if (!PROJECT_STATUSES.has(status)) {
    throw new Error(`Invalid project status: ${status}`)
  }

  return status
}

function normalizeInvoiceStatus(value) {
  const status = value === undefined || value === null || value === ''
    ? 'draft'
    : String(value).trim()

  if (!INVOICE_STATUSES.has(status)) {
    throw new Error(`Invalid invoice status: ${status}`)
  }

  return status
}

function normalizeLineItems(lineItems) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new Error('At least one invoice line item is required')
  }

  return lineItems.map((item, index) => {
    const quantity = normalizeQuantity(item.quantity, `Line item ${index + 1} quantity`)
    const unitPriceCents = normalizeMoney(
      item.unitPriceCents,
      `Line item ${index + 1} unit price`,
    )

    return {
      position: index,
      description: requireText(item.description, `Line item ${index + 1} description`),
      quantity,
      unitPriceCents,
      lineTotalCents: Math.round(quantity * unitPriceCents),
    }
  })
}

function normalizeInvoiceData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invoice data is required')
  }

  const lineItems = normalizeLineItems(data.lineItems)
  const totalCents = lineItems.reduce((sum, item) => sum + item.lineTotalCents, 0)
  const paidCents = normalizeMoney(data.paidCents ?? 0, 'Paid amount')
  const status = normalizeInvoiceStatus(data.status)

  if (paidCents > totalCents) {
    throw new Error('Paid amount cannot exceed invoice total')
  }

  if (status === 'paid' && paidCents !== totalCents) {
    throw new Error('Paid invoices must have paid amount equal to total')
  }

  if (status !== 'paid' && data.paidAt) {
    throw new Error('Only paid invoices can have a paid date')
  }

  return {
    projectId: normalizeId(data.projectId, 'project id'),
    invoiceNumber: requireText(data.invoiceNumber, 'Invoice number'),
    status,
    issueDate: requireText(data.issueDate, 'Issue date'),
    dueDate: normalizeOptionalText(data.dueDate),
    currency: normalizeCurrency(data.currency),
    subtotalCents: totalCents,
    totalCents,
    paidCents,
    sentAt: normalizeOptionalText(data.sentAt),
    paidAt: normalizeOptionalText(data.paidAt),
    notes: normalizeOptionalText(data.notes),
    lineItems,
  }
}

function mapClient(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    address: row.address,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapProject(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    description: row.description,
    status: row.status,
    hourlyRateCents: row.hourly_rate_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapInvoice(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    projectId: row.project_id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    currency: row.currency,
    subtotalCents: row.subtotal_cents,
    totalCents: row.total_cents,
    paidCents: row.paid_cents,
    sentAt: row.sent_at,
    paidAt: row.paid_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapLineItem(row) {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    position: row.position,
    description: row.description,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    lineTotalCents: row.line_total_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function ensureClientExists(id) {
  const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(id)

  if (!client) {
    throw new Error(`Client ${id} does not exist`)
  }
}

function ensureProjectExists(id) {
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(id)

  if (!project) {
    throw new Error(`Project ${id} does not exist`)
  }
}

function ensureInvoiceExists(id) {
  const invoice = db.prepare('SELECT id FROM invoices WHERE id = ?').get(id)

  if (!invoice) {
    throw new Error(`Invoice ${id} does not exist`)
  }
}

export function getClients() {
  const rows = db.prepare(`
    SELECT
      c.*,
      COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) AS active_project_count,
      COALESCE(SUM(
        CASE
          WHEN i.status != 'void' AND i.paid_cents < i.total_cents
            THEN i.total_cents - i.paid_cents
          ELSE 0
        END
      ), 0) AS total_unpaid_cents
    FROM clients c
    LEFT JOIN projects p ON p.client_id = c.id
    LEFT JOIN invoices i ON i.project_id = p.id
    GROUP BY c.id
    ORDER BY c.name COLLATE NOCASE ASC
  `).all()

  return rows.map((row) => ({
    ...mapClient(row),
    activeProjectCount: row.active_project_count,
    totalUnpaidCents: row.total_unpaid_cents,
  }))
}

export function getClientById(id) {
  const clientId = normalizeId(id, 'client id')
  const row = db.prepare(`
    SELECT
      c.*,
      COUNT(DISTINCT p.id) AS project_count,
      COALESCE(SUM(
        CASE
          WHEN i.status != 'void' AND i.paid_cents < i.total_cents
            THEN i.total_cents - i.paid_cents
          ELSE 0
        END
      ), 0) AS total_unpaid_cents
    FROM clients c
    LEFT JOIN projects p ON p.client_id = c.id
    LEFT JOIN invoices i ON i.project_id = p.id
    WHERE c.id = ?
    GROUP BY c.id
  `).get(clientId)

  if (!row) {
    return null
  }

  return {
    ...mapClient(row),
    projectCount: row.project_count,
    totalUnpaidCents: row.total_unpaid_cents,
  }
}

export function createClient(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Client data is required')
  }

  const result = db.prepare(`
    INSERT INTO clients (name, email, phone, company, address, notes)
    VALUES (@name, @email, @phone, @company, @address, @notes)
  `).run({
    name: requireText(data.name, 'Client name'),
    email: normalizeOptionalText(data.email),
    phone: normalizeOptionalText(data.phone),
    company: normalizeOptionalText(data.company),
    address: normalizeOptionalText(data.address),
    notes: normalizeOptionalText(data.notes),
  })

  return getClientById(result.lastInsertRowid)
}

export function updateClient(id, data) {
  const clientId = normalizeId(id, 'client id')
  const existing = mapClient(db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId))

  if (!existing) {
    throw new Error(`Client ${clientId} does not exist`)
  }

  db.prepare(`
    UPDATE clients
    SET
      name = @name,
      email = @email,
      phone = @phone,
      company = @company,
      address = @address,
      notes = @notes,
      updated_at = @updatedAt
    WHERE id = @id
  `).run({
    id: clientId,
    name: data?.name === undefined ? existing.name : requireText(data.name, 'Client name'),
    email: data?.email === undefined ? existing.email : normalizeOptionalText(data.email),
    phone: data?.phone === undefined ? existing.phone : normalizeOptionalText(data.phone),
    company: data?.company === undefined ? existing.company : normalizeOptionalText(data.company),
    address: data?.address === undefined ? existing.address : normalizeOptionalText(data.address),
    notes: data?.notes === undefined ? existing.notes : normalizeOptionalText(data.notes),
    updatedAt: nowIso(),
  })

  return getClientById(clientId)
}

export function deleteClient(id) {
  const clientId = normalizeId(id, 'client id')
  ensureClientExists(clientId)

  const projectCount = db.prepare('SELECT COUNT(*) AS count FROM projects WHERE client_id = ?')
    .get(clientId).count

  if (projectCount > 0) {
    throw new Error(`Cannot delete client ${clientId} because it has projects`)
  }

  db.prepare('DELETE FROM clients WHERE id = ?').run(clientId)
}

export function getProjects(filters = {}) {
  const where = []
  const params = {}

  if (filters.clientId !== undefined && filters.clientId !== null && filters.clientId !== '') {
    params.clientId = normalizeId(filters.clientId, 'client id')
    where.push('p.client_id = @clientId')
  }

  if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
    params.status = normalizeProjectStatus(filters.status)
    where.push('p.status = @status')
  }

  const rows = db.prepare(`
    SELECT
      p.*,
      c.name AS client_name,
      COALESCE(SUM(
        CASE
          WHEN i.status != 'void' THEN i.total_cents
          ELSE 0
        END
      ), 0) AS total_invoiced_cents
    FROM projects p
    INNER JOIN clients c ON c.id = p.client_id
    LEFT JOIN invoices i ON i.project_id = p.id
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY p.id
    ORDER BY p.name COLLATE NOCASE ASC
  `).all(params)

  return rows.map((row) => ({
    ...mapProject(row),
    clientName: row.client_name,
    totalInvoicedCents: row.total_invoiced_cents,
  }))
}

export function getProjectById(id) {
  const projectId = normalizeId(id, 'project id')
  const row = db.prepare(`
    SELECT
      p.*,
      c.name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone,
      c.company AS client_company,
      c.address AS client_address,
      c.notes AS client_notes,
      COUNT(i.id) AS invoice_count,
      COALESCE(SUM(i.total_cents), 0) AS invoice_total_cents,
      COALESCE(SUM(i.paid_cents), 0) AS invoice_paid_cents,
      COALESCE(SUM(
        CASE
          WHEN i.status != 'void' AND i.paid_cents < i.total_cents
            THEN i.total_cents - i.paid_cents
          ELSE 0
        END
      ), 0) AS invoice_unpaid_cents
    FROM projects p
    INNER JOIN clients c ON c.id = p.client_id
    LEFT JOIN invoices i ON i.project_id = p.id
    WHERE p.id = ?
    GROUP BY p.id
  `).get(projectId)

  if (!row) {
    return null
  }

  return {
    ...mapProject(row),
    client: {
      id: row.client_id,
      name: row.client_name,
      email: row.client_email,
      phone: row.client_phone,
      company: row.client_company,
      address: row.client_address,
      notes: row.client_notes,
    },
    invoiceSummary: {
      count: row.invoice_count,
      totalCents: row.invoice_total_cents,
      paidCents: row.invoice_paid_cents,
      unpaidCents: row.invoice_unpaid_cents,
    },
  }
}

export function createProject(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Project data is required')
  }

  const clientId = normalizeId(data.clientId, 'client id')
  ensureClientExists(clientId)

  const result = db.prepare(`
    INSERT INTO projects (client_id, name, description, status, hourly_rate_cents)
    VALUES (@clientId, @name, @description, @status, @hourlyRateCents)
  `).run({
    clientId,
    name: requireText(data.name, 'Project name'),
    description: normalizeOptionalText(data.description),
    status: normalizeProjectStatus(data.status),
    hourlyRateCents: normalizeMoney(data.hourlyRateCents, 'Hourly rate', { allowNull: true }),
  })

  return getProjectById(result.lastInsertRowid)
}

export function updateProject(id, data) {
  const projectId = normalizeId(id, 'project id')
  const existing = mapProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId))

  if (!existing) {
    throw new Error(`Project ${projectId} does not exist`)
  }

  const clientId = data?.clientId === undefined
    ? existing.clientId
    : normalizeId(data.clientId, 'client id')

  ensureClientExists(clientId)

  db.prepare(`
    UPDATE projects
    SET
      client_id = @clientId,
      name = @name,
      description = @description,
      status = @status,
      hourly_rate_cents = @hourlyRateCents,
      updated_at = @updatedAt
    WHERE id = @id
  `).run({
    id: projectId,
    clientId,
    name: data?.name === undefined ? existing.name : requireText(data.name, 'Project name'),
    description: data?.description === undefined
      ? existing.description
      : normalizeOptionalText(data.description),
    status: data?.status === undefined ? existing.status : normalizeProjectStatus(data.status),
    hourlyRateCents: data?.hourlyRateCents === undefined
      ? existing.hourlyRateCents
      : normalizeMoney(data.hourlyRateCents, 'Hourly rate', { allowNull: true }),
    updatedAt: nowIso(),
  })

  return getProjectById(projectId)
}

export function deleteProject(id) {
  const projectId = normalizeId(id, 'project id')
  ensureProjectExists(projectId)

  const invoiceCount = db.prepare('SELECT COUNT(*) AS count FROM invoices WHERE project_id = ?')
    .get(projectId).count

  if (invoiceCount > 0) {
    throw new Error(`Cannot delete project ${projectId} because it has invoices`)
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId)
}

export function getDashboardSummary() {
  const currentMonthStart = monthStart(new Date())
  const nextMonthStart = addMonths(currentMonthStart, 1)

  const row = db.prepare(`
    SELECT
      COALESCE(SUM(
        CASE
          WHEN i.status IN ('sent', 'overdue') THEN i.total_cents - i.paid_cents
          ELSE 0
        END
      ), 0) AS total_outstanding_cents,
      COALESCE(SUM(
        CASE
          WHEN i.status = 'paid'
            AND i.paid_at >= @currentMonthStart
            AND i.paid_at < @nextMonthStart
            THEN i.paid_cents
          ELSE 0
        END
      ), 0) AS total_paid_this_month_cents,
      COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) AS overdue_count
    FROM invoices i
  `).get({
    currentMonthStart: currentMonthStart.toISOString(),
    nextMonthStart: nextMonthStart.toISOString(),
  })

  const topClient = db.prepare(`
    SELECT c.name
    FROM clients c
    INNER JOIN projects p ON p.client_id = c.id
    INNER JOIN invoices i ON i.project_id = p.id
    GROUP BY c.id
    HAVING SUM(i.paid_cents) > 0
    ORDER BY SUM(i.paid_cents) DESC, c.name COLLATE NOCASE ASC
    LIMIT 1
  `).get()

  return {
    totalOutstandingCents: row.total_outstanding_cents,
    totalPaidThisMonthCents: row.total_paid_this_month_cents,
    overdueCount: row.overdue_count,
    topClientByRevenue: topClient?.name ?? null,
  }
}

export function getMonthlyRevenue() {
  const currentMonthStart = monthStart(new Date())
  const months = Array.from({ length: 6 }, (_, index) => {
    const start = addMonths(currentMonthStart, index - 5)
    const end = addMonths(start, 1)

    return {
      month: formatMonthLabel(start),
      start: formatDateOnly(start),
      end: formatDateOnly(end),
    }
  })

  const totalsByMonth = new Map(db.prepare(`
    SELECT
      strftime('%Y-%m', issue_date) AS month_key,
      COALESCE(SUM(total_cents), 0) AS total_cents
    FROM invoices
    WHERE issue_date >= @startDate
      AND issue_date < @endDate
    GROUP BY month_key
  `).all({
    startDate: months[0].start,
    endDate: months[months.length - 1].end,
  }).map((row) => [row.month_key, row.total_cents]))

  return months.map((month) => ({
    month: month.month,
    totalCents: totalsByMonth.get(month.start.slice(0, 7)) ?? 0,
  }))
}

export function getOverdueInvoices() {
  const rows = db.prepare(`
    SELECT
      i.*,
      p.name AS project_name,
      c.id AS client_id,
      c.name AS client_name
    FROM invoices i
    INNER JOIN projects p ON p.id = i.project_id
    INNER JOIN clients c ON c.id = p.client_id
    WHERE i.status = 'overdue'
    ORDER BY i.due_date ASC, i.id ASC
  `).all()

  return rows.map((row) => ({
    ...mapInvoice(row),
    clientId: row.client_id,
    clientName: row.client_name,
    projectName: row.project_name,
  }))
}

export function getInvoices(filters = {}) {
  const where = []
  const params = {}

  if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
    params.status = normalizeInvoiceStatus(filters.status)
    where.push('i.status = @status')
  }

  if (filters.clientId !== undefined && filters.clientId !== null && filters.clientId !== '') {
    params.clientId = normalizeId(filters.clientId, 'client id')
    where.push('p.client_id = @clientId')
  }

  if (filters.projectId !== undefined && filters.projectId !== null && filters.projectId !== '') {
    params.projectId = normalizeId(filters.projectId, 'project id')
    where.push('i.project_id = @projectId')
  }

  const rows = db.prepare(`
    SELECT
      i.*,
      p.name AS project_name,
      c.id AS client_id,
      c.name AS client_name
    FROM invoices i
    INNER JOIN projects p ON p.id = i.project_id
    INNER JOIN clients c ON c.id = p.client_id
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY i.issue_date DESC, i.id DESC
  `).all(params)

  return rows.map((row) => ({
    ...mapInvoice(row),
    projectName: row.project_name,
    clientId: row.client_id,
    clientName: row.client_name,
  }))
}

export function getInvoiceById(id) {
  const invoiceId = normalizeId(id, 'invoice id')
  const row = db.prepare(`
    SELECT
      i.*,
      p.name AS project_name,
      p.description AS project_description,
      p.status AS project_status,
      p.hourly_rate_cents AS project_hourly_rate_cents,
      c.id AS client_id,
      c.name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone,
      c.company AS client_company,
      c.address AS client_address,
      c.notes AS client_notes
    FROM invoices i
    INNER JOIN projects p ON p.id = i.project_id
    INNER JOIN clients c ON c.id = p.client_id
    WHERE i.id = ?
  `).get(invoiceId)

  if (!row) {
    return null
  }

  const lineItems = db.prepare(`
    SELECT *
    FROM invoice_line_items
    WHERE invoice_id = ?
    ORDER BY position ASC
  `).all(invoiceId).map(mapLineItem)

  return {
    ...mapInvoice(row),
    lineItems,
    project: {
      id: row.project_id,
      name: row.project_name,
      description: row.project_description,
      status: row.project_status,
      hourlyRateCents: row.project_hourly_rate_cents,
    },
    client: {
      id: row.client_id,
      name: row.client_name,
      email: row.client_email,
      phone: row.client_phone,
      company: row.client_company,
      address: row.client_address,
      notes: row.client_notes,
    },
  }
}

const insertInvoiceWithItems = db.transaction((data) => {
  ensureProjectExists(data.projectId)

  const result = db.prepare(`
    INSERT INTO invoices (
      project_id,
      invoice_number,
      status,
      issue_date,
      due_date,
      currency,
      subtotal_cents,
      total_cents,
      paid_cents,
      sent_at,
      paid_at,
      notes
    )
    VALUES (
      @projectId,
      @invoiceNumber,
      @status,
      @issueDate,
      @dueDate,
      @currency,
      @subtotalCents,
      @totalCents,
      @paidCents,
      @sentAt,
      @paidAt,
      @notes
    )
  `).run(data)

  const invoiceId = result.lastInsertRowid
  const insertLineItem = db.prepare(`
    INSERT INTO invoice_line_items (
      invoice_id,
      position,
      description,
      quantity,
      unit_price_cents,
      line_total_cents
    )
    VALUES (
      @invoiceId,
      @position,
      @description,
      @quantity,
      @unitPriceCents,
      @lineTotalCents
    )
  `)

  for (const item of data.lineItems) {
    insertLineItem.run({
      invoiceId,
      ...item,
    })
  }

  return invoiceId
})

export function createInvoice(data) {
  const invoice = normalizeInvoiceData(data)

  try {
    const invoiceId = insertInvoiceWithItems(invoice)
    return getInvoiceById(invoiceId)
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`Invoice number ${invoice.invoiceNumber} already exists`)
    }

    throw error
  }
}

const updateInvoiceWithItems = db.transaction((id, data) => {
  ensureInvoiceExists(id)
  ensureProjectExists(data.projectId)

  db.prepare(`
    UPDATE invoices
    SET
      project_id = @projectId,
      invoice_number = @invoiceNumber,
      status = @status,
      issue_date = @issueDate,
      due_date = @dueDate,
      currency = @currency,
      subtotal_cents = @subtotalCents,
      total_cents = @totalCents,
      paid_cents = @paidCents,
      sent_at = @sentAt,
      paid_at = @paidAt,
      notes = @notes,
      updated_at = @updatedAt
    WHERE id = @id
  `).run({
    id,
    updatedAt: nowIso(),
    ...data,
  })

  db.prepare('DELETE FROM invoice_line_items WHERE invoice_id = ?').run(id)

  const insertLineItem = db.prepare(`
    INSERT INTO invoice_line_items (
      invoice_id,
      position,
      description,
      quantity,
      unit_price_cents,
      line_total_cents
    )
    VALUES (
      @invoiceId,
      @position,
      @description,
      @quantity,
      @unitPriceCents,
      @lineTotalCents
    )
  `)

  for (const item of data.lineItems) {
    insertLineItem.run({
      invoiceId: id,
      ...item,
    })
  }
})

export function updateInvoice(id, data) {
  const invoiceId = normalizeId(id, 'invoice id')
  const invoice = normalizeInvoiceData(data)

  try {
    updateInvoiceWithItems(invoiceId, invoice)
    return getInvoiceById(invoiceId)
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`Invoice number ${invoice.invoiceNumber} already exists`)
    }

    throw error
  }
}

export function deleteInvoice(id) {
  const invoiceId = normalizeId(id, 'invoice id')
  ensureInvoiceExists(invoiceId)
  db.prepare('DELETE FROM invoices WHERE id = ?').run(invoiceId)
}
