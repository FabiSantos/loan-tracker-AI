import { PATCH } from '../route'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    loan: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      ...init,
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

describe('Return Loan API /api/loans/[id]/return', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/loans/123/return', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    
    const response = await PATCH(request, { params: Promise.resolve({ id: '123' }) })

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'No autorizado' },
      { status: 401 }
    )
  })

  it('returns 404 when loan not found', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    })
    ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/loans/123/return', {
      method: 'PATCH',
      body: JSON.stringify({ 
        state_end: 'Good',
        returned_at: new Date().toISOString()
      }),
    })
    
    const response = await PATCH(request, { params: Promise.resolve({ id: '123' }) })

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Préstamo no encontrado' },
      { status: 404 }
    )
  })

  it('returns 400 when loan already returned', async () => {
    const mockLoan = {
      id: '123',
      user_id: 'user-1',
      returned_at: new Date(),
    }

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    })
    ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue(mockLoan)

    const request = new Request('http://localhost:3000/api/loans/123/return', {
      method: 'PATCH',
      body: JSON.stringify({ 
        state_end: 'Good',
        returned_at: new Date().toISOString()
      }),
    })
    
    const response = await PATCH(request, { params: Promise.resolve({ id: '123' }) })

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Este préstamo ya fue devuelto' },
      { status: 400 }
    )
  })

  it('returns 400 for invalid data', async () => {
    const mockLoan = {
      id: '123',
      user_id: 'user-1',
      returned_at: null,
    }

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    })
    ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue(mockLoan)

    const request = new Request('http://localhost:3000/api/loans/123/return', {
      method: 'PATCH',
      body: JSON.stringify({}), // Missing state_end
    })
    
    const response = await PATCH(request, { params: Promise.resolve({ id: '123' }) })

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Datos inválidos',
      }),
      { status: 400 }
    )
  })

  it('marks loan as returned successfully', async () => {
    const mockLoan = {
      id: '123',
      user_id: 'user-1',
      returned_at: null,
    }
    const returnedLoan = {
      ...mockLoan,
      returned_at: new Date(),
      state_end: 'Good',
    }

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    })
    ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue(mockLoan)
    ;(prisma.loan.update as jest.Mock).mockResolvedValue(returnedLoan)

    const request = new Request('http://localhost:3000/api/loans/123/return', {
      method: 'PATCH',
      body: JSON.stringify({ 
        state_end: 'Good',
        returned_at: new Date().toISOString()
      }),
    })
    
    const response = await PATCH(request, { params: Promise.resolve({ id: '123' }) })

    expect(prisma.loan.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: {
        returned_at: expect.any(Date),
        state_end: 'Good',
      },
    })
    expect(NextResponse.json).toHaveBeenCalledWith(returnedLoan)
  })

  it('handles database errors', async () => {
    const mockLoan = {
      id: '123',
      user_id: 'user-1',
      returned_at: null,
    }

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    })
    ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue(mockLoan)
    ;(prisma.loan.update as jest.Mock).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost:3000/api/loans/123/return', {
      method: 'PATCH',
      body: JSON.stringify({ 
        state_end: 'Good',
        returned_at: new Date().toISOString()
      }),
    })
    
    const response = await PATCH(request, { params: Promise.resolve({ id: '123' }) })

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Error al marcar el préstamo como devuelto' },
      { status: 500 }
    )
  })
})