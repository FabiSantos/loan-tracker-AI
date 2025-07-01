import { GET } from '../route'
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

describe('Loan API /api/loans/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/loans/[id]', () => {
    it('returns 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/loans/123')
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) })

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

      const request = new Request('http://localhost:3000/api/loans/123')
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    })

    it('returns loan data when found', async () => {
      const mockLoan = {
        id: '123',
        user_id: 'user-1',
        item_name: 'Book',
        recipient_name: 'John Doe',
        photos: [],
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue(mockLoan)

      const request = new Request('http://localhost:3000/api/loans/123')
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) })

      expect(prisma.loan.findFirst).toHaveBeenCalledWith({
        where: {
          id: '123',
          user_id: 'user-1',
        },
        include: {
          photos: true,
          reminders: true,
        },
      })
      expect(NextResponse.json).toHaveBeenCalledWith(mockLoan)
    })
  })
})