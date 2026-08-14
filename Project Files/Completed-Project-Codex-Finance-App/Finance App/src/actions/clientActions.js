'use server'

import {
  createClient,
  deleteClient,
  updateClient,
} from '../lib/services.js'

function result(data = null, error = null) {
  return { data, error }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

function formDataToObject(input) {
  if (!(input instanceof FormData)) {
    return input
  }

  return Object.fromEntries(input.entries())
}

export async function createClientAction(input) {
  const data = formDataToObject(input)

  if (!data?.name || String(data.name).trim() === '') {
    return result(null, 'Client name is required')
  }

  try {
    return result(createClient(data), null)
  } catch (error) {
    return result(null, errorMessage(error))
  }
}

export async function updateClientAction(id, data) {
  try {
    return result(updateClient(id, formDataToObject(data)), null)
  } catch (error) {
    return result(null, errorMessage(error))
  }
}

export async function deleteClientAction(id) {
  try {
    deleteClient(id)
    return result(true, null)
  } catch (error) {
    const message = errorMessage(error)

    if (message.includes('because it has projects')) {
      return result(
        null,
        'Cannot delete this client because projects are still assigned to it.',
      )
    }

    return result(null, message)
  }
}
