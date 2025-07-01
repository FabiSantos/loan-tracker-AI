import { render, screen } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { Providers } from '../providers'

jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-client-provider">{children}</div>
  ),
}))

describe('Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children within QueryClientProvider', () => {
    const mockQueryClient = {
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
    }
    ;(QueryClient as jest.Mock).mockImplementation(() => mockQueryClient)

    render(
      <Providers>
        <div data-testid="test-child">Test Child</div>
      </Providers>
    )

    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument()
    expect(screen.getByTestId('test-child')).toBeInTheDocument()
  })

  it('creates QueryClient with correct options', () => {
    render(
      <Providers>
        <div>Test</div>
      </Providers>
    )

    expect(QueryClient).toHaveBeenCalledWith({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
    })
  })

  it('only creates QueryClient once on re-renders', () => {
    const { rerender } = render(
      <Providers>
        <div>Test 1</div>
      </Providers>
    )

    const initialCallCount = (QueryClient as jest.Mock).mock.calls.length

    rerender(
      <Providers>
        <div>Test 2</div>
      </Providers>
    )

    expect((QueryClient as jest.Mock).mock.calls.length).toBe(initialCallCount)
  })
})