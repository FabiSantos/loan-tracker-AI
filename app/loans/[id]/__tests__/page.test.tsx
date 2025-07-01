import React from 'react'
import { render } from '@testing-library/react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import LoanDetailsPage from '../page'
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
    loan: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('@/components/loans/loan-details-client', () => ({
  LoanDetailsClient: ({ loan }: any) => (
    <div data-testid="loan-details-client">
      <div data-testid="loan-id">{loan.id}</div>
      <div data-testid="loan-item">{loan.item_name}</div>
    </div>
  ),
}))

describe('LoanDetailsPage', () => {
  const mockLoan = {
    id: '123',
    user_id: 'user-1',
    item_name: 'Test Book',
    recipient_name: 'John Doe',
    photos: [],
    reminders: [],
  }

  const mockParams = Promise.resolve({ id: '123' })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to login if no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null)
    ;(redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    try {
      await LoanDetailsPage({ params: mockParams })
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
      await LoanDetailsPage({ params: mockParams })
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
      await LoanDetailsPage({ params: mockParams })
    } catch (error) {
      // Expected redirect error
    }

    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })

  it('redirects to dashboard if loan not found', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
    })
    ;(prisma.loan.findFirst as jest.Mock).mockResolvedValueOnce(null)
    ;(redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    try {
      await LoanDetailsPage({ params: mockParams })
    } catch (error) {
      // Expected redirect error
    }

    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })

  it('renders loan details when loan is found', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
    })
    ;(prisma.loan.findFirst as jest.Mock).mockResolvedValueOnce(mockLoan)

    const Component = await LoanDetailsPage({ params: mockParams })
    const { getByTestId } = render(Component)

    expect(getByTestId('loan-details-client')).toBeInTheDocument()
    expect(getByTestId('loan-id')).toHaveTextContent('123')
    expect(getByTestId('loan-item')).toHaveTextContent('Test Book')
  })

  it('queries loan with correct parameters', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
    }

    ;(getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)
    ;(prisma.loan.findFirst as jest.Mock).mockResolvedValueOnce(mockLoan)

    await LoanDetailsPage({ params: mockParams })

    expect(prisma.loan.findFirst).toHaveBeenCalledWith({
      where: {
        id: '123',
        user_id: 'user-1',
      },
      include: {
        photos: true,
        reminders: true,
      },
    })
  })

  it('handles params promise correctly', async () => {
    const delayedParams = new Promise<{ id: string }>((resolve) => {
      setTimeout(() => resolve({ id: '456' }), 100)
    })

    ;(getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
    })
    ;(prisma.loan.findFirst as jest.Mock).mockResolvedValueOnce({
      ...mockLoan,
      id: '456',
    })

    const Component = await LoanDetailsPage({ params: delayedParams })
    const { getByTestId } = render(Component)

    expect(getByTestId('loan-id')).toHaveTextContent('456')
    expect(prisma.loan.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: '456',
        }),
      })
    )
  })
})