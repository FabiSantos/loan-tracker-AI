import { render } from '@testing-library/react'
import RootLayout, { metadata } from '../layout'

// Mock Next.js font modules
jest.mock('next/font/google', () => ({
  Geist: () => ({
    variable: '--font-geist-sans',
  }),
  Geist_Mono: () => ({
    variable: '--font-geist-mono',
  }),
}))

// Mock the Providers component
jest.mock('../providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}))

// Mock the Toaster component
jest.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster" />,
}))

describe('RootLayout', () => {
  beforeEach(() => {
    // Clear document head and body before each test
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  it('renders children within providers', () => {
    const { getByTestId, getByText } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(getByTestId('providers')).toBeInTheDocument()
    expect(getByText('Test Content')).toBeInTheDocument()
  })

  it('includes toaster component', () => {
    const { getByTestId } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    )

    expect(getByTestId('toaster')).toBeInTheDocument()
  })

  it('renders with correct structure', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    // Check that the layout renders the expected structure
    expect(container.querySelector('[data-testid="providers"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="toaster"]')).toBeInTheDocument()
    expect(container.textContent).toContain('Test Content')
  })

  it('renders body element with content', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="child">Test Child</div>
      </RootLayout>
    )

    // Since RootLayout renders html/body, we check the rendered content
    expect(container.querySelector('[data-testid="child"]')).toBeInTheDocument()
  })

  it('exports correct metadata', () => {
    expect(metadata).toEqual({
      title: 'Loan Tracker',
      description: 'Sistema de seguimiento de préstamos personales',
    })
  })
})