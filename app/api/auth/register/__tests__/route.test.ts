import { POST } from '../route'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

// Mock dependencies
jest.mock('bcryptjs')
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
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

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn() // Mock console.error
  })

  it('returns 400 for invalid data', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email', password: '123' }),
    })

    const response = await POST(request)

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Datos inválidos',
        errors: expect.any(Object),
      }),
      { status: 400 }
    )
  })

  it('returns 400 if user already exists', async () => {
    const existingUser = {
      id: '1',
      email: 'existing@example.com',
      password_hash: 'hash',
    }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(existingUser)

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'Password123',
      }),
    })

    const response = await POST(request)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'El email ya está registrado' },
      { status: 400 }
    )
  })

  it('creates user successfully', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null)
    ;(bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password')
    ;(prisma.user.create as jest.Mock).mockResolvedValueOnce({
      id: 'new-user-id',
      email: 'new@example.com',
      password_hash: 'hashed_password',
    })

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'Password123',
      }),
    })

    const response = await POST(request)

    expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'new@example.com',
        password_hash: 'hashed_password',
      },
    })
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        message: 'Usuario creado exitosamente',
        userId: 'new-user-id',
      },
      { status: 201 }
    )
  })

  it('handles database errors', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockRejectedValueOnce(
      new Error('Database error')
    )

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
      }),
    })

    const response = await POST(request)

    expect(console.error).toHaveBeenCalledWith(
      'Error en registro:',
      expect.any(Error)
    )
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Error al crear usuario' },
      { status: 500 }
    )
  })

  it('handles JSON parsing errors', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: 'invalid json',
    })

    const response = await POST(request)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Error al crear usuario' },
      { status: 500 }
    )
  })
})