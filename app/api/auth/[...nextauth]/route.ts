import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/lib/validations/auth'

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null

        const validation = loginSchema.safeParse(credentials)
        if (!validation.success) return null

        const user = await prisma.user.findUnique({
          where: { email: validation.data.email },
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(
          validation.data.password,
          user.password_hash
        )

        if (!isPasswordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.email,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
})

export { handler as GET, handler as POST }