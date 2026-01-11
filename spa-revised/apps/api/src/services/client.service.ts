/**
 * Client Management Service
 * Handles client profile management, search, history, and notes
 */

import { prisma } from '@pecase/database'

export interface CreateClientData {
  firstName: string
  lastName: string
  phone: string
  email?: string
  address?: string
  birthday?: Date
  notes?: string
  preferredStaffId?: string
  preferredServiceId?: string
}

export interface UpdateClientData {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  address?: string
  birthday?: Date
  notes?: string
  preferredStaffId?: string
  preferredServiceId?: string
  isActive?: boolean
}

export interface ClientProfileResponse {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  address?: string
  birthday?: Date
  notes?: string
  preferredStaffId?: string
  preferredServiceId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  preferredStaff?: {
    id: string
    firstName: string
    lastName: string
  }
  preferredService?: {
    id: string
    name: string
  }
}

/**
 * Search clients by name, email, or phone (partial match, case-insensitive)
 */
export async function searchClients(
  salonId: string,
  query: string,
  limit: number = 20
): Promise<any[]> {
  try {
    if (!query || query.trim().length === 0) {
      // Return recent clients if no query
      return await prisma.client.findMany({
        where: {
          salonId,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          createdAt: true,
          appointments: {
            select: {
              startTime: true,
            },
            orderBy: {
              startTime: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })
    }

    const searchQuery = query.toLowerCase().trim()

    return await prisma.client.findMany({
      where: {
        salonId,
        isActive: true,
        OR: [
          {
            firstName: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        createdAt: true,
        appointments: {
          select: {
            startTime: true,
          },
          orderBy: {
            startTime: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
  } catch (error) {
    throw error
  }
}

/**
 * Get full client profile with appointment history
 */
export async function getClientProfile(clientId: string): Promise<ClientProfileResponse> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        preferredStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        preferredService: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    return {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email || undefined,
      address: client.address || undefined,
      birthday: client.birthday || undefined,
      notes: client.notes || undefined,
      preferredStaffId: client.preferredStaffId || undefined,
      preferredServiceId: client.preferredServiceId || undefined,
      isActive: client.isActive,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      preferredStaff: client.preferredStaff || undefined,
      preferredService: client.preferredService || undefined,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Create a new client
 */
export async function createClient(
  salonId: string,
  data: CreateClientData
): Promise<ClientProfileResponse> {
  try {
    // Check if client with same phone already exists in salon
    const existingClient = await prisma.client.findFirst({
      where: {
        salonId,
        phone: data.phone,
      },
    })

    if (existingClient) {
      throw new Error('Client with this phone number already exists in this salon')
    }

    const client = await prisma.client.create({
      data: {
        salonId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        birthday: data.birthday,
        notes: data.notes,
        preferredStaffId: data.preferredStaffId,
        preferredServiceId: data.preferredServiceId,
      },
      include: {
        preferredStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        preferredService: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email || undefined,
      address: client.address || undefined,
      birthday: client.birthday || undefined,
      notes: client.notes || undefined,
      preferredStaffId: client.preferredStaffId || undefined,
      preferredServiceId: client.preferredServiceId || undefined,
      isActive: client.isActive,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      preferredStaff: client.preferredStaff || undefined,
      preferredService: client.preferredService || undefined,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Update client information
 */
export async function updateClient(clientId: string, data: UpdateClientData): Promise<ClientProfileResponse> {
  try {
    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.birthday !== undefined && { birthday: data.birthday }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.preferredStaffId !== undefined && { preferredStaffId: data.preferredStaffId }),
        ...(data.preferredServiceId !== undefined && { preferredServiceId: data.preferredServiceId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        preferredStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        preferredService: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email || undefined,
      address: client.address || undefined,
      birthday: client.birthday || undefined,
      notes: client.notes || undefined,
      preferredStaffId: client.preferredStaffId || undefined,
      preferredServiceId: client.preferredServiceId || undefined,
      isActive: client.isActive,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      preferredStaff: client.preferredStaff || undefined,
      preferredService: client.preferredService || undefined,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Add a note to a client profile
 */
export async function addClientNote(clientId: string, staffId: string, content: string): Promise<any> {
  try {
    const note = await prisma.clientNote.create({
      data: {
        clientId,
        staffId,
        content,
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return {
      id: note.id,
      clientId: note.clientId,
      content: note.content,
      createdAt: note.createdAt,
      staff: note.staff,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get all appointments and notes for a client
 */
export async function getClientHistory(clientId: string): Promise<any> {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { clientId },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        durationMinutes: true,
        price: true,
        priceOverride: true,
        notes: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    })

    const notes = await prisma.clientNote.findMany({
      where: { clientId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      appointments,
      notes,
    }
  } catch (error) {
    throw error
  }
}
