import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '../toast'

describe('Toast Components', () => {
  describe('Toast', () => {
    it('renders with default variant', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Test Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      const toast = screen.getByText('Test Toast').closest('li')
      expect(toast).toHaveClass('bg-background', 'text-foreground')
    })

    it('renders with destructive variant', () => {
      render(
        <ToastProvider>
          <Toast variant="destructive">
            <ToastTitle>Error Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      const toast = screen.getByText('Error Toast').closest('li')
      expect(toast).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('applies custom className', () => {
      render(
        <ToastProvider>
          <Toast className="custom-class">
            <ToastTitle>Test Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      const toast = screen.getByText('Test Toast').closest('li')
      expect(toast).toHaveClass('custom-class')
    })
  })

  describe('ToastTitle', () => {
    it('renders title text', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Toast Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      expect(screen.getByText('Toast Title')).toBeInTheDocument()
    })

    it('applies title styling', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Toast Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      const title = screen.getByText('Toast Title')
      expect(title).toHaveClass('text-sm', 'font-semibold')
    })
  })

  describe('ToastDescription', () => {
    it('renders description text', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastDescription>Toast description</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      expect(screen.getByText('Toast description')).toBeInTheDocument()
    })

    it('applies description styling', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastDescription>Toast description</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      const description = screen.getByText('Toast description')
      expect(description).toHaveClass('text-sm', 'opacity-90')
    })
  })

  describe('ToastClose', () => {
    it('renders close button', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Test Toast</ToastTitle>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      const closeButton = screen.getByRole('button')
      expect(closeButton).toHaveAttribute('toast-close', '')
    })

    it('shows X icon', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Test Toast</ToastTitle>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      const closeButton = screen.getByRole('button')
      const icon = closeButton.querySelector('svg')
      expect(icon).toHaveClass('h-4', 'w-4')
    })

    it('has hover styles', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Test Toast</ToastTitle>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      const closeButton = screen.getByRole('button')
      expect(closeButton).toHaveClass('hover:text-foreground')
    })
  })

  describe('ToastAction', () => {
    it('renders action button', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Test Toast</ToastTitle>
            <ToastAction altText="Undo action">Undo</ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    })

    it('applies action styling', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Test Toast</ToastTitle>
            <ToastAction altText="Undo action">Undo</ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      const action = screen.getByRole('button', { name: /undo/i })
      expect(action).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })
  })

  describe('ToastViewport', () => {
    it('renders viewport container', () => {
      const { container } = render(
        <ToastProvider>
          <ToastViewport />
        </ToastProvider>
      )
      
      const viewport = container.querySelector('ol')
      expect(viewport).toBeInTheDocument()
    })

    it('applies viewport positioning', () => {
      const { container } = render(
        <ToastProvider>
          <ToastViewport />
        </ToastProvider>
      )
      
      const viewport = container.querySelector('ol')
      expect(viewport).toHaveClass('fixed', 'top-0', 'z-[100]')
    })

    it('applies custom className to viewport', () => {
      const { container } = render(
        <ToastProvider>
          <ToastViewport className="custom-viewport" />
        </ToastProvider>
      )
      
      const viewport = container.querySelector('ol')
      expect(viewport).toHaveClass('custom-viewport')
    })
  })

  describe('Integration', () => {
    it('renders complete toast with all components', () => {
      render(
        <ToastProvider>
          <Toast>
            <div className="grid gap-1">
              <ToastTitle>Success!</ToastTitle>
              <ToastDescription>Your changes have been saved.</ToastDescription>
            </div>
            <ToastAction altText="Undo">Undo</ToastAction>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      expect(screen.getByText('Success!')).toBeInTheDocument()
      expect(screen.getByText('Your changes have been saved.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
      expect(screen.getAllByRole('button')).toHaveLength(2) // Undo + Close
    })
  })
})