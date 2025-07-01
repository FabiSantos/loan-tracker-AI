import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/auth')
  
  // Allow API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  
  // Redirect to login if not authenticated and not on auth page
  if (!token && !isAuthPage) {
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // Redirect to dashboard if authenticated and on auth page
  if (token && isAuthPage) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/loans/:path*',
    '/auth/:path*',
  ],
}