// Simple test to increase coverage without dealing with ESM issues
import { authOptions } from '../route'

describe('NextAuth Route - Simple Tests', () => {
  it('exports authOptions with correct structure', () => {
    expect(authOptions).toBeDefined()
    expect(authOptions.providers).toBeDefined()
    expect(authOptions.providers.length).toBeGreaterThan(0)
    expect(authOptions.session).toBeDefined()
    expect(authOptions.session.strategy).toBe('jwt')
    expect(authOptions.pages).toBeDefined()
    expect(authOptions.pages.signIn).toBe('/auth/login')
    expect(authOptions.callbacks).toBeDefined()
    expect(authOptions.callbacks.jwt).toBeDefined()
    expect(authOptions.callbacks.session).toBeDefined()
  })

  it('has credentials provider', () => {
    const credentialsProvider = authOptions.providers[0]
    expect(credentialsProvider.id).toBe('credentials')
    expect(credentialsProvider.name).toBe('credentials')
    expect(credentialsProvider.type).toBe('credentials')
    expect(credentialsProvider.credentials).toBeDefined()
    expect(credentialsProvider.credentials.email).toBeDefined()
    expect(credentialsProvider.credentials.password).toBeDefined()
  })

  it('has correct page routes', () => {
    expect(authOptions.pages).toEqual({
      signIn: '/auth/login',
      signOut: '/auth/logout',
      error: '/auth/error',
    })
  })

  it('callbacks are functions', () => {
    expect(typeof authOptions.callbacks.jwt).toBe('function')
    expect(typeof authOptions.callbacks.session).toBe('function')
  })

  it('has authorize function in credentials provider', () => {
    const credentialsProvider = authOptions.providers[0]
    expect(typeof credentialsProvider.authorize).toBe('function')
  })
})