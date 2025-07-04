'use client'

import { useState } from 'react'
import { Loan, LoanPhoto } from '@prisma/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoanForm } from '@/components/loans/loan-form'
import { ReturnLoanDialog } from '@/components/loans/return-loan-dialog'
import Link from 'next/link'
import { Search, Loader2 } from 'lucide-react'

type LoanWithPhotos = Loan & {
  photos: LoanPhoto[]
}

interface DashboardClientProps {
  activeLoans: LoanWithPhotos[]
  overdueLoans: LoanWithPhotos[]
  returnedLoans: LoanWithPhotos[]
}

export function DashboardClient({
  activeLoans: initialActiveLoans,
  overdueLoans: initialOverdueLoans,
  returnedLoans: initialReturnedLoans,
}: DashboardClientProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all')
  const [search, setSearch] = useState('')

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const response = await fetch('/api/loans')
      if (!response.ok) throw new Error('Error al cargar los préstamos')
      return response.json() as Promise<LoanWithPhotos[]>
    },
    initialData: [...initialActiveLoans, ...initialOverdueLoans, ...initialReturnedLoans],
  })

  const activeLoans = loans.filter(loan => !loan.returned_at && new Date(loan.return_by) >= new Date())
  const overdueLoans = loans.filter(loan => !loan.returned_at && new Date(loan.return_by) < new Date())
  const returnedLoans = loans.filter(loan => loan.returned_at)
  const allLoans = loans
  
  let filteredLoans = allLoans
  
  switch (filter) {
    case 'active':
      filteredLoans = activeLoans
      break
    case 'overdue':
      filteredLoans = overdueLoans
      break
    case 'returned':
      filteredLoans = returnedLoans
      break
  }

  if (search) {
    filteredLoans = filteredLoans.filter(
      loan =>
        loan.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
        loan.item_name.toLowerCase().includes(search.toLowerCase())
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar préstamos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-[300px]"
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'overdue' | 'returned')}
            className="px-3 py-2 rounded-md border bg-background"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="overdue">Vencidos</option>
            <option value="returned">Devueltos</option>
          </select>
        </div>

        <LoanForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLoans.map((loan) => {
          const isOverdue = !loan.returned_at && new Date(loan.return_by) < new Date()
          
          return (
            <div
              key={loan.id}
              className="bg-card p-4 rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">{loan.item_name}</h3>
                  {isOverdue && (
                    <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                      Vencido
                    </span>
                  )}
                  {loan.returned_at && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                      Devuelto
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Prestado a: {loan.recipient_name}
                </p>
                
                <p className="text-sm">
                  Cantidad: {loan.quantity}
                </p>
                
                <div className="text-sm text-muted-foreground">
                  <p>
                    Prestado el: {format(new Date(loan.borrowed_at), 'dd/MM/yyyy', { locale: es })}
                  </p>
                  <p>
                    Devolver antes del: {format(new Date(loan.return_by), 'dd/MM/yyyy', { locale: es })}
                  </p>
                  {loan.returned_at && (
                    <p>
                      Devuelto el: {format(new Date(loan.returned_at), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Link href={`/loans/${loan.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Ver detalles
                    </Button>
                  </Link>
                  {!loan.returned_at && (
                    <div className="flex-1">
                      <ReturnLoanDialog loan={loan} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Cargando préstamos...</p>
        </div>
      )}

      {!isLoading && filteredLoans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron préstamos</p>
        </div>
      )}
    </div>
  )
}