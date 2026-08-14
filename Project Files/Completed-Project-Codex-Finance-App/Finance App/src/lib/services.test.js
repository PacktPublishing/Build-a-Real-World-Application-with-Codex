import { beforeEach, describe, expect, it } from 'vitest'

import db from './db.js'
import './migrate.js'
import {
  createClient,
  createInvoice,
  deleteClient,
  deleteInvoice,
  getDashboardSummary,
  getClientById,
  getClients,
  getInvoiceById,
  getInvoices,
  getMonthlyRevenue,
  getOverdueInvoices,
  getProjects,
} from './services.js'

function monthStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function addMonths(date, count) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1))
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10)
}

function monthLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function seedTestData() {
  db.exec(`
    DELETE FROM invoice_line_items;
    DELETE FROM invoices;
    DELETE FROM projects;
    DELETE FROM clients;
  `)

  const insertClient = db.prepare(`
    INSERT INTO clients (name, email, phone, company, address, notes)
    VALUES (@name, @email, @phone, @company, @address, @notes)
  `)
  const insertProject = db.prepare(`
    INSERT INTO projects (client_id, name, description, status, hourly_rate_cents)
    VALUES (@clientId, @name, @description, @status, @hourlyRateCents)
  `)
  const insertInvoice = db.prepare(`
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
  `)
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

  const acmeClientId = insertClient.run({
    name: 'Acme Studio',
    email: 'billing@acme.test',
    phone: null,
    company: 'Acme',
    address: null,
    notes: 'Primary test client',
  }).lastInsertRowid

  const betaClientId = insertClient.run({
    name: 'Beta Labs',
    email: 'ops@beta.test',
    phone: null,
    company: 'Beta',
    address: null,
    notes: null,
  }).lastInsertRowid

  const projectId = insertProject.run({
    clientId: acmeClientId,
    name: 'Website Build',
    description: 'Marketing site',
    status: 'active',
    hourlyRateCents: 10000,
  }).lastInsertRowid

  const invoiceId = insertInvoice.run({
    projectId,
    invoiceNumber: 'INV-TEST-001',
    status: 'sent',
    issueDate: '2026-06-01',
    dueDate: '2026-07-01',
    currency: 'USD',
    subtotalCents: 25000,
    totalCents: 25000,
    paidCents: 0,
    sentAt: '2026-06-01T12:00:00.000Z',
    paidAt: null,
    notes: 'Seed invoice',
  }).lastInsertRowid

  insertLineItem.run({
    invoiceId,
    position: 0,
    description: 'Design',
    quantity: 1,
    unitPriceCents: 10000,
    lineTotalCents: 10000,
  })
  insertLineItem.run({
    invoiceId,
    position: 1,
    description: 'Development',
    quantity: 3,
    unitPriceCents: 5000,
    lineTotalCents: 15000,
  })

  return {
    acmeClientId,
    betaClientId,
    projectId,
    invoiceId,
  }
}

function insertProject(clientId, name) {
  return db.prepare(`
    INSERT INTO projects (client_id, name, description, status, hourly_rate_cents)
    VALUES (?, ?, ?, ?, ?)
  `).run(clientId, name, null, 'active', null).lastInsertRowid
}

function insertInvoice({
  projectId,
  invoiceNumber,
  status,
  issueDate,
  dueDate = null,
  totalCents,
  paidCents = 0,
  paidAt = null,
}) {
  return db.prepare(`
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    projectId,
    invoiceNumber,
    status,
    issueDate,
    dueDate,
    'USD',
    totalCents,
    totalCents,
    paidCents,
    null,
    paidAt,
    null,
  ).lastInsertRowid
}

let fixture

beforeEach(() => {
  fixture = seedTestData()
})

describe('client services', () => {
  it('getClients() returns all clients', () => {
    const clients = getClients()

    expect(clients).toHaveLength(2)
    expect(clients.map((client) => client.name)).toEqual(['Acme Studio', 'Beta Labs'])
    expect(clients[0]).toMatchObject({
      activeProjectCount: 1,
      totalUnpaidCents: 25000,
    })
    expect(clients[1]).toMatchObject({
      activeProjectCount: 0,
      totalUnpaidCents: 0,
    })
  })

  it('getClients() counts active projects and unpaid balances', () => {
    const pausedProjectId = db.prepare(`
      INSERT INTO projects (client_id, name, description, status, hourly_rate_cents)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      fixture.acmeClientId,
      'Retainer',
      'Paused work',
      'paused',
      12000,
    ).lastInsertRowid

    db.prepare(`
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pausedProjectId,
      'INV-TEST-002',
      'sent',
      '2026-06-10',
      '2026-07-10',
      'USD',
      10000,
      10000,
      2500,
      '2026-06-10T12:00:00.000Z',
      null,
      null,
    )

    db.prepare(`
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fixture.projectId,
      'INV-TEST-003',
      'void',
      '2026-06-11',
      '2026-07-11',
      'USD',
      50000,
      50000,
      0,
      null,
      null,
      null,
    )

    const [client] = getClients()

    expect(client).toMatchObject({
      id: fixture.acmeClientId,
      activeProjectCount: 1,
      totalUnpaidCents: 32500,
    })
  })

  it('getClientById() returns the correct client', () => {
    const client = getClientById(fixture.acmeClientId)

    expect(client).toMatchObject({
      id: fixture.acmeClientId,
      name: 'Acme Studio',
      projectCount: 1,
      totalUnpaidCents: 25000,
    })
  })

  it('createClient() inserts and returns a new client', () => {
    const client = createClient({
      name: 'Gamma Co',
      email: 'hello@gamma.test',
      phone: '555-0100',
      company: 'Gamma',
      address: '1 Test Way',
      notes: 'New client',
    })

    expect(client).toMatchObject({
      name: 'Gamma Co',
      email: 'hello@gamma.test',
      projectCount: 0,
      totalUnpaidCents: 0,
    })
    expect(getClients()).toHaveLength(3)
  })

  it('deleteClient() throws when projects exist', () => {
    expect(() => deleteClient(fixture.acmeClientId))
      .toThrow(`Cannot delete client ${fixture.acmeClientId} because it has projects`)
  })
})

describe('invoice services', () => {
  it('getInvoices() returns all invoices', () => {
    const invoices = getInvoices()

    expect(invoices).toHaveLength(1)
    expect(invoices[0]).toMatchObject({
      id: fixture.invoiceId,
      invoiceNumber: 'INV-TEST-001',
      clientName: 'Acme Studio',
      projectName: 'Website Build',
    })
  })

  it('getInvoiceById() returns the invoice with line items', () => {
    const invoice = getInvoiceById(fixture.invoiceId)

    expect(invoice).toMatchObject({
      id: fixture.invoiceId,
      invoiceNumber: 'INV-TEST-001',
      totalCents: 25000,
      client: {
        id: fixture.acmeClientId,
        name: 'Acme Studio',
      },
      project: {
        id: fixture.projectId,
        name: 'Website Build',
      },
    })
    expect(invoice.lineItems).toHaveLength(2)
    expect(invoice.lineItems.map((item) => item.lineTotalCents)).toEqual([10000, 15000])
  })

  it('createInvoice() calculates totals correctly from line items', () => {
    const invoice = createInvoice({
      projectId: fixture.projectId,
      invoiceNumber: 'INV-TEST-002',
      status: 'draft',
      issueDate: '2026-06-15',
      dueDate: '2026-07-15',
      currency: 'USD',
      lineItems: [
        {
          description: 'Strategy',
          quantity: 2,
          unitPriceCents: 12500,
        },
        {
          description: 'Implementation',
          quantity: 1.5,
          unitPriceCents: 20000,
        },
      ],
    })

    expect(invoice.subtotalCents).toBe(55000)
    expect(invoice.totalCents).toBe(55000)
    expect(invoice.paidCents).toBe(0)
    expect(invoice.lineItems.map((item) => item.lineTotalCents)).toEqual([25000, 30000])
  })

  it('deleteInvoice() cascades to line items', () => {
    deleteInvoice(fixture.invoiceId)

    const invoiceCount = db.prepare('SELECT COUNT(*) AS count FROM invoices WHERE id = ?')
      .get(fixture.invoiceId).count
    const lineItemCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM invoice_line_items
      WHERE invoice_id = ?
    `).get(fixture.invoiceId).count

    expect(invoiceCount).toBe(0)
    expect(lineItemCount).toBe(0)
  })
})

describe('project services', () => {
  it('getProjects() returns projects with non-void invoiced totals', () => {
    db.prepare(`
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fixture.projectId,
      'INV-TEST-VOID',
      'void',
      '2026-06-20',
      '2026-07-20',
      'USD',
      50000,
      50000,
      0,
      null,
      null,
      null,
    )

    const projects = getProjects()

    expect(projects).toHaveLength(1)
    expect(projects[0]).toMatchObject({
      id: fixture.projectId,
      clientId: fixture.acmeClientId,
      clientName: 'Acme Studio',
      name: 'Website Build',
      totalInvoicedCents: 25000,
    })
  })
})

describe('dashboard services', () => {
  it('getDashboardSummary() returns outstanding totals, paid month total, overdue count, and top client', () => {
    const currentMonth = monthStart(new Date())
    const previousMonth = addMonths(currentMonth, -1)
    const betaProjectId = insertProject(fixture.betaClientId, 'Analytics Cleanup')

    insertInvoice({
      projectId: fixture.projectId,
      invoiceNumber: 'INV-DASH-OVERDUE-ACME',
      status: 'overdue',
      issueDate: dateOnly(previousMonth),
      dueDate: dateOnly(addMonths(currentMonth, -1)),
      totalCents: 20000,
      paidCents: 5000,
    })
    insertInvoice({
      projectId: betaProjectId,
      invoiceNumber: 'INV-DASH-PAID-BETA',
      status: 'paid',
      issueDate: dateOnly(currentMonth),
      dueDate: dateOnly(currentMonth),
      totalCents: 40000,
      paidCents: 40000,
      paidAt: currentMonth.toISOString(),
    })
    insertInvoice({
      projectId: fixture.projectId,
      invoiceNumber: 'INV-DASH-PAID-ACME-OLD',
      status: 'paid',
      issueDate: dateOnly(previousMonth),
      dueDate: dateOnly(previousMonth),
      totalCents: 50000,
      paidCents: 50000,
      paidAt: previousMonth.toISOString(),
    })

    expect(getDashboardSummary()).toEqual({
      totalOutstandingCents: 40000,
      totalPaidThisMonthCents: 40000,
      overdueCount: 1,
      topClientByRevenue: 'Acme Studio',
    })
  })

  it('getMonthlyRevenue() returns the last 6 months with zero-filled totals', () => {
    const currentMonth = monthStart(new Date())
    const fiveMonthsAgo = addMonths(currentMonth, -5)
    const twoMonthsAgo = addMonths(currentMonth, -2)
    const outsideWindow = addMonths(currentMonth, -6)

    insertInvoice({
      projectId: fixture.projectId,
      invoiceNumber: 'INV-REV-FIVE-MONTHS-AGO',
      status: 'paid',
      issueDate: dateOnly(fiveMonthsAgo),
      dueDate: dateOnly(fiveMonthsAgo),
      totalCents: 30000,
      paidCents: 30000,
      paidAt: fiveMonthsAgo.toISOString(),
    })
    insertInvoice({
      projectId: fixture.projectId,
      invoiceNumber: 'INV-REV-TWO-MONTHS-AGO',
      status: 'sent',
      issueDate: dateOnly(twoMonthsAgo),
      dueDate: dateOnly(twoMonthsAgo),
      totalCents: 45000,
    })
    insertInvoice({
      projectId: fixture.projectId,
      invoiceNumber: 'INV-REV-OUTSIDE-WINDOW',
      status: 'paid',
      issueDate: dateOnly(outsideWindow),
      dueDate: dateOnly(outsideWindow),
      totalCents: 99000,
      paidCents: 99000,
      paidAt: outsideWindow.toISOString(),
    })

    const expectedTotals = new Map([
      [dateOnly(fiveMonthsAgo).slice(0, 7), 30000],
      [dateOnly(twoMonthsAgo).slice(0, 7), 45000],
    ])
    const seedMonthKey = '2026-06'
    expectedTotals.set(seedMonthKey, (expectedTotals.get(seedMonthKey) ?? 0) + 25000)

    expect(getMonthlyRevenue()).toEqual(
      Array.from({ length: 6 }, (_, index) => {
        const month = addMonths(currentMonth, index - 5)
        const monthKey = dateOnly(month).slice(0, 7)

        return {
          month: monthLabel(month),
          totalCents: expectedTotals.get(monthKey) ?? 0,
        }
      }),
    )
  })

  it('getOverdueInvoices() returns overdue invoices ordered by due date', () => {
    const betaProjectId = insertProject(fixture.betaClientId, 'Reporting Setup')
    const laterInvoiceId = insertInvoice({
      projectId: fixture.projectId,
      invoiceNumber: 'INV-OVERDUE-LATER',
      status: 'overdue',
      issueDate: '2026-03-15',
      dueDate: '2026-04-15',
      totalCents: 18000,
    })
    const earlierInvoiceId = insertInvoice({
      projectId: betaProjectId,
      invoiceNumber: 'INV-OVERDUE-EARLIER',
      status: 'overdue',
      issueDate: '2026-02-01',
      dueDate: '2026-03-01',
      totalCents: 27000,
    })

    insertInvoice({
      projectId: fixture.projectId,
      invoiceNumber: 'INV-NOT-OVERDUE',
      status: 'sent',
      issueDate: '2026-03-01',
      dueDate: '2026-03-31',
      totalCents: 12000,
    })

    expect(getOverdueInvoices()).toMatchObject([
      {
        id: earlierInvoiceId,
        clientName: 'Beta Labs',
        projectName: 'Reporting Setup',
        dueDate: '2026-03-01',
        totalCents: 27000,
      },
      {
        id: laterInvoiceId,
        clientName: 'Acme Studio',
        projectName: 'Website Build',
        dueDate: '2026-04-15',
        totalCents: 18000,
      },
    ])
  })
})
