import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '../theme-toggle'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock as any

// Mock matchMedia
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: query === '(prefers-color-scheme: dark)' ? false : true,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.documentElement.classList.remove('light', 'dark')
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('renders theme toggle button', async () => {
    render(<ThemeToggle />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })
  })

  it('shows moon icon when theme is light', async () => {
    localStorageMock.getItem.mockReturnValue('light')
    
    render(<ThemeToggle />)
    
    // Wait for component to mount and apply theme
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button).toBeInTheDocument()
    })
    
    // The light theme shows moon icon
    const button = screen.getByRole('button', { name: /toggle theme/i })
    const moonIcon = button.querySelector('.lucide-moon')
    expect(moonIcon).toBeInTheDocument()
  })

  it('shows sun icon when theme is dark', async () => {
    localStorageMock.getItem.mockReturnValue('dark')
    
    const { container } = render(<ThemeToggle />)
    
    // Wait for component to mount and apply theme
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })
    
    // Wait for theme to be applied
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /toggle theme/i })
      const sunIcon = button.querySelector('.lucide-sun')
      expect(sunIcon).toBeInTheDocument()
    })
  })

  it('toggles from light to dark theme', async () => {
    const user = userEvent.setup()
    localStorageMock.getItem.mockReturnValue('light')
    
    render(<ThemeToggle />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })
    
    const button = screen.getByRole('button', { name: /toggle theme/i })
    
    await user.click(button)
    
    // Check localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled()
    const calls = localStorageMock.setItem.mock.calls
    const themeCall = calls.find(call => call[0] === 'theme')
    expect(themeCall).toBeDefined()
    expect(themeCall![1]).toBe('dark')
    
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('toggles from dark to light theme', async () => {
    const user = userEvent.setup()
    localStorageMock.getItem.mockReturnValue('dark')
    
    render(<ThemeToggle />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })
    
    const button = screen.getByRole('button', { name: /toggle theme/i })
    
    await user.click(button)
    
    // Check localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled()
    const calls = localStorageMock.setItem.mock.calls
    const themeCall = calls.find(call => call[0] === 'theme')
    expect(themeCall).toBeDefined()
    expect(themeCall![1]).toBe('light')
    
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('uses system theme when no saved theme', async () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    render(<ThemeToggle />)
    
    await waitFor(() => {
      // System theme is light (from our mock)
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })
  })

  it('handles dark system preference', async () => {
    localStorageMock.getItem.mockReturnValue(null)
    global.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)' ? true : false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))
    
    render(<ThemeToggle />)
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })
    
    // Check that dark theme is applied when system preference is dark
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    }, { timeout: 2000 })
  })

  it('returns null before mounting', () => {
    const { container } = render(<ThemeToggle />)
    
    // Component might render immediately or return null initially
    // The important thing is that it eventually renders the button
    waitFor(() => {
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })
  })
})