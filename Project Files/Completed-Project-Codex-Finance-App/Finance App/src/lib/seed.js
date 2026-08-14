import db from './db.js'

const clients = [
  {
    name: 'Maya Chen',
    email: 'maya.chen@northstar-studio.com',
    phone: '+1 415 555 0194',
    company: 'Northstar Studio',
    address: '210 Market Street, Suite 804, San Francisco, CA 94105',
    notes: 'Prefers concise monthly status summaries.',
    projects: [
      {
        name: 'Brand Identity Refresh',
        description: 'Updated visual identity, design system foundations, and launch collateral.',
        status: 'completed',
        hourlyRateCents: 12500,
      },
      {
        name: 'Marketing Website Optimization',
        description: 'Landing page experiments, analytics cleanup, and conversion improvements.',
        status: 'active',
        hourlyRateCents: 11500,
      },
    ],
  },
  {
    name: 'Jordan Patel',
    email: 'jordan.patel@harborlegal.com',
    phone: '+1 212 555 0138',
    company: 'Harbor Legal Group',
    address: '88 Broad Street, Floor 12, New York, NY 10004',
    notes: 'Invoices route through operations before payment.',
    projects: [
      {
        name: 'Client Portal Planning',
        description: 'Discovery, technical planning, and implementation roadmap for a secure client portal.',
        status: 'completed',
        hourlyRateCents: 14000,
      },
      {
        name: 'Document Workflow Automation',
        description: 'Automation of intake forms, document generation, and internal review queues.',
        status: 'active',
        hourlyRateCents: 15000,
      },
    ],
  },
  {
    name: 'Elena Rodriguez',
    email: 'elena@brightpathfitness.co',
    phone: '+1 512 555 0177',
    company: 'BrightPath Fitness',
    address: '450 South Congress Avenue, Austin, TX 78704',
    notes: 'Seasonal campaigns align with class launches.',
    projects: [
      {
        name: 'Membership Dashboard',
        description: 'Member retention dashboard and reporting views for studio managers.',
        status: 'active',
        hourlyRateCents: 10500,
      },
      {
        name: 'Spring Campaign Assets',
        description: 'Email templates, ad creative, and performance reporting for spring promotions.',
        status: 'completed',
        hourlyRateCents: 9500,
      },
    ],
  },
  {
    name: 'Thomas Wright',
    email: 'thomas.wright@greenridgehomes.com',
    phone: '+1 303 555 0122',
    company: 'Greenridge Homes',
    address: '1720 Wazee Street, Denver, CO 80202',
    notes: 'Requests itemized invoices by project phase.',
    projects: [
      {
        name: 'Property Listing Platform',
        description: 'Custom listing pages, lead capture, and broker administration tools.',
        status: 'active',
        hourlyRateCents: 13000,
      },
      {
        name: 'Sales Collateral System',
        description: 'Reusable templates and content workflow for neighborhood sales materials.',
        status: 'completed',
        hourlyRateCents: 11000,
      },
    ],
  },
]

const invoiceData = [
  {
    projectName: 'Brand Identity Refresh',
    invoiceNumber: 'INV-2026-001',
    status: 'paid',
    issueDate: '2026-01-08',
    dueDate: '2026-02-07',
    sentAt: '2026-01-08T16:15:00.000Z',
    paidAt: '2026-01-24T18:40:00.000Z',
    notes: 'Final identity package and handoff.',
    items: [
      ['Discovery workshop and stakeholder interviews', 6, 12500],
      ['Logo refinement and visual identity exploration', 14, 12500],
      ['Brand guideline documentation', 8, 12500],
    ],
  },
  {
    projectName: 'Brand Identity Refresh',
    invoiceNumber: 'INV-2026-002',
    status: 'void',
    issueDate: '2026-02-03',
    dueDate: '2026-03-05',
    sentAt: '2026-02-03T15:30:00.000Z',
    paidAt: null,
    notes: 'Voided and replaced after scope correction.',
    items: [
      ['Unused rush production estimate', 5, 12500],
      ['Draft collateral resizing', 3, 12500],
    ],
  },
  {
    projectName: 'Marketing Website Optimization',
    invoiceNumber: 'INV-2026-003',
    status: 'sent',
    issueDate: '2026-06-14',
    dueDate: '2026-07-14',
    sentAt: '2026-06-14T13:05:00.000Z',
    paidAt: null,
    notes: 'June optimization sprint.',
    items: [
      ['Landing page copy and layout testing', 9, 11500],
      ['Analytics event cleanup', 4, 11500],
      ['Conversion report preparation', 2, 11500],
    ],
  },
  {
    projectName: 'Client Portal Planning',
    invoiceNumber: 'INV-2026-004',
    status: 'paid',
    issueDate: '2026-01-22',
    dueDate: '2026-02-21',
    sentAt: '2026-01-22T14:00:00.000Z',
    paidAt: '2026-02-12T20:10:00.000Z',
    notes: 'Discovery phase completed.',
    items: [
      ['Security requirements workshop', 5, 14000],
      ['Architecture planning and estimates', 10, 14000],
      ['Roadmap presentation', 3, 14000],
    ],
  },
  {
    projectName: 'Document Workflow Automation',
    invoiceNumber: 'INV-2026-005',
    status: 'overdue',
    issueDate: '2026-03-17',
    dueDate: '2026-04-16',
    sentAt: '2026-03-17T17:20:00.000Z',
    paidAt: null,
    notes: 'Awaiting operations approval.',
    items: [
      ['Form intake mapping', 7, 15000],
      ['Automation prototype build', 12, 15000],
      ['Review queue configuration', 6, 15000],
      ['Internal demo and revisions', 2, 15000],
    ],
  },
  {
    projectName: 'Document Workflow Automation',
    invoiceNumber: 'INV-2026-006',
    status: 'draft',
    issueDate: '2026-06-26',
    dueDate: '2026-07-26',
    sentAt: null,
    paidAt: null,
    notes: 'Draft for current implementation work.',
    items: [
      ['Template generation rules', 8, 15000],
      ['Reviewer notification workflow', 5, 15000],
      ['QA pass and bug fixes', 4, 15000],
    ],
  },
  {
    projectName: 'Membership Dashboard',
    invoiceNumber: 'INV-2026-007',
    status: 'sent',
    issueDate: '2026-05-29',
    dueDate: '2026-06-28',
    sentAt: '2026-05-29T12:45:00.000Z',
    paidAt: null,
    notes: 'Dashboard build milestone.',
    items: [
      ['Retention metric modeling', 6, 10500],
      ['Manager dashboard implementation', 15, 10500],
      ['Data export view', 4, 10500],
    ],
  },
  {
    projectName: 'Membership Dashboard',
    invoiceNumber: 'INV-2026-008',
    status: 'draft',
    issueDate: '2026-06-30',
    dueDate: '2026-07-30',
    sentAt: null,
    paidAt: null,
    notes: 'Draft for reporting refinements.',
    items: [
      ['Weekly cohort chart refinements', 5, 10500],
      ['Studio comparison filters', 6, 10500],
    ],
  },
  {
    projectName: 'Spring Campaign Assets',
    invoiceNumber: 'INV-2026-009',
    status: 'paid',
    issueDate: '2026-02-19',
    dueDate: '2026-03-21',
    sentAt: '2026-02-19T18:00:00.000Z',
    paidAt: '2026-03-08T16:35:00.000Z',
    notes: 'Campaign asset package.',
    items: [
      ['Email template design', 6, 9500],
      ['Paid social ad variants', 8, 9500],
      ['Campaign performance summary', 3, 9500],
    ],
  },
  {
    projectName: 'Property Listing Platform',
    invoiceNumber: 'INV-2026-010',
    status: 'overdue',
    issueDate: '2026-04-10',
    dueDate: '2026-05-10',
    sentAt: '2026-04-10T11:15:00.000Z',
    paidAt: null,
    notes: 'Listing platform implementation milestone.',
    items: [
      ['Listing detail page build', 11, 13000],
      ['Lead capture integration', 7, 13000],
      ['Broker admin permissions', 5, 13000],
    ],
  },
  {
    projectName: 'Property Listing Platform',
    invoiceNumber: 'INV-2026-011',
    status: 'sent',
    issueDate: '2026-06-05',
    dueDate: '2026-07-05',
    sentAt: '2026-06-05T14:25:00.000Z',
    paidAt: null,
    notes: 'Map and search improvements.',
    items: [
      ['Search filter improvements', 8, 13000],
      ['Map marker clustering', 6, 13000],
      ['Mobile listing QA', 4, 13000],
    ],
  },
  {
    projectName: 'Sales Collateral System',
    invoiceNumber: 'INV-2026-012',
    status: 'paid',
    issueDate: '2026-03-04',
    dueDate: '2026-04-03',
    sentAt: '2026-03-04T10:50:00.000Z',
    paidAt: '2026-03-29T19:05:00.000Z',
    notes: 'Template system delivery.',
    items: [
      ['Template component library', 9, 11000],
      ['Neighborhood flyer layouts', 7, 11000],
      ['Content publishing documentation', 3, 11000],
    ],
  },
]

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

const seed = db.transaction(() => {
  db.exec(`
    DELETE FROM invoice_line_items;
    DELETE FROM invoices;
    DELETE FROM projects;
    DELETE FROM clients;
  `)

  const projectIdsByName = new Map()

  for (const client of clients) {
    const clientId = insertClient.run(client).lastInsertRowid

    for (const project of client.projects) {
      const projectId = insertProject.run({
        clientId,
        name: project.name,
        description: project.description,
        status: project.status,
        hourlyRateCents: project.hourlyRateCents,
      }).lastInsertRowid

      projectIdsByName.set(project.name, projectId)
    }
  }

  for (const invoice of invoiceData) {
    const projectId = projectIdsByName.get(invoice.projectName)

    if (!projectId) {
      throw new Error(`Missing project for invoice ${invoice.invoiceNumber}`)
    }

    const lineItems = invoice.items.map(([description, quantity, unitPriceCents], index) => ({
      position: index,
      description,
      quantity,
      unitPriceCents,
      lineTotalCents: Math.round(quantity * unitPriceCents),
    }))
    const totalCents = lineItems.reduce((total, item) => total + item.lineTotalCents, 0)
    const paidCents = invoice.status === 'paid' ? totalCents : 0
    const invoiceId = insertInvoice.run({
      projectId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: 'USD',
      subtotalCents: totalCents,
      totalCents,
      paidCents,
      sentAt: invoice.sentAt,
      paidAt: invoice.paidAt,
      notes: invoice.notes,
    }).lastInsertRowid

    for (const item of lineItems) {
      insertLineItem.run({
        invoiceId,
        ...item,
      })
    }
  }
})

seed()
