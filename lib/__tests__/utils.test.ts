import { cn } from '../utils'

describe('cn utility', () => {
  it('merges class names', () => {
    const result = cn('px-2 py-1', 'text-sm')
    expect(result).toBe('px-2 py-1 text-sm')
  })

  it('handles conditional classes', () => {
    const result = cn('base-class', false && 'false-class', true && 'true-class')
    expect(result).toBe('base-class true-class')
  })

  it('overwrites conflicting Tailwind classes', () => {
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })

  it('handles arrays of classes', () => {
    const result = cn(['px-2', 'py-1'], ['text-sm', 'font-bold'])
    expect(result).toBe('px-2 py-1 text-sm font-bold')
  })

  it('handles undefined and null values', () => {
    const result = cn('base', undefined, null, 'end')
    expect(result).toBe('base end')
  })

  it('handles empty strings', () => {
    const result = cn('', 'class1', '', 'class2')
    expect(result).toBe('class1 class2')
  })

  it('handles objects with boolean values', () => {
    const result = cn({
      'px-2': true,
      'py-1': true,
      'hidden': false,
    })
    expect(result).toBe('px-2 py-1')
  })

  it('merges responsive and state variants correctly', () => {
    const result = cn('hover:bg-gray-100', 'hover:bg-blue-100')
    expect(result).toBe('hover:bg-blue-100')
  })

  it('preserves non-conflicting classes', () => {
    const result = cn('text-sm', 'font-bold', 'text-blue-500')
    expect(result).toBe('text-sm font-bold text-blue-500')
  })

  it('handles complex nested arrays', () => {
    const result = cn(
      'base',
      ['array1', ['nested', 'array']],
      { 'object-class': true }
    )
    expect(result).toBe('base array1 nested array object-class')
  })
})