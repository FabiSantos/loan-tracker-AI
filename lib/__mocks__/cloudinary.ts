// Mock implementation of cloudinary functions
export const uploadImage = jest.fn().mockResolvedValue({
  url: 'https://example.com/mock-image.jpg',
  public_id: 'mock-public-id',
})

export const deleteImage = jest.fn().mockResolvedValue(true)