import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import RegisterPage from '../page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('RegisterPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('renders register form', () => {
    render(<RegisterPage />)

    expect(screen.getByText('Crear cuenta')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tus datos para registrarte')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrarse' })).toBeInTheDocument()
    expect(screen.getByText('¿Ya tienes cuenta?')).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const submitButton = screen.getByRole('button', { name: 'Registrarse' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument()
      expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'invalid-email')

    const submitButton = screen.getByRole('button', { name: 'Registrarse' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument()
    })
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText('Contraseña')
    await user.type(passwordInput, '123')

    const submitButton = screen.getByRole('button', { name: 'Registrarse' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'User created' }),
    })

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Contraseña')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')

    const submitButton = screen.getByRole('button', { name: 'Registrarse' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123',
        }),
      })
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('shows error message on registration failure', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'El email ya está registrado' }),
    })

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Contraseña')

    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'Password123')

    const submitButton = screen.getByRole('button', { name: 'Registrarse' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument()
    })
  })

  it('shows generic error on network failure', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Contraseña')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')

    const submitButton = screen.getByRole('button', { name: 'Registrarse' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    let resolvePromise: any
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => {
        resolvePromise = resolve
      })
    )

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Contraseña')
    const submitButton = screen.getByRole('button', { name: 'Registrarse' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Registrando...')).toBeInTheDocument()
    })

    // Resolve the promise to clean up
    resolvePromise({ ok: true, json: async () => ({}) })
  })

  it('contains link to login page', () => {
    render(<RegisterPage />)

    const loginLink = screen.getByRole('link', { name: 'Inicia sesión' })
    expect(loginLink).toHaveAttribute('href', '/auth/login')
  })
})