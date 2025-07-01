import { createLoanSchema, returnLoanSchema, loanPhotoSchema } from '../loan'

describe('createLoanSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid loan data', () => {
      const result = createLoanSchema.safeParse({
        item_name: 'Book',
        recipient_name: 'John Doe',
        description: 'A good book',
        quantity: 1,
        borrowed_at: new Date(),
        return_by: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        state_start: 'Nuevo',
      })
      
      expect(result.success).toBe(true)
    })

    it('accepts loan without optional description', () => {
      const result = createLoanSchema.safeParse({
        item_name: 'Book',
        recipient_name: 'John Doe',
        quantity: 1,
        borrowed_at: new Date(),
        return_by: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        state_start: 'Nuevo',
      })
      
      expect(result.success).toBe(true)
    })
  })

  describe('invalid inputs', () => {
    it('rejects empty object', () => {
      const result = createLoanSchema.safeParse({})
      
      expect(result.success).toBe(false)
    })

    it('rejects missing item_name', () => {
      const result = createLoanSchema.safeParse({
        recipient_name: 'John Doe',
        quantity: 1,
        borrowed_at: new Date(),
        return_by: new Date(),
        state_start: 'Nuevo',
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('item_name')
      }
    })

    it('rejects negative quantity', () => {
      const result = createLoanSchema.safeParse({
        item_name: 'Book',
        recipient_name: 'John Doe',
        quantity: -1,
        borrowed_at: new Date(),
        return_by: new Date(),
        state_start: 'Nuevo',
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La cantidad debe ser un número positivo')
      }
    })

    it('rejects empty state_start', () => {
      const result = createLoanSchema.safeParse({
        item_name: 'Book',
        recipient_name: 'John Doe',
        quantity: 1,
        borrowed_at: new Date(),
        return_by: new Date(),
        state_start: '',
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La condición inicial es requerida')
      }
    })
  })
})

describe('returnLoanSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid return data', () => {
      const result = returnLoanSchema.safeParse({
        returned_at: new Date(),
        state_end: 'Good condition',
      })
      
      expect(result.success).toBe(true)
    })
  })

  describe('invalid inputs', () => {
    it('rejects empty object', () => {
      const result = returnLoanSchema.safeParse({})
      
      expect(result.success).toBe(false)
    })

    it('rejects missing state_end', () => {
      const result = returnLoanSchema.safeParse({
        returned_at: new Date(),
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required')
      }
    })

    it('rejects empty state_end', () => {
      const result = returnLoanSchema.safeParse({
        returned_at: new Date(),
        state_end: '',
      })
      
      expect(result.success).toBe(false)
    })
  })
})

describe('loanPhotoSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid photo with start type', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = loanPhotoSchema.safeParse({
        type: 'start',
        file: file,
      })
      
      expect(result.success).toBe(true)
    })

    it('accepts valid photo with end type', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const result = loanPhotoSchema.safeParse({
        type: 'end',
        file: file,
      })
      
      expect(result.success).toBe(true)
    })

    it('accepts jpg files', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpg' })
      const result = loanPhotoSchema.safeParse({
        type: 'start',
        file: file,
      })
      
      expect(result.success).toBe(true)
    })
  })

  describe('invalid inputs', () => {
    it('rejects invalid type', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = loanPhotoSchema.safeParse({
        type: 'invalid',
        file: file,
      })
      
      expect(result.success).toBe(false)
    })

    it('rejects files over 5MB', () => {
      // Create a mock file that's too large
      const largeFile = {
        size: 6 * 1024 * 1024, // 6MB
        type: 'image/jpeg',
        name: 'large.jpg',
      } as File

      const result = loanPhotoSchema.safeParse({
        type: 'start',
        file: largeFile,
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El archivo no debe superar 5MB')
      }
    })

    it('rejects non-image files', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const result = loanPhotoSchema.safeParse({
        type: 'start',
        file: file,
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Solo se permiten archivos JPG o PNG')
      }
    })

    it('rejects webp files', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' })
      const result = loanPhotoSchema.safeParse({
        type: 'start',
        file: file,
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Solo se permiten archivos JPG o PNG')
      }
    })
  })
})