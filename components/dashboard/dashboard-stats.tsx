"use client"

import { useQuery } from "@tanstack/react-query"
import { Loan } from "@prisma/client"
import { Loader2 } from "lucide-react"

export function DashboardStats() {
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const response = await fetch("/api/loans")
      if (!response.ok) throw new Error("Error al cargar los préstamos")
      return response.json() as Promise<Loan[]>
    },
  })

  const activeLoans = loans.filter(loan => !loan.returned_at && new Date(loan.return_by) >= new Date())
  const overdueLoans = loans.filter(loan => !loan.returned_at && new Date(loan.return_by) < new Date())
  const returnedLoans = loans.filter(loan => loan.returned_at)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
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
  )
}