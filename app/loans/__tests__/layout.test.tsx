import React from 'react'
import { render, screen } from '@testing-library/react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import LoansLayout from '../layout'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

// Mock MainNav component
jest.mock('@/components/dashboard/main-nav', () => ({
  MainNav: () => <nav data-testid="main-nav">Navigation</nav>,
}))

describe('LoansLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to login if no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null)
    ;(redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    try {
      await LoansLayout({ children: <div>Test Content</div> })
    } catch (error) {
      // Expected redirect error
    }

    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })

  it('renders layout with children when authenticated', async () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
      },
    }
    ;(getServerSession as jest.Mock).mockResolvedValueOnce(mockSession)

    const Component = await LoansLayout({ children: <div>Test Content</div> })
    const { container } = render(Component)

    expect(container.querySelector('[data-testid="main-nav"]')).toBeInTheDocument()
    expect(container.textContent).toContain('Test Content')
  })

  it('applies correct styling to main element', async () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
      },
    }
    ;(getServerSession as jest.Mock).mockResolvedValueOnce(mockSession)

    const Component = await LoansLayout({ children: <div>Test Content</div> })
    const { container } = render(Component)

    const main = container.querySelector('main')
    expect(main?.className).toContain('min-h-[calc(100vh-4rem)]')
  })

  it('renders MainNav without userEmail prop', async () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
      },
    }
    ;(getServerSession as jest.Mock).mockResolvedValueOnce(mockSession)

    const result = await LoansLayout({ children: <div>Test Content</div> })
    render(result as React.ReactElement)

    // MainNav is rendered without userEmail prop in this layout
    expect(screen.getByTestId('main-nav')).toBeInTheDocument()
  })
})