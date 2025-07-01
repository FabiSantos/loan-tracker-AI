import { GET, POST } from '../route'
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
      findMany: jest.fn(),
      create: jest.fn(),
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

describe('Loans API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/loans', () => {
    it('returns 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/loans')
      const response = await GET(request)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'No autorizado' },
        { status: 401 }
      )
    })

    it('returns 401 when session has no email', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {},
      })

      const request = new Request('http://localhost:3000/api/loans')
      const response = await GET(request)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'No autorizado' },
        { status: 401 }
      )
    })

    it('returns loans for authenticated user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      }
      const mockLoans = [
        {
          id: '1',
          item_name: 'Book',
          recipient_name: 'John Doe',
          borrowed_at: new Date(),
          return_by: new Date(),
        },
      ]

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.loan.findMany as jest.Mock).mockResolvedValue(mockLoans)

      const request = new Request('http://localhost:3000/api/loans')
      const response = await GET(request)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(prisma.loan.findMany).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        orderBy: { created_at: 'desc' },
      })
      expect(NextResponse.json).toHaveBeenCalledWith(mockLoans)
    })

    it('returns 404 when user not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/loans')
      const response = await GET(request)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    })
  })

  describe('POST /api/loans', () => {
    it('returns 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/loans', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'No autorizado' },
        { status: 401 }
      )
    })

    it('returns 400 for invalid data', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      const request = new Request('http://localhost:3000/api/loans', {
        method: 'POST',
        body: JSON.stringify({ item_name: 'Book' }), // Missing required fields
      })
      const response = await POST(request)

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Datos inválidos',
        }),
        { status: 400 }
      )
    })

    it('creates loan successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      }
      const newLoan = {
        id: 'loan-1',
        user_id: 'user-1',
        item_name: 'Book',
        recipient_name: 'John Doe',
        quantity: 1,
        state_start: 'Good',
        borrowed_at: new Date(),
        return_by: new Date(),
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.loan.create as jest.Mock).mockResolvedValue(newLoan)

      const request = new Request('http://localhost:3000/api/loans', {
        method: 'POST',
        body: JSON.stringify({
          item_name: 'Book',
          recipient_name: 'John Doe',
          quantity: 1,
          state_start: 'Good',
          borrowed_at: new Date().toISOString(),
          return_by: new Date().toISOString(),
        }),
      })
      const response = await POST(request)

      expect(prisma.loan.create).toHaveBeenCalledWith({
        data: {
          user_id: 'user-1',
          item_name: 'Book',
          recipient_name: 'John Doe',
          quantity: 1,
          state_start: 'Good',
          borrowed_at: expect.any(Date),
          return_by: expect.any(Date),
          description: undefined,
        },
      })
      expect(NextResponse.json).toHaveBeenCalledWith(newLoan)
    })

    it('handles database errors', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.create as jest.Mock).mockRejectedValue(new Error('DB Error'))

      const request = new Request('http://localhost:3000/api/loans', {
        method: 'POST',
        body: JSON.stringify({
          item_name: 'Book',
          recipient_name: 'John Doe',
          quantity: 1,
          state_start: 'Good',
          borrowed_at: new Date().toISOString(),
          return_by: new Date().toISOString(),
        }),
      })
      const response = await POST(request)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Error al crear el préstamo' },
        { status: 500 }
      )
    })
  })
})