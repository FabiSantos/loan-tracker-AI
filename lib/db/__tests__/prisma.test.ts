import { prisma } from '../prisma'

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    loan: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  }
})

describe('Prisma Client', () => {
  it('exports prisma instance', () => {
    expect(prisma).toBeDefined()
  })

  it('has expected methods', () => {
    expect(prisma.$connect).toBeDefined()
    expect(prisma.$disconnect).toBeDefined()
    expect(prisma.user).toBeDefined()
    expect(prisma.loan).toBeDefined()
  })

  it('creates singleton instance in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    // Clear module cache to force re-import
    jest.resetModules()
    
    const { prisma: prisma1 } = require('../prisma')
    const { prisma: prisma2 } = require('../prisma')
    
    expect(prisma1).toBe(prisma2)
    
    process.env.NODE_ENV = originalEnv
  })

  it('creates new instance in production', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    // Clear module cache to force re-import
    jest.resetModules()
    jest.unmock('@prisma/client')
    jest.mock('@prisma/client', () => {
      const mockPrismaClient = {
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      }
      return {
        PrismaClient: jest.fn(() => mockPrismaClient),
      }
    })
    
    const { prisma: prodPrisma } = require('../prisma')
    
    expect(prodPrisma).toBeDefined()
    
    process.env.NODE_ENV = originalEnv
  })
})