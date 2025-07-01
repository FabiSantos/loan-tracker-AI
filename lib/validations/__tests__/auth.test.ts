import { loginSchema } from '../auth'

describe('loginSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })
      
      expect(result.success).toBe(true)
    })

    it('accepts email with subdomain', () => {
      const result = loginSchema.safeParse({
        email: 'user@mail.example.com',
        password: 'password123',
      })
      
      expect(result.success).toBe(true)
    })

    it('accepts long password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'verylongpasswordthatexceedsminimumrequirements',
      })
      
      expect(result.success).toBe(true)
    })
  })

  describe('invalid inputs', () => {
    it('rejects empty object', () => {
      const result = loginSchema.safeParse({})
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2)
      }
    })

    it('rejects invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'notanemail',
        password: 'password123',
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email inválido')
      }
    })

    it('rejects email without domain', () => {
      const result = loginSchema.safeParse({
        email: 'test@',
        password: 'password123',
      })
      
      expect(result.success).toBe(false)
    })

    it('accepts any non-empty password for login', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'a',
      })
      
      expect(result.success).toBe(true)
    })

    it('rejects missing email', () => {
      const result = loginSchema.safeParse({
        password: 'password123',
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('email')
      }
    })

    it('rejects missing password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('password')
      }
    })

    it('rejects null values', () => {
      const result = loginSchema.safeParse({
        email: null,
        password: null,
      })
      
      expect(result.success).toBe(false)
    })

    it('rejects numbers as values', () => {
      const result = loginSchema.safeParse({
        email: 123,
        password: 456,
      })
      
      expect(result.success).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('rejects email with whitespace', () => {
      const result = loginSchema.safeParse({
        email: '  test@example.com  ',
        password: 'password123',
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email inválido')
      }
    })

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La contraseña es requerida')
      }
    })
  })
})