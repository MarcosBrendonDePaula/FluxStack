// 🖼️ Live Image Upload Component - Example of chunked file upload
import { LiveComponent } from '@/core/types/types'

interface ImageUploadState {
  uploadedImages: Array<{
    id: string
    filename: string
    url: string
    uploadedAt: number
  }>
  maxImages: number
}

export class LiveImageUploadComponent extends LiveComponent<ImageUploadState> {
  constructor(initialState: ImageUploadState, ws: any, options?: { room?: string; userId?: string }) {
    super({
      uploadedImages: [],
      maxImages: 10,
      ...initialState
    }, ws, options)
  }

  /**
   * Handle successful file upload
   * This is called from the client after useChunkedUpload completes
   */
  async onFileUploaded(payload: { filename: string; fileUrl: string }): Promise<void> {
    const { filename, fileUrl } = payload

    // Add new image to the list
    const newImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename,
      url: fileUrl,
      uploadedAt: Date.now()
    }

    // Limit to maxImages
    const updatedImages = [newImage, ...this.state.uploadedImages].slice(0, this.state.maxImages)

    this.state = {
      ...this.state,
      uploadedImages: updatedImages
    }

    // Broadcast updated state to all clients
    this.broadcastStateUpdate()
  }

  /**
   * Remove an uploaded image
   */
  async removeImage(payload: { imageId: string }): Promise<void> {
    this.state = {
      ...this.state,
      uploadedImages: this.state.uploadedImages.filter(img => img.id !== payload.imageId)
    }

    this.broadcastStateUpdate()
  }

  /**
   * Clear all uploaded images
   */
  async clearAll(): Promise<void> {
    this.state = {
      ...this.state,
      uploadedImages: []
    }

    this.broadcastStateUpdate()
  }

  /**
   * Get upload statistics
   */
  async getStats(): Promise<{
    totalImages: number
    remainingSlots: number
  }> {
    return {
      totalImages: this.state.uploadedImages.length,
      remainingSlots: this.state.maxImages - this.state.uploadedImages.length
    }
  }
}
