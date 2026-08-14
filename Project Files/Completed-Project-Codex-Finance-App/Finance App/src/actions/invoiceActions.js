'use server'

import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  updateInvoice,
} from '../lib/services.js'

const INVOICE_STATUSES = new Set(['draft', 'sent', 'paid', 'overdue', 'void'])

function result(data = null, error = null) {
  return { data, error }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

export async function createInvoiceAction(data) {
  if (!data?.projectId || String(data.projectId).trim() === '') {
    return result(null, 'Project is required')
  }

  if (!data?.invoiceNumber || String(data.invoiceNumber).trim() === '') {
    return result(null, 'Invoice number is required')
  }

  if (!data?.issueDate || String(data.issueDate).trim() === '') {
    return result(null, 'Issue date is required')
  }

  if (!Array.isArray(data.lineItems) || data.lineItems.length === 0) {
    return result(null, 'At least one invoice line item is required')
  }

  try {
    return result(createInvoice(data), null)
  } catch (error) {
    return result(null, errorMessage(error))
  }
}

export async function updateInvoiceAction(id, data) {
  try {
    return result(updateInvoice(id, data), null)
  } catch (error) {
    return result(null, errorMessage(error))
  }
}

export async function deleteInvoiceAction(id) {
  try {
    deleteInvoice(id)
    return result(true, null)
  } catch (error) {
    return result(null, errorMessage(error))
  }
}

export async function updateInvoiceStatusAction(id, status) {
  if (!INVOICE_STATUSES.has(status)) {
    return result(null, `Invalid invoice status: ${status}`)
  }

  try {
    const invoice = getInvoiceById(id)

    if (!invoice) {
      return result(null, `Invoice ${id} not found`)
    }

    const nextInvoice = {
      ...invoice,
      status,
      paidCents: status === 'paid' ? invoice.totalCents : invoice.paidCents,
      paidAt: status === 'paid' ? (invoice.paidAt || new Date().toISOString()) : invoice.paidAt,
    }

    return result(updateInvoice(id, nextInvoice), null)
  } catch (error) {
    return result(null, errorMessage(error))
  }
}
