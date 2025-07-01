import { POST, GET } from '../route'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { writeFile } from 'fs/promises'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    loan: {
      findFirst: jest.fn(),
    },
    loanPhoto: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      ...init,
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

// Add File polyfill with arrayBuffer method
global.File = class File {
  constructor(bits, name, options = {}) {
    this.bits = bits
    this.name = name
    this.type = options.type || ''
    this.lastModified = options.lastModified || Date.now()
    this.size = bits[0]?.length || 0
  }

  async arrayBuffer() {
    return new ArrayBuffer(8)
  }
} as any

// Mock FormData to handle file properly
global.FormData = class FormData {
  private data = new Map()

  append(key: string, value: any) {
    this.data.set(key, value)
  }

  get(key: string) {
    return this.data.get(key)
  }
} as any

// Mock Request with formData method
global.Request = class Request {
  url: string
  method: string
  headers: Map<string, string>
  body: any
  _bodyUsed: boolean

  constructor(url: string, init: any = {}) {
    this.url = url
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.body = init.body
    this._bodyUsed = false
  }

  async json() {
    if (this._bodyUsed) throw new Error('Body already read')
    this._bodyUsed = true
    return JSON.parse(this.body)
  }

  async formData() {
    if (this._bodyUsed) throw new Error('Body already read')
    this._bodyUsed = true
    return this.body
  }
} as any

describe('Photos API /api/loans/[id]/photos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/loans/[id]/photos', () => {
    it('returns 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null)

      const formData = new FormData()
      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'POST',
        body: formData,
      })
      
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'No autorizado' },
        { status: 401 }
      )
    })

    it('returns 404 when loan not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue(null)

      const formData = new FormData()
      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'POST',
        body: formData,
      })
      
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    })

    it('returns 400 when no file provided', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue({
        id: '123',
        user_id: 'user-1',
      })

      // Mock formData.get to return null
      const formData = new FormData()
      jest.spyOn(formData, 'get').mockReturnValue(null)

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'POST',
        body: formData,
      })
      
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'No se encontró archivo' },
        { status: 400 }
      )
    })

    it('returns 400 for invalid file type', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue({
        id: '123',
        user_id: 'user-1',
      })

      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'POST',
        body: formData,
      })
      
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG o WebP' },
        { status: 400 }
      )
    })

    it('uploads photo successfully', async () => {
      const mockLoan = { id: '123', user_id: 'user-1' }
      const mockPhoto = {
        id: 'photo-1',
        loan_id: '123',
        url: '/uploads/123_test.jpg',
        type: 'start',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue(mockLoan)
      ;(writeFile as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.loanPhoto.create as jest.Mock).mockResolvedValue(mockPhoto)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'start')

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'POST',
        body: formData,
      })
      
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })

      expect(writeFile).toHaveBeenCalled()
      expect(prisma.loanPhoto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          loan_id: '123',
          type: 'start',
        }),
      })
      expect(NextResponse.json).toHaveBeenCalledWith(mockPhoto)
    })

    it('rejects files that are too large', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue({
        id: '123',
        user_id: 'user-1',
      })

      // Create a mock file that's too large
      const file = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      // Override the size property
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 })
      
      const formData = new FormData()
      formData.append('file', file)

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'POST',
        body: formData,
      })
      
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'El archivo es muy grande. Máximo 5MB' },
        { status: 400 }
      )
    })

    it('handles file write errors', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue({
        id: '123',
        user_id: 'user-1',
      })
      ;(writeFile as jest.Mock).mockRejectedValue(new Error('Write failed'))

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'POST',
        body: formData,
      })
      
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Error al subir la foto' },
        { status: 500 }
      )
    })

    it('handles database errors when creating photo record', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue({
        id: '123',
        user_id: 'user-1',
      })
      ;(writeFile as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.loanPhoto.create as jest.Mock).mockRejectedValue(new Error('DB Error'))

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'POST',
        body: formData,
      })
      
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Error al subir la foto' },
        { status: 500 }
      )
    })

    it('returns 404 when user not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const formData = new FormData()
      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'POST',
        body: formData,
      })
      
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    })

    it('accepts webp images', async () => {
      const mockLoan = { id: '123', user_id: 'user-1' }
      const mockPhoto = {
        id: 'photo-1',
        loan_id: '123',
        url: '/uploads/123_test.webp',
        type: 'loan',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue(mockLoan)
      ;(writeFile as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.loanPhoto.create as jest.Mock).mockResolvedValue(mockPhoto)

      const file = new File(['test'], 'test.webp', { type: 'image/webp' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'POST',
        body: formData,
      })
      
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })

      expect(writeFile).toHaveBeenCalled()
      expect(NextResponse.json).toHaveBeenCalledWith(mockPhoto)
    })

    it('handles missing session email', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {} // No email
      })

      const formData = new FormData()
      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'POST',
        body: formData,
      })
      
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'No autorizado' },
        { status: 401 }
      )
    })
  })

  describe('GET /api/loans/[id]/photos', () => {
    it('returns 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'GET',
      })
      
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'No autorizado' },
        { status: 401 }
      )
    })

    it('returns 404 when user not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'GET',
      })
      
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    })

    it('returns 404 when loan not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'GET',
      })
      
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    })

    it('returns photos successfully', async () => {
      const mockPhotos = [
        { id: 'photo-1', url: '/uploads/loan-1.jpg', type: 'start' },
        { id: 'photo-2', url: '/uploads/loan-2.jpg', type: 'end' },
      ]

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockResolvedValue({
        id: '123',
        user_id: 'user-1',
        photos: mockPhotos,
      })

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'GET',
      })
      
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) })

      expect(prisma.loan.findFirst).toHaveBeenCalledWith({
        where: {
          id: '123',
          user_id: 'user-1',
        },
        include: {
          photos: {
            orderBy: {
              uploaded_at: 'desc',
            },
          },
        },
      })
      expect(NextResponse.json).toHaveBeenCalledWith(mockPhotos)
    })

    it('handles database errors', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
      ;(prisma.loan.findFirst as jest.Mock).mockRejectedValue(new Error('DB Error'))

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'GET',
      })
      
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Error al obtener las fotos' },
        { status: 500 }
      )
    })

    it('handles missing session email in GET', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {} // No email
      })

      const request = new Request('http://localhost:3000/api/loans/123/photos', {
        method: 'GET',
      })
      
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'No autorizado' },
        { status: 401 }
      )
    })
  })
})