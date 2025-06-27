"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { CalendarIcon, CheckCircle, Loader2 } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

const returnFormSchema = z.object({
  state_end: z.string().min(2, "El estado final es requerido"),
  returned_at: z.date({
    required_error: "La fecha de devolución es requerida",
  }),
})

type ReturnFormValues = z.infer<typeof returnFormSchema>

interface ReturnLoanDialogProps {
  loan: {
    id: string
    item_name: string
    recipient_name: string
    borrowed_at: string | Date
  }
}

export function ReturnLoanDialog({ loan }: ReturnLoanDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      state_end: "",
      returned_at: new Date(),
    },
  })

  const returnLoan = useMutation({
    mutationFn: async (values: ReturnFormValues) => {
      const response = await fetch(`/api/loans/${loan.id}/return`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Error al marcar la devolución")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] })
      toast({
        title: "Devolución registrada",
        description: "El préstamo ha sido marcado como devuelto.",
      })
      setOpen(false)
      form.reset()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo registrar la devolución. Por favor intente de nuevo.",
        variant: "destructive",
      })
    },
  })

  function onSubmit(values: ReturnFormValues) {
    returnLoan.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CheckCircle className="mr-2 h-4 w-4" />
          Marcar como devuelto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Devolución</DialogTitle>
          <DialogDescription>
            Registre la devolución de "{loan.item_name}" prestado a {loan.recipient_name}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="state_end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Final</FormLabel>
                  <FormControl>
                    <Input placeholder="Bueno, dañado, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    Describe el estado del artículo al momento de la devolución
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="returned_at"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Devolución</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Seleccione una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date(loan.borrowed_at)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    La fecha no puede ser anterior a la fecha de préstamo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={returnLoan.isPending}>
                {returnLoan.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar Devolución
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}