import React from 'react'
import { render, screen } from '@testing-library/react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '../layout'

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
  MainNav: ({ userEmail }: { userEmail: string }) => (
    <nav data-testid="main-nav" data-email={userEmail}>
      Navigation
    </nav>
  ),
}))

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to login if no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null)
    ;(redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    try {
      await DashboardLayout({ children: <div>Test Content</div> })
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

    const Component = await DashboardLayout({ children: <div>Test Content</div> })
    const { container } = render(Component)

    expect(container.querySelector('[data-testid="main-nav"]')).toBeInTheDocument()
    expect(container.querySelector('[data-email="test@example.com"]')).toBeInTheDocument()
    expect(container.textContent).toContain('Test Content')
  })

  it('handles session without email', async () => {
    const mockSession = {
      user: {},
    }
    ;(getServerSession as jest.Mock).mockResolvedValueOnce(mockSession)

    const Component = await DashboardLayout({ children: <div>Test Content</div> })
    const { container } = render(Component)

    expect(container.querySelector('[data-testid="main-nav"]')).toBeInTheDocument()
    expect(container.querySelector('[data-email=""]')).toBeInTheDocument()
  })

  it('applies correct styling classes', async () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
      },
    }
    ;(getServerSession as jest.Mock).mockResolvedValueOnce(mockSession)

    const Component = await DashboardLayout({ children: <div>Test Content</div> })
    const { container } = render(Component)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('min-h-screen')
    expect(wrapper.className).toContain('bg-background')

    const main = container.querySelector('main')
    expect(main?.className).toContain('pt-16')
  })
})