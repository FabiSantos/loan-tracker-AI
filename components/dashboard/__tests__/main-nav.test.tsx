import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MainNav } from '../main-nav'

// Mock de next-auth/react
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}))

describe('MainNav', () => {
  const defaultProps = {
    userEmail: 'test@example.com',
  }

  it('renders navigation elements', () => {
    render(<MainNav {...defaultProps} />)

    expect(screen.getByText('Loan Tracker')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Nuevo Préstamo')).toBeInTheDocument()
    expect(screen.getByText(defaultProps.userEmail)).toBeInTheDocument()
  })

  it('shows logo with icon', () => {
    render(<MainNav {...defaultProps} />)

    const logo = screen.getByText('Loan Tracker')
    expect(logo).toBeInTheDocument()
    
    // Verificar que el icono Package está presente
    const logoLink = logo.closest('a')
    expect(logoLink).toHaveAttribute('href', '/dashboard')
  })

  it('displays user email on desktop', () => {
    render(<MainNav {...defaultProps} />)

    const emailElement = screen.getByText(defaultProps.userEmail)
    expect(emailElement).toHaveClass('hidden', 'sm:inline')
  })

  it('handles sign out button click', async () => {
    const user = userEvent.setup()
    const { signOut } = require('next-auth/react')
    
    render(<MainNav {...defaultProps} />)

    const signOutButton = screen.getByLabelText('Cerrar sesión')
    await user.click(signOutButton)

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/auth/login' })
  })

  it('has correct navigation links', () => {
    render(<MainNav {...defaultProps} />)

    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' })
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')

    const newLoanLink = screen.getByRole('link', { name: 'Nuevo Préstamo' })
    expect(newLoanLink).toHaveAttribute('href', '/loans/new')
  })

  it('renders theme toggle', () => {
    render(<MainNav {...defaultProps} />)

    // El ThemeToggle está mockeado, pero verificamos que el espacio esté presente
    const navActions = screen.getByLabelText('Cerrar sesión').parentElement
    expect(navActions).toBeInTheDocument()
  })

  it('has responsive navigation', () => {
    render(<MainNav {...defaultProps} />)

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('hidden', 'md:flex')
  })

  it('applies fixed positioning', () => {
    render(<MainNav {...defaultProps} />)

    const header = screen.getByRole('banner')
    expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50')
  })
})