import { render, screen } from '@testing-library/react'
import HomePage from '../page'

// Mock the redirect function
const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}))

describe('Home Page', () => {
  beforeEach(() => {
    mockRedirect.mockClear()
  })

  it('redirects to dashboard', () => {
    render(<HomePage />)
    
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('renders nothing (null)', () => {
    const { container } = render(<HomePage />)
    
    expect(container.firstChild).toBeNull()
  })
})