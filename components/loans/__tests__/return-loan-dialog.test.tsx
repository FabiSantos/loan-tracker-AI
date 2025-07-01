import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReturnLoanDialog } from '../return-loan-dialog'

// Mock de hooks
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const mockLoan = {
  id: '123',
  item_name: 'Libro de TypeScript',
  recipient_name: 'Juan Pérez',
  borrowed_at: new Date('2024-01-01'),
}

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

describe('ReturnLoanDialog', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders trigger button', () => {
    renderWithQueryClient(<ReturnLoanDialog loan={mockLoan} />)
    
    expect(screen.getByRole('button', { name: /marcar como devuelto/i })).toBeInTheDocument()
  })

  it('opens dialog when clicking trigger', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ReturnLoanDialog loan={mockLoan} />)
    
    const triggerButton = screen.getByRole('button', { name: /marcar como devuelto/i })
    await user.click(triggerButton)
    
    expect(screen.getByText(/registrar devolución/i)).toBeInTheDocument()
    expect(screen.getByText(/libro de typescript/i)).toBeInTheDocument()
    expect(screen.getByText(/juan pérez/i)).toBeInTheDocument()
  })

  it('shows form fields', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ReturnLoanDialog loan={mockLoan} />)
    
    await user.click(screen.getByRole('button', { name: /marcar como devuelto/i }))
    
    expect(screen.getByLabelText(/estado final/i)).toBeInTheDocument()
    expect(screen.getByText(/fecha de devolución/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ReturnLoanDialog loan={mockLoan} />)
    
    await user.click(screen.getByRole('button', { name: /marcar como devuelto/i }))
    
    const submitButton = screen.getByRole('button', { name: /confirmar devolución/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/el estado final es requerido/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '123', returned_at: new Date() }),
    })
    
    renderWithQueryClient(<ReturnLoanDialog loan={mockLoan} />)
    
    await user.click(screen.getByRole('button', { name: /marcar como devuelto/i }))
    
    const stateInput = screen.getByLabelText(/estado final/i)
    await user.type(stateInput, 'Buen estado')
    
    const submitButton = screen.getByRole('button', { name: /confirmar devolución/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/loans/123/return', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Buen estado'),
      })
    })
  })

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    )
    
    renderWithQueryClient(<ReturnLoanDialog loan={mockLoan} />)
    
    await user.click(screen.getByRole('button', { name: /marcar como devuelto/i }))
    
    const stateInput = screen.getByLabelText(/estado final/i)
    await user.type(stateInput, 'Buen estado')
    
    const submitButton = screen.getByRole('button', { name: /confirmar devolución/i })
    await user.click(submitButton)
    
    expect(submitButton).toBeDisabled()
  })

  it('handles API errors', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Error del servidor' }),
    })
    
    renderWithQueryClient(<ReturnLoanDialog loan={mockLoan} />)
    
    await user.click(screen.getByRole('button', { name: /marcar como devuelto/i }))
    
    const stateInput = screen.getByLabelText(/estado final/i)
    await user.type(stateInput, 'Buen estado')
    
    const submitButton = screen.getByRole('button', { name: /confirmar devolución/i })
    await user.click(submitButton)
    
    // El componente usa toast para mostrar errores
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})