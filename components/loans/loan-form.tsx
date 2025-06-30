"use client"

import { useState, useRef, ChangeEvent } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Upload, X, ImageIcon } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

const loanFormSchema = z.object({
  recipient_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  item_name: z.string().min(2, "El nombre del artículo debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
  borrowed_at: z.date({
    required_error: "La fecha de préstamo es requerida",
  }),
  return_by: z.date({
    required_error: "La fecha de devolución es requerida",
  }),
  state_start: z.string().min(2, "El estado inicial es requerido"),
})

type LoanFormValues = z.infer<typeof loanFormSchema>

export function LoanForm() {
  const [open, setOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      recipient_name: "",
      item_name: "",
      description: "",
      quantity: 1,
      borrowed_at: new Date(),
      return_by: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
      state_start: "",
    },
  })

  const createLoan = useMutation({
    mutationFn: async (values: LoanFormValues) => {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Error al crear el préstamo")
      }

      return response.json()
    },
    onSuccess: async (data) => {
      // Subir fotos si hay alguna seleccionada
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("type", "loan")

          await fetch(`/api/loans/${data.id}/photos`, {
            method: "POST",
            body: formData,
          })
        }
      }

      queryClient.invalidateQueries({ queryKey: ["loans"] })
      toast({
        title: "Préstamo creado",
        description: "El préstamo se ha registrado correctamente.",
      })
      setOpen(false)
      form.reset()
      setSelectedFiles([])
      setPreviews([])
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el préstamo. Por favor intente de nuevo.",
        variant: "destructive",
      })
    },
  })

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length > 5) {
      toast({
        title: "Límite excedido",
        description: "Máximo 5 fotos por préstamo",
        variant: "destructive",
      })
      return
    }

    const newPreviews: string[] = []
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === files.length) {
          setPreviews(newPreviews)
        }
      }
      reader.readAsDataURL(file)
    })

    setSelectedFiles(files)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  function onSubmit(values: LoanFormValues) {
    createLoan.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo Préstamo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Préstamo</DialogTitle>
          <DialogDescription>
            Complete los detalles del artículo que está prestando
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Prestatario</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Artículo</FormLabel>
                  <FormControl>
                    <Input placeholder="Libro, herramienta, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales sobre el artículo..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Inicial</FormLabel>
                  <FormControl>
                    <Input placeholder="Nuevo, usado, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    Describe el estado del artículo al momento del préstamo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="borrowed_at"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Préstamo</FormLabel>
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
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="return_by"
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
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Campo de fotos */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fotos del artículo (opcional)</label>
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">
                  Haz clic para seleccionar hasta 5 imágenes
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              {/* Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-16 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={createLoan.isPending}>
                {createLoan.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Préstamo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}