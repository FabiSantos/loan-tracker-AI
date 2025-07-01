import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardClient } from '../dashboard-client'

const mockLoans = [
  {
    id: '1',
    user_id: 'user1',
    recipient_name: 'Juan Pérez',
    item_name: 'Libro de React',
    description: 'Libro avanzado',
    quantity: 1,
    borrowed_at: new Date('2024-01-01'),
    return_by: new Date('2024-01-15'),
    returned_at: null,
    state_start: 'Nuevo',
    state_end: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    photos: [],
  },
  {
    id: '2',
    user_id: 'user1',
    recipient_name: 'María García',
    item_name: 'Laptop',
    description: null,
    quantity: 1,
    borrowed_at: new Date('2024-01-01'),
    return_by: new Date('2023-12-15'), // Vencido
    returned_at: null,
    state_start: 'Usado',
    state_end: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    photos: [],
  },
  {
    id: '3',
    user_id: 'user1',
    recipient_name: 'Carlos López',
    item_name: 'Herramienta',
    description: null,
    quantity: 2,
    borrowed_at: new Date('2024-01-01'),
    return_by: new Date('2024-01-10'),
    returned_at: new Date('2024-01-09'),
    state_start: 'Bueno',
    state_end: 'Bueno',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-09'),
    photos: [],
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

describe('DashboardClient', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLoans),
      })
    ) as jest.Mock
  })

  it('renders all loans initially', () => {
    renderWithQueryClient(
      <DashboardClient
        activeLoans={[mockLoans[0]]}
        overdueLoans={[mockLoans[1]]}
        returnedLoans={[mockLoans[2]]}
      />
    )

    expect(screen.getByText('Libro de React')).toBeInTheDocument()
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.getByText('Herramienta')).toBeInTheDocument()
  })

  it('shows correct status badges', () => {
    renderWithQueryClient(
      <DashboardClient
        activeLoans={[mockLoans[0]]}
        overdueLoans={[mockLoans[1]]}
        returnedLoans={[mockLoans[2]]}
      />
    )

    expect(screen.getAllByText('Vencido')).toHaveLength(2)
    expect(screen.getByText('Devuelto')).toBeInTheDocument()
  })

  it('filters loans by status', async () => {
    const user = userEvent.setup()
    
    // Crear un loan activo diferente para el test
    const activeLoan = {
      ...mockLoans[0],
      id: '4',
      item_name: 'Libro Activo',
      return_by: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días en el futuro
      returned_at: null,
      photos: [],
    }
    
    // Mock de fetch para React Query
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        activeLoan,
        mockLoans[0], // vencido
        mockLoans[1], // vencido
        mockLoans[2], // devuelto
      ],
    })
    
    renderWithQueryClient(
      <DashboardClient
        activeLoans={[activeLoan]}
        overdueLoans={[mockLoans[0], mockLoans[1]]}
        returnedLoans={[mockLoans[2]]}
      />
    )

    const filterSelect = screen.getByRole('combobox')
    
    // Filtrar por activos
    await user.selectOptions(filterSelect, 'active')
    await waitFor(() => {
      expect(screen.getByText('Libro Activo')).toBeInTheDocument()
    })
    expect(screen.queryByText('Libro de React')).not.toBeInTheDocument()
    expect(screen.queryByText('Laptop')).not.toBeInTheDocument()
    expect(screen.queryByText('Herramienta')).not.toBeInTheDocument()

    // Filtrar por vencidos
    await user.selectOptions(filterSelect, 'overdue')
    await waitFor(() => {
      expect(screen.getByText('Libro de React')).toBeInTheDocument()
    })
    expect(screen.queryByText('Libro Activo')).not.toBeInTheDocument()
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.queryByText('Herramienta')).not.toBeInTheDocument()

    // Filtrar por devueltos
    await user.selectOptions(filterSelect, 'returned')
    await waitFor(() => {
      expect(screen.getByText('Herramienta')).toBeInTheDocument()
    })
    expect(screen.queryByText('Libro Activo')).not.toBeInTheDocument()
    expect(screen.queryByText('Libro de React')).not.toBeInTheDocument()
    expect(screen.queryByText('Laptop')).not.toBeInTheDocument()
  })

  it('searches loans by recipient name', async () => {
    const user = userEvent.setup()
    
    renderWithQueryClient(
      <DashboardClient
        activeLoans={[mockLoans[0]]}
        overdueLoans={[mockLoans[1]]}
        returnedLoans={[mockLoans[2]]}
      />
    )

    const searchInput = screen.getByPlaceholderText(/buscar préstamos/i)
    
    await user.type(searchInput, 'Juan')
    
    expect(screen.getByText('Libro de React')).toBeInTheDocument()
    expect(screen.queryByText('Laptop')).not.toBeInTheDocument()
    expect(screen.queryByText('Herramienta')).not.toBeInTheDocument()
  })

  it('searches loans by item name', async () => {
    const user = userEvent.setup()
    
    renderWithQueryClient(
      <DashboardClient
        activeLoans={[mockLoans[0]]}
        overdueLoans={[mockLoans[1]]}
        returnedLoans={[mockLoans[2]]}
      />
    )

    const searchInput = screen.getByPlaceholderText(/buscar préstamos/i)
    
    await user.type(searchInput, 'Laptop')
    
    expect(screen.queryByText('Libro de React')).not.toBeInTheDocument()
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.queryByText('Herramienta')).not.toBeInTheDocument()
  })

  it('shows empty state when no loans match', async () => {
    const user = userEvent.setup()
    
    renderWithQueryClient(
      <DashboardClient
        activeLoans={[mockLoans[0]]}
        overdueLoans={[mockLoans[1]]}
        returnedLoans={[mockLoans[2]]}
      />
    )

    const searchInput = screen.getByPlaceholderText(/buscar préstamos/i)
    
    await user.type(searchInput, 'No existe')
    
    expect(screen.getByText(/no se encontraron préstamos/i)).toBeInTheDocument()
  })

  it('renders loan details correctly', () => {
    renderWithQueryClient(
      <DashboardClient
        activeLoans={[mockLoans[0]]}
        overdueLoans={[]}
        returnedLoans={[]}
      />
    )

    expect(screen.getByText('Prestado a: Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('Cantidad: 1')).toBeInTheDocument()
    // Date formatting might vary, so check for the date parts
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('shows new loan form button', () => {
    renderWithQueryClient(
      <DashboardClient
        activeLoans={[]}
        overdueLoans={[]}
        returnedLoans={[]}
      />
    )

    expect(screen.getByRole('button', { name: /nuevo préstamo/i })).toBeInTheDocument()
  })

  it('updates loans from API', async () => {
    renderWithQueryClient(
      <DashboardClient
        activeLoans={[]}
        overdueLoans={[]}
        returnedLoans={[]}
      />
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/loans')
    })
  })
})