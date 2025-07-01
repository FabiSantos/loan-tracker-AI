import React from 'react'
import { render } from '@testing-library/react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import DashboardPage from '../page'
import { prisma } from '@/lib/db/prisma'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/components/dashboard/dashboard-client', () => ({
  DashboardClient: ({ activeLoans, overdueLoans, returnedLoans }: any) => (
    <div data-testid="dashboard-client">
      <div data-testid="active-loans">{activeLoans.length} active</div>
      <div data-testid="overdue-loans">{overdueLoans.length} overdue</div>
      <div data-testid="returned-loans">{returnedLoans.length} returned</div>
    </div>
  ),
}))

jest.mock('@/components/dashboard/dashboard-stats', () => ({
  DashboardStats: () => <div data-testid="dashboard-stats">Stats</div>,
}))

describe('DashboardPage', () => {
  const mockLoans = [
    {
      id: '1',
      returned_at: null,
      return_by: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Future
      photos: [],
      created_at: new Date(),
    },
    {
      id: '2',
      returned_at: null,
      return_by: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Past (overdue)
      photos: [],
      created_at: new Date(),
    },
    {
      id: '3',
      returned_at: new Date(),
      return_by: new Date(),
      photos: [],
      created_at: new Date(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to login if no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null)
    ;(redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    try {
      await DashboardPage()
    } catch (error) {
      // Expected redirect error
    }

    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })

  it('redirects to login if session has no email', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: {},
    })
    ;(redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    try {
      await DashboardPage()
    } catch (error) {
      // Expected redirect error
    }

    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })

  it('redirects to login if user not found', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null)
    ;(redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    try {
      await DashboardPage()
    } catch (error) {
      // Expected redirect error
    }

    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })

  it('renders dashboard with loan statistics', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      loans: mockLoans,
    }

    ;(getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

    const Component = await DashboardPage()
    const { getByTestId, getByText } = render(Component)

    expect(getByText('Dashboard')).toBeInTheDocument()
    expect(getByTestId('dashboard-stats')).toBeInTheDocument()
    expect(getByTestId('dashboard-client')).toBeInTheDocument()
    
    // Check loan counts
    expect(getByTestId('active-loans')).toHaveTextContent('2 active')
    expect(getByTestId('overdue-loans')).toHaveTextContent('1 overdue')
    expect(getByTestId('returned-loans')).toHaveTextContent('1 returned')
  })

  it('queries user with correct parameters', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      loans: [],
    }

    ;(getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

    await DashboardPage()

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      include: {
        loans: {
          include: {
            photos: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    })
  })

  it('correctly categorizes loans', async () => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const detailedMockLoans = [
      // Active loan (not overdue)
      {
        id: '1',
        returned_at: null,
        return_by: futureDate,
        photos: [],
        created_at: now,
      },
      // Active loan (overdue)
      {
        id: '2',
        returned_at: null,
        return_by: pastDate,
        photos: [],
        created_at: now,
      },
      // Returned loan
      {
        id: '3',
        returned_at: now,
        return_by: futureDate,
        photos: [],
        created_at: now,
      },
    ]

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      loans: detailedMockLoans,
    }

    ;(getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

    const Component = await DashboardPage()
    const { getByTestId } = render(Component)

    expect(getByTestId('active-loans')).toHaveTextContent('2 active')
    expect(getByTestId('overdue-loans')).toHaveTextContent('1 overdue')
    expect(getByTestId('returned-loans')).toHaveTextContent('1 returned')
  })
})