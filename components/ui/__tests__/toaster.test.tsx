import { render, screen } from '@testing-library/react'
import { Toaster } from '../toaster'
import { useToast } from '../use-toast'

// Mock the useToast hook
jest.mock('../use-toast', () => ({
  useToast: jest.fn(),
}))

// Mock Toast components
jest.mock('../toast', () => ({
  Toast: ({ children, ...props }: any) => <div data-testid="toast" {...props}>{children}</div>,
  ToastTitle: ({ children }: any) => <div data-testid="toast-title">{children}</div>,
  ToastDescription: ({ children }: any) => <div data-testid="toast-description">{children}</div>,
  ToastClose: () => <button data-testid="toast-close">Close</button>,
  ToastViewport: ({ children }: any) => <div data-testid="toast-viewport">{children}</div>,
  ToastProvider: ({ children }: any) => <div data-testid="toast-provider">{children}</div>,
}))

describe('Toaster', () => {
  const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

  beforeEach(() => {
    mockUseToast.mockClear()
  })

  it('renders toasts from useToast hook', () => {
    mockUseToast.mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Test Toast',
          description: 'Test description',
        },
      ],
      toast: jest.fn(),
      dismiss: jest.fn(),
    })

    render(<Toaster />)

    expect(screen.getByTestId('toast-provider')).toBeInTheDocument()
    expect(screen.getByTestId('toast')).toBeInTheDocument()
    expect(screen.getByText('Test Toast')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('renders multiple toasts', () => {
    mockUseToast.mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Toast 1',
        },
        {
          id: '2',
          title: 'Toast 2',
        },
      ],
      toast: jest.fn(),
      dismiss: jest.fn(),
    })

    render(<Toaster />)

    expect(screen.getAllByTestId('toast')).toHaveLength(2)
    expect(screen.getByText('Toast 1')).toBeInTheDocument()
    expect(screen.getByText('Toast 2')).toBeInTheDocument()
  })

  it('renders toast with action', () => {
    const mockAction = <button>Undo</button>
    
    mockUseToast.mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Test Toast',
          action: mockAction,
        },
      ],
      toast: jest.fn(),
      dismiss: jest.fn(),
    })

    render(<Toaster />)

    expect(screen.getByText('Undo')).toBeInTheDocument()
  })

  it('renders toast without description', () => {
    mockUseToast.mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Title only',
        },
      ],
      toast: jest.fn(),
      dismiss: jest.fn(),
    })

    render(<Toaster />)

    expect(screen.getByText('Title only')).toBeInTheDocument()
    expect(screen.queryByTestId('toast-description')).not.toBeInTheDocument()
  })

  it('renders empty when no toasts', () => {
    mockUseToast.mockReturnValue({
      toasts: [],
      toast: jest.fn(),
      dismiss: jest.fn(),
    })

    render(<Toaster />)

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
  })

  it('passes toast props correctly', () => {
    mockUseToast.mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Test',
          variant: 'destructive',
        },
      ],
      toast: jest.fn(),
      dismiss: jest.fn(),
    })

    render(<Toaster />)

    const toast = screen.getByTestId('toast')
    expect(toast).toHaveAttribute('variant', 'destructive')
  })
})