import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageViewer } from '../image-viewer'

// Mock de Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

describe('ImageViewer', () => {
  const mockImages = [
    { id: '1', url: '/uploads/photo1.jpg' },
    { id: '2', url: '/uploads/photo2.jpg' },
    { id: '3', url: '/uploads/photo3.jpg' },
  ]

  it('renders all images in grid', () => {
    render(<ImageViewer images={mockImages} />)
    
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(mockImages.length)
  })

  it('opens modal when clicking an image', async () => {
    const user = userEvent.setup()
    render(<ImageViewer images={mockImages} />)
    
    const firstImage = screen.getAllByRole('img')[0]
    await user.click(firstImage)
    
    // Modal should show navigation buttons and indicator
    // Look for SVG icons within buttons since they don't have aria-labels
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(2) // Navigation buttons + close button
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('navigates between images', async () => {
    const user = userEvent.setup()
    render(<ImageViewer images={mockImages} />)
    
    // Open modal
    const firstImage = screen.getAllByRole('img')[0]
    await user.click(firstImage)
    
    // Click next button (the right arrow button)
    const buttons = screen.getAllByRole('button')
    const nextButton = buttons.find(btn => btn.querySelector('.lucide-chevron-right'))
    await user.click(nextButton!)
    
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    
    // Click previous button (the left arrow button)
    const prevButton = buttons.find(btn => btn.querySelector('.lucide-chevron-left'))
    await user.click(prevButton!)
    
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('wraps around when navigating past last image', async () => {
    const user = userEvent.setup()
    render(<ImageViewer images={mockImages} initialIndex={2} />)
    
    // Open modal at last image
    const lastImage = screen.getAllByRole('img')[2]
    await user.click(lastImage)
    
    // Click next (should go to first)
    const buttons = screen.getAllByRole('button')
    const nextButton = buttons.find(btn => btn.querySelector('.lucide-chevron-right'))
    await user.click(nextButton!)
    
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('wraps around when navigating before first image', async () => {
    const user = userEvent.setup()
    render(<ImageViewer images={mockImages} />)
    
    // Open modal at first image
    const firstImage = screen.getAllByRole('img')[0]
    await user.click(firstImage)
    
    // Click previous (should go to last)
    const buttons = screen.getAllByRole('button')
    const prevButton = buttons.find(btn => btn.querySelector('.lucide-chevron-left'))
    await user.click(prevButton!)
    
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('closes modal when clicking close button', async () => {
    const user = userEvent.setup()
    render(<ImageViewer images={mockImages} />)
    
    // Open modal
    const firstImage = screen.getAllByRole('img')[0]
    await user.click(firstImage)
    
    // Click close
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    // Indicator should not be visible
    expect(screen.queryByText('1 / 3')).not.toBeInTheDocument()
  })

  it('does not show navigation for single image', () => {
    render(<ImageViewer images={[mockImages[0]]} />)
    
    const image = screen.getByRole('img')
    userEvent.click(image)
    
    // Navigation should not be present
    expect(screen.queryByLabelText('Previous')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Next')).not.toBeInTheDocument()
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument()
  })

  it('handles empty images array', () => {
    render(<ImageViewer images={[]} />)
    
    // Should not crash and render nothing
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('applies correct styling to images', () => {
    render(<ImageViewer images={mockImages} />)
    
    const images = screen.getAllByRole('img')
    images.forEach(img => {
      expect(img).toHaveClass('object-cover', 'rounded-lg', 'cursor-pointer')
    })
  })

  it('sets correct image attributes', () => {
    render(<ImageViewer images={mockImages} />)
    
    const images = screen.getAllByRole('img')
    images.forEach((img, index) => {
      expect(img).toHaveAttribute('src', mockImages[index].url)
      expect(img).toHaveAttribute('alt', `Foto ${index + 1}`)
      expect(img).toHaveAttribute('loading', 'lazy')
    })
  })
})