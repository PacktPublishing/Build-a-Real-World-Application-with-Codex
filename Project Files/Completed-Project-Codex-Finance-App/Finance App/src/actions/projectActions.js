'use server'

import {
  createProject,
  deleteProject,
  updateProject,
} from '../lib/services.js'

function result(data = null, error = null) {
  return { data, error }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

export async function createProjectAction(data) {
  if (!data?.clientId || String(data.clientId).trim() === '') {
    return result(null, 'Client is required')
  }

  if (!data?.name || String(data.name).trim() === '') {
    return result(null, 'Project name is required')
  }

  try {
    return result(createProject(data), null)
  } catch (error) {
    return result(null, errorMessage(error))
  }
}

export async function updateProjectAction(id, data) {
  try {
    return result(updateProject(id, data), null)
  } catch (error) {
    return result(null, errorMessage(error))
  }
}

export async function deleteProjectAction(id) {
  try {
    deleteProject(id)
    return result(true, null)
  } catch (error) {
    const message = errorMessage(error)

    if (message.includes('because it has invoices')) {
      return result(
        null,
        'Cannot delete this project because invoices are still assigned to it.',
      )
    }

    return result(null, message)
  }
}
