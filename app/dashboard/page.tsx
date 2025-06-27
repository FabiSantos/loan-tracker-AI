import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export default async function DashboardPage() {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      loans: {
        include: {
          photos: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      },
    },
  })

  if (!user) {
    redirect('/auth/login')
  }

  const activeLoans = user.loans.filter(loan => !loan.returned_at)
  const overdueLoans = activeLoans.filter(
    loan => new Date(loan.return_by) < new Date()
  )
  const returnedLoans = user.loans.filter(loan => loan.returned_at)

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">
            Préstamos Activos
          </h3>
          <p className="text-3xl font-bold mt-2">{activeLoans.length}</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">
            Préstamos Vencidos
          </h3>
          <p className="text-3xl font-bold mt-2 text-destructive">
            {overdueLoans.length}
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">
            Préstamos Devueltos
          </h3>
          <p className="text-3xl font-bold mt-2">{returnedLoans.length}</p>
        </div>
      </div>

      <DashboardClient 
        activeLoans={activeLoans}
        overdueLoans={overdueLoans}
        returnedLoans={returnedLoans}
      />
    </div>
  )
}