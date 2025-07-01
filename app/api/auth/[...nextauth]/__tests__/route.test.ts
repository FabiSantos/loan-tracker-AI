// Mock the jose module to prevent ESM issues
jest.mock('jose', () => ({}), { virtual: true })

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

// Mock dependencies
jest.mock('bcryptjs')
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock the adapter
jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({})),
}))

// Import authOptions instead of the handlers to test configuration
import { authOptions } from '../route'

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('has correct session strategy', () => {
    expect(authOptions.session?.strategy).toBe('jwt')
  })

  it('has correct pages configuration', () => {
    expect(authOptions.pages).toEqual({
      signIn: '/auth/login',
      signOut: '/auth/logout',
      error: '/auth/error',
    })
  })

  describe('authorize callback', () => {
    let authorizeCallback: any

    beforeEach(() => {
      authorizeCallback = authOptions.providers[0].authorize
    })

    it('returns null if no credentials provided', async () => {
      const result = await authorizeCallback(null)
      expect(result).toBeNull()
    })

    it('returns null if credentials are invalid', async () => {
      const result = await authorizeCallback({ email: 'invalid-email', password: '' })
      expect(result).toBeNull()
    })

    it('returns null if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

      const result = await authorizeCallback({
        email: 'test@example.com',
        password: 'password',
      })

      expect(result).toBeNull()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('returns null if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password_hash: 'hashed_password',
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)

      const result = await authorizeCallback({
        email: 'test@example.com',
        password: 'wrong_password',
      })

      expect(result).toBeNull()
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password')
    })

    it('returns user data if authentication is successful', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password_hash: 'hashed_password',
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)

      const result = await authorizeCallback({
        email: 'test@example.com',
        password: 'correct_password',
      })

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'test@example.com',
      })
    })
  })

  describe('callbacks', () => {
    it('adds user id to jwt token', async () => {
      const token = { sub: '123' }
      const user = { id: 'user-1', email: 'test@example.com' }

      const result = await authOptions.callbacks.jwt({ token, user })

      expect(result).toEqual({
        sub: '123',
        id: 'user-1',
      })
    })

    it('preserves token if no user provided', async () => {
      const token = { sub: '123', id: 'existing-id' }

      const result = await authOptions.callbacks.jwt({ token })

      expect(result).toEqual(token)
    })

    it('adds user id to session', async () => {
      const session = {
        user: { email: 'test@example.com' },
        expires: '2024-01-01',
      }
      const token = { id: 'user-1' }

      const result = await authOptions.callbacks.session({ session, token })

      expect(result.user.id).toBe('user-1')
    })

    it('handles session without user', async () => {
      const session = { expires: '2024-01-01' }
      const token = { id: 'user-1' }

      const result = await authOptions.callbacks.session({ session, token })

      expect(result).toEqual(session)
    })
  })
})