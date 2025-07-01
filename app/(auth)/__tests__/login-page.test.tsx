import { render, screen } from '@testing-library/react'
import LoginPage from '@/app/auth/login/page'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('Login Page', () => {
  it('renders the login page title', () => {
    render(<LoginPage />)
    
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('renders the login page description', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Ingresa tus credenciales para acceder')).toBeInTheDocument()
  })

  it('renders the login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    const { container } = render(<LoginPage />)
    
    const mainContainer = container.firstChild
    expect(mainContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center')
  })

  it('renders card with correct structure', () => {
    render(<LoginPage />)
    
    // Check for card elements
    const heading = screen.getByRole('heading', { name: 'Iniciar sesión' })
    const card = heading.closest('.space-y-8')
    expect(card).toHaveClass('w-full', 'max-w-md', 'space-y-8')
  })
})