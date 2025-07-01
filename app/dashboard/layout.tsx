import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { MainNav } from '@/components/dashboard/main-nav'
import { authOptions } from '@/lib/auth/authOptions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav userEmail={session.user?.email || ''} />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}