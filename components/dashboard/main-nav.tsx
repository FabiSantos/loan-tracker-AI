'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LogOut, Package } from 'lucide-react'

interface MainNavProps {
  userEmail: string
}

export function MainNav({ userEmail }: MainNavProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              <span className="font-semibold text-lg">Loan Tracker</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/loans/new"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Nuevo Préstamo
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {userEmail}
            </span>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}