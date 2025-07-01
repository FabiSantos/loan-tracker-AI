import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardStats } from '../dashboard-stats'

const mockLoans = [
  {
    id: '1',
    user_id: 'user1',
    recipient_name: 'Juan Pérez',
    item_name: 'Libro de React',
    quantity: 1,
    borrowed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    return_by: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now (Active)
    returned_at: null,
    state_start: 'Nuevo',
    state_end: null,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    user_id: 'user1',
    recipient_name: 'María García',
    item_name: 'Laptop',
    quantity: 1,
    borrowed_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    return_by: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago (Overdue)
    returned_at: null,
    state_start: 'Usado',
    state_end: null,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    user_id: 'user1',
    recipient_name: 'Carlos López',
    item_name: 'Herramienta',
    quantity: 2,
    borrowed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    return_by: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    returned_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), // Returned 11 days ago
    state_start: 'Bueno',
    state_end: 'Bueno',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
  },
]

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('DashboardStats', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    )

    renderWithQueryClient(<DashboardStats />)
    
    // Check for loading spinners (Loader2 components)
    const spinners = document.querySelectorAll('.animate-spin')
    expect(spinners).toHaveLength(3)
  })

  it('displays correct stats when data is loaded', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockLoans,
    })

    renderWithQueryClient(<DashboardStats />)
    
    await waitFor(() => {
      expect(screen.getByText('Préstamos Activos')).toBeInTheDocument()
    })

    // Check all three stats
    expect(screen.getByText('Préstamos Activos')).toBeInTheDocument()
    expect(screen.getByText('Préstamos Vencidos')).toBeInTheDocument()
    expect(screen.getByText('Préstamos Devueltos')).toBeInTheDocument()
    
    // All three counts should be "1"
    const counts = screen.getAllByText('1')
    expect(counts).toHaveLength(3)
  })

  it('shows zero counts when no loans', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    renderWithQueryClient(<DashboardStats />)
    
    await waitFor(() => {
      expect(screen.getByText('Préstamos Activos')).toBeInTheDocument()
    })

    const counts = screen.getAllByText('0')
    expect(counts).toHaveLength(3)
  })

  it('handles API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    renderWithQueryClient(<DashboardStats />)
    
    // Should show loading initially
    expect(document.querySelectorAll('.animate-spin')).toHaveLength(3)
    
    // Wait for error to be processed
    await waitFor(() => {
      // After error, loading spinners should disappear
      expect(document.querySelectorAll('.animate-spin')).toHaveLength(0)
    })
    
    // Component should still render the grid structure even on error
    expect(screen.getByText('Préstamos Activos')).toBeInTheDocument()
    const zeroCountStats = screen.getAllByText('0')
    expect(zeroCountStats).toHaveLength(3) // Shows 0 for all stats on error
  })
})