import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PhotoUpload } from '../photo-upload'

// Mock de hooks
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('PhotoUpload', () => {
  const defaultProps = {
    loanId: '123',
    onUploadComplete: jest.fn(),
  }

  beforeEach(() => {
    global.fetch = jest.fn()
    // Mock FileReader
    global.FileReader = jest.fn(() => ({
      readAsDataURL: jest.fn(),
      onloadend: jest.fn(),
      result: 'data:image/jpeg;base64,mock',
    })) as any
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders upload button', () => {
    renderWithQueryClient(<PhotoUpload {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /subir fotos/i })).toBeInTheDocument()
  })

  it('opens dialog when clicking button', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PhotoUpload {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /subir fotos/i }))
    
    expect(screen.getByText(/subir fotos del artículo/i)).toBeInTheDocument()
    expect(screen.getByText(/sube hasta 5 fotos/i)).toBeInTheDocument()
  })

  it('shows file selection area', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PhotoUpload {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /subir fotos/i }))
    
    expect(screen.getByText(/haz clic para seleccionar imágenes/i)).toBeInTheDocument()
  })

  it('handles file selection', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PhotoUpload {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /subir fotos/i }))
    
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(input, file)
    
    // Verificar que se llama al FileReader
    expect(FileReader).toHaveBeenCalled()
  })

  it('limits file selection to 5 files', async () => {
    const user = userEvent.setup()
    
    renderWithQueryClient(<PhotoUpload {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /subir fotos/i }))
    
    const files = Array.from({ length: 6 }, (_, i) => 
      new File(['photo'], `photo${i}.jpg`, { type: 'image/jpeg' })
    )
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, files)
    
    // When too many files are selected, FileReader should not be called
    // because the component rejects them early
    expect(FileReader).not.toHaveBeenCalled()
  })

  it('displays upload button with correct text', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PhotoUpload {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /subir fotos/i }))
    
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(input, file)
    
    // Simular la carga del FileReader
    const fileReader = FileReader.mock.results[0].value
    fileReader.result = 'data:image/jpeg;base64,mock'
    fileReader.onloadend()
    
    await waitFor(() => {
      expect(screen.getByText(/subir 1 foto\(s\)/i)).toBeInTheDocument()
    })
  })

  it('handles successful upload', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'photo1', url: '/uploads/photo.jpg' }),
    })
    
    renderWithQueryClient(<PhotoUpload {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /subir fotos/i }))
    
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(input, file)
    
    // Simular FileReader
    const fileReader = FileReader.mock.results[0].value
    fileReader.result = 'data:image/jpeg;base64,mock'
    fileReader.onloadend()
    
    await waitFor(() => {
      screen.getByText(/subir 1 foto\(s\)/i)
    })
    
    const uploadButton = screen.getByText(/subir 1 foto\(s\)/i).closest('button')
    await user.click(uploadButton!)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/loans/123/photos', {
        method: 'POST',
        body: expect.any(FormData),
      })
      expect(defaultProps.onUploadComplete).toHaveBeenCalled()
    })
  })

  it('handles upload errors', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Error al subir' }),
    })
    
    renderWithQueryClient(<PhotoUpload {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /subir fotos/i }))
    
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(input, file)
    
    // Simular FileReader
    const fileReader = FileReader.mock.results[0].value
    fileReader.result = 'data:image/jpeg;base64,mock'
    fileReader.onloadend()
    
    await waitFor(() => {
      screen.getByText(/subir 1 foto\(s\)/i)
    })
    
    const uploadButton = screen.getByText(/subir 1 foto\(s\)/i).closest('button')
    await user.click(uploadButton!)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})