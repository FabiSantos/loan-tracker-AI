import { z } from 'zod'

export const createLoanSchema = z.object({
  recipient_name: z.string().min(1, 'El nombre del destinatario es requerido'),
  item_name: z.string().min(1, 'El nombre del artículo es requerido'),
  description: z.string().optional(),
  quantity: z.number().int().positive('La cantidad debe ser un número positivo'),
  borrowed_at: z.date(),
  return_by: z.date(),
  state_start: z.string().min(1, 'La condición inicial es requerida'),
})

export const returnLoanSchema = z.object({
  returned_at: z.date(),
  state_end: z.string().min(1, 'La condición final es requerida'),
})

export const loanPhotoSchema = z.object({
  type: z.enum(['start', 'end']),
  file: z
    .custom<File>()
    .refine((file) => file?.size <= 5 * 1024 * 1024, 'El archivo no debe superar 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png'].includes(file?.type),
      'Solo se permiten archivos JPG o PNG'
    ),
})

export type CreateLoanInput = z.infer<typeof createLoanSchema>
export type ReturnLoanInput = z.infer<typeof returnLoanSchema>
export type LoanPhotoInput = z.infer<typeof loanPhotoSchema>