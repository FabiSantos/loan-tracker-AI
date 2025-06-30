"use client"

import { useState } from "react"
import { Loan, LoanPhoto, ReminderLog } from "@prisma/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { 
  ArrowLeft, 
  Calendar, 
  Package, 
  User, 
  Hash, 
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReturnLoanDialog } from "@/components/loans/return-loan-dialog"
import { PhotoUpload } from "@/components/loans/photo-upload"
import { Badge } from "@/components/ui/badge"
import { ImageViewer } from "@/components/ui/image-viewer"
import Link from "next/link"

type LoanWithRelations = Loan & {
  photos: LoanPhoto[]
  reminders: ReminderLog[]
}

interface LoanDetailsClientProps {
  loan: LoanWithRelations
}

export function LoanDetailsClient({ loan: initialLoan }: LoanDetailsClientProps) {
  const router = useRouter()
  
  // Usar React Query para obtener datos actualizados
  const { data: loan = initialLoan, isLoading, refetch } = useQuery({
    queryKey: ["loan", initialLoan.id],
    queryFn: async () => {
      const response = await fetch(`/api/loans/${initialLoan.id}`)
      if (!response.ok) throw new Error("Error al cargar el préstamo")
      return response.json() as Promise<LoanWithRelations>
    },
    initialData: initialLoan,
  })

  const isOverdue = !loan.returned_at && new Date(loan.return_by) < new Date()
  const isReturned = !!loan.returned_at

  const getStatusBadge = () => {
    if (isReturned) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="mr-1 h-3 w-3" />
          Devuelto
        </Badge>
      )
    }
    if (isOverdue) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          Vencido
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <Clock className="mr-1 h-3 w-3" />
        Activo
      </Badge>
    )
  }

  const getDaysRemaining = () => {
    if (loan.returned_at) return null
    
    const today = new Date()
    const returnDate = new Date(loan.return_by)
    const diffTime = returnDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return <span className="text-destructive">{Math.abs(diffDays)} días de retraso</span>
    } else if (diffDays === 0) {
      return <span className="text-warning">Vence hoy</span>
    } else {
      return <span>{diffDays} días restantes</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Button>
        {!loan.returned_at && (
          <ReturnLoanDialog loan={loan} />
        )}
      </div>

      {/* Main Card */}
      <div className="bg-card rounded-lg border p-6 space-y-6">
        {/* Title and Status */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{loan.item_name}</h1>
            <p className="text-muted-foreground mt-1">
              Prestado a {loan.recipient_name}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Prestatario</p>
                <p className="text-sm text-muted-foreground">{loan.recipient_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Artículo</p>
                <p className="text-sm text-muted-foreground">{loan.item_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Cantidad</p>
                <p className="text-sm text-muted-foreground">{loan.quantity}</p>
              </div>
            </div>

            {loan.description && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Descripción</p>
                  <p className="text-sm text-muted-foreground">{loan.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Fecha de préstamo</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(loan.borrowed_at), "PPP", { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Fecha de devolución esperada</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(loan.return_by), "PPP", { locale: es })}
                </p>
                {getDaysRemaining() && (
                  <p className="text-sm mt-1">{getDaysRemaining()}</p>
                )}
              </div>
            </div>

            {loan.returned_at && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fecha de devolución real</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(loan.returned_at), "PPP", { locale: es })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estados */}
        <div className="border-t pt-4 space-y-3">
          <h3 className="font-medium">Estado del artículo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Estado inicial</p>
              <p className="text-sm font-medium">{loan.state_start}</p>
            </div>
            {loan.state_end && (
              <div>
                <p className="text-sm text-muted-foreground">Estado final</p>
                <p className="text-sm font-medium">{loan.state_end}</p>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t pt-4 text-xs text-muted-foreground">
          <p>ID del préstamo: {loan.id}</p>
          <p>Creado el {format(new Date(loan.created_at), "PPP 'a las' p", { locale: es })}</p>
          <p>Última actualización: {format(new Date(loan.updated_at), "PPP 'a las' p", { locale: es })}</p>
        </div>
      </div>

      {/* Fotos Section */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Fotos del artículo</h2>
          <PhotoUpload loanId={loan.id} onUploadComplete={() => refetch()} />
        </div>
        
        {loan.photos.length > 0 ? (
          <ImageViewer images={loan.photos} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay fotos del artículo aún. Haz clic en "Subir fotos" para agregar imágenes.
          </p>
        )}
      </div>

      {/* Recordatorios Section */}
      {loan.reminders.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Historial de recordatorios</h2>
          <div className="space-y-2">
            {loan.reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between text-sm">
                <span>{reminder.subject}</span>
                <span className="text-muted-foreground">
                  {format(new Date(reminder.sent_at), "PPP", { locale: es })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!loan.returned_at && (
          <ReturnLoanDialog loan={loan} />
        )}
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Volver al Dashboard
        </Button>
      </div>
    </div>
  )
}