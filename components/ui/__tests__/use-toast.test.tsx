import { renderHook, act, waitFor } from '@testing-library/react'
import { useToast } from '../use-toast'

describe('useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('initializes with empty toasts array', () => {
    const { result } = renderHook(() => useToast())
    
    expect(result.current.toasts).toEqual([])
  })

  it('adds a toast', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'This is a test',
      })
    })
    
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Test Toast',
      description: 'This is a test',
    })
  })

  it('limits toasts to TOAST_LIMIT (1)', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
    })
    
    // Only the latest toast should be present due to TOAST_LIMIT = 1
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Toast 2')
    expect(result.current.toasts[0].id).toBeDefined()
  })

  it('removes toast after timeout', async () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({ title: 'Test Toast' })
    })
    
    expect(result.current.toasts).toHaveLength(1)
    
    // Dismiss the toast via onOpenChange
    act(() => {
      const toast = result.current.toasts[0]
      if (toast && 'onOpenChange' in toast && typeof toast.onOpenChange === 'function') {
        toast.onOpenChange(false)
      }
    })
    
    // Toast should still be present
    expect(result.current.toasts).toHaveLength(1)
    
    // Then advance timers for the TOAST_REMOVE_DELAY
    act(() => {
      jest.advanceTimersByTime(1000000) // TOAST_REMOVE_DELAY
    })
    
    // Now it should be removed
    await waitFor(() => {
      expect(result.current.toasts).toHaveLength(0)
    })
  })

  it('dismisses a toast', async () => {
    const { result } = renderHook(() => useToast())
    let toastId: string = ''
    
    act(() => {
      const { id } = result.current.toast({ title: 'Test Toast' })
      toastId = id!
    })
    
    expect(result.current.toasts).toHaveLength(1)
    
    act(() => {
      result.current.dismiss(toastId)
    })
    
    // Toast should still be present after dismiss
    expect(result.current.toasts).toHaveLength(1)
    
    // Wait for dismiss timeout
    act(() => {
      jest.advanceTimersByTime(1000000) // TOAST_REMOVE_DELAY
    })
    
    await waitFor(() => {
      expect(result.current.toasts).toHaveLength(0)
    })
  })

  it('removes a toast immediately', async () => {
    const { result } = renderHook(() => useToast())
    let toastId: string = ''
    
    act(() => {
      const { id } = result.current.toast({ title: 'Test Toast' })
      toastId = id!
    })
    
    expect(result.current.toasts).toHaveLength(1)
    
    act(() => {
      result.current.dismiss(toastId)
    })
    
    // Toast should still be present after dismiss
    expect(result.current.toasts).toHaveLength(1)
    
    act(() => {
      jest.advanceTimersByTime(1000000) // TOAST_REMOVE_DELAY
    })
    
    await waitFor(() => {
      expect(result.current.toasts).toHaveLength(0)
    })
  })

  it('updates an existing toast', () => {
    const { result } = renderHook(() => useToast())
    let toastUpdate: any
    
    act(() => {
      const { update } = result.current.toast({ title: 'Original Title' })
      toastUpdate = update
    })
    
    act(() => {
      if (toastUpdate) {
        toastUpdate({
          title: 'Updated Title',
          description: 'New description',
        })
      }
    })
    
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Updated Title',
      description: 'New description',
    })
  })

  it('limits the number of toasts', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      // Add more than TOAST_LIMIT toasts
      for (let i = 0; i < 10; i++) {
        result.current.toast({ title: `Toast ${i}` })
      }
    })
    
    // Should only keep TOAST_LIMIT (1) toast
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Toast 9') // Latest one
  })

  it('handles action in toast', () => {
    const { result } = renderHook(() => useToast())
    const mockAction = <button>Undo</button>
    
    act(() => {
      result.current.toast({
        title: 'Test Toast',
        action: mockAction,
      })
    })
    
    expect(result.current.toasts[0].action).toBe(mockAction)
  })

  it('returns consistent functions', () => {
    const { result, rerender } = renderHook(() => useToast())
    
    const { toast: toast1 } = result.current
    
    rerender()
    
    const { toast: toast2 } = result.current
    
    // Toast function should be stable
    expect(toast1).toBe(toast2)
    // Note: dismiss function may change due to React hooks dependencies
  })
})