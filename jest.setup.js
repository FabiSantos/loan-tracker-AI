// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Add global Request/Response polyfills for API route testing
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url
      this.method = init.method || 'GET'
      this.headers = new Map(Object.entries(init.headers || {}))
      this.body = init.body
      this._bodyUsed = false
    }

    async json() {
      if (this._bodyUsed) throw new Error('Body already read')
      this._bodyUsed = true
      return JSON.parse(this.body)
    }

    async text() {
      if (this._bodyUsed) throw new Error('Body already read')
      this._bodyUsed = true
      return this.body
    }

    async formData() {
      if (this._bodyUsed) throw new Error('Body already read')
      this._bodyUsed = true
      // Return the FormData object if it was passed directly
      if (this.body instanceof FormData) {
        return this.body
      }
      // Otherwise create a new FormData
      return new FormData()
    }
  }
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Map(Object.entries(init.headers || {}))
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }

    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }
  }
}

// Add FormData polyfill if needed
if (typeof FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this._data = new Map()
    }

    append(key, value) {
      this._data.set(key, value)
    }

    get(key) {
      return this._data.get(key)
    }

    has(key) {
      return this._data.has(key)
    }

    delete(key) {
      return this._data.delete(key)
    }

    entries() {
      return this._data.entries()
    }
  }
}

// Add File polyfill if needed
if (typeof File === 'undefined') {
  global.File = class File {
    constructor(bits, name, options = {}) {
      this.bits = bits
      this.name = name
      this.type = options.type || ''
      this.lastModified = options.lastModified || Date.now()
    }
  }
}