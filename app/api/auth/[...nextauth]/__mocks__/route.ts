// Mock NextAuth handlers
export const GET = jest.fn()
export const POST = jest.fn()

// Mock authOptions
export const authOptions = {
  providers: [],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    jwt: jest.fn(),
    session: jest.fn(),
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: 'test-secret',
}