import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname } from 'path'
import type { 
  ActiveUpload, 
  FileUploadStartMessage, 
  FileUploadChunkMessage,
  FileUploadCompleteMessage,
  FileUploadProgressResponse,
  FileUploadCompleteResponse
} from '../../types/types'

export class FileUploadManager {
  private activeUploads = new Map<string, ActiveUpload>()
  private readonly maxUploadSize = 50 * 1024 * 1024 // 50MB max
  private readonly chunkTimeout = 30000 // 30 seconds timeout per chunk
  private readonly allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

  constructor() {
    // Cleanup stale uploads every 5 minutes
    setInterval(() => this.cleanupStaleUploads(), 5 * 60 * 1000)
  }

  async startUpload(message: FileUploadStartMessage): Promise<{ success: boolean; error?: string }> {
    try {
      const { uploadId, componentId, filename, fileType, fileSize, chunkSize = 64 * 1024 } = message

      // Validate file type
      if (!this.allowedTypes.includes(fileType)) {
        throw new Error(`Invalid file type: ${fileType}. Allowed: ${this.allowedTypes.join(', ')}`)
      }

      // Validate file size
      if (fileSize > this.maxUploadSize) {
        throw new Error(`File too large: ${fileSize} bytes. Max: ${this.maxUploadSize} bytes`)
      }

      // Check if upload already exists
      if (this.activeUploads.has(uploadId)) {
        throw new Error(`Upload ${uploadId} already in progress`)
      }

      // Calculate total chunks
      const totalChunks = Math.ceil(fileSize / chunkSize)

      // Create upload record
      const upload: ActiveUpload = {
        uploadId,
        componentId,
        filename,
        fileType,
        fileSize,
        totalChunks,
        receivedChunks: new Map(),
        startTime: Date.now(),
        lastChunkTime: Date.now()
      }

      this.activeUploads.set(uploadId, upload)

      console.log('📤 Upload started:', {
        uploadId,
        componentId,
        filename,
        fileType,
        fileSize,
        totalChunks
      })

      return { success: true }

    } catch (error: any) {
      console.error('❌ Upload start failed:', error.message)
      return { success: false, error: error.message }
    }
  }

  async receiveChunk(message: FileUploadChunkMessage, ws: any): Promise<FileUploadProgressResponse | null> {
    try {
      const { uploadId, chunkIndex, totalChunks, data } = message

      const upload = this.activeUploads.get(uploadId)
      if (!upload) {
        throw new Error(`Upload ${uploadId} not found`)
      }

      // Validate chunk index
      if (chunkIndex < 0 || chunkIndex >= totalChunks) {
        throw new Error(`Invalid chunk index: ${chunkIndex}`)
      }

      // Check if chunk already received
      if (upload.receivedChunks.has(chunkIndex)) {
        console.log(`📦 Chunk ${chunkIndex} already received for upload ${uploadId}`)
      } else {
        // Store chunk data
        upload.receivedChunks.set(chunkIndex, data)
        upload.lastChunkTime = Date.now()

        console.log(`📦 Received chunk ${chunkIndex + 1}/${totalChunks} for upload ${uploadId}`)
      }

      // Calculate progress
      const bytesUploaded = upload.receivedChunks.size * 64 * 1024 // Approximate
      const progress = Math.min((upload.receivedChunks.size / totalChunks) * 100, 100)

      const progressResponse: FileUploadProgressResponse = {
        type: 'FILE_UPLOAD_PROGRESS',
        componentId: upload.componentId,
        uploadId,
        chunkIndex,
        totalChunks,
        bytesUploaded,
        totalBytes: upload.fileSize,
        progress,
        requestId: message.requestId,
        timestamp: Date.now()
      }

      return progressResponse

    } catch (error: any) {
      console.error('❌ Chunk receive failed:', error.message)
      this.activeUploads.delete(message.uploadId)
      return null
    }
  }

  async completeUpload(message: FileUploadCompleteMessage): Promise<FileUploadCompleteResponse> {
    try {
      const { uploadId } = message

      const upload = this.activeUploads.get(uploadId)
      if (!upload) {
        throw new Error(`Upload ${uploadId} not found`)
      }

      // Check if all chunks received
      const missingChunks = []
      for (let i = 0; i < upload.totalChunks; i++) {
        if (!upload.receivedChunks.has(i)) {
          missingChunks.push(i)
        }
      }

      if (missingChunks.length > 0) {
        throw new Error(`Missing chunks: ${missingChunks.join(', ')}`)
      }

      // Reconstruct file from chunks
      const chunks: string[] = []
      for (let i = 0; i < upload.totalChunks; i++) {
        chunks.push(upload.receivedChunks.get(i)!)
      }

      // Combine all base64 chunks
      const base64Data = chunks.join('')
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64')

      // Validate reconstructed file size
      if (buffer.length !== upload.fileSize) {
        throw new Error(`File size mismatch: expected ${upload.fileSize}, got ${buffer.length}`)
      }

      // Create uploads directory if needed
      const uploadsDir = join(process.cwd(), 'uploads', 'avatars')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const extension = extname(upload.filename) || '.jpg'
      const filename = `avatar-${timestamp}-${randomId}${extension}`
      const filepath = join(uploadsDir, filename)

      // Write file
      await writeFile(filepath, buffer)

      // Generate file URL (using static files plugin)
      const fileUrl = `/api/uploads/avatars/${filename}`

      // Cleanup upload record
      this.activeUploads.delete(uploadId)

      const duration = Date.now() - upload.startTime
      console.log('✅ Upload completed:', {
        uploadId,
        filename,
        fileSize: upload.fileSize,
        chunks: upload.totalChunks,
        duration: `${duration}ms`,
        fileUrl
      })

      return {
        type: 'FILE_UPLOAD_COMPLETE',
        componentId: upload.componentId,
        uploadId,
        success: true,
        filename,
        fileUrl,
        requestId: message.requestId,
        timestamp: Date.now()
      }

    } catch (error: any) {
      console.error('❌ Upload completion failed:', error.message)
      
      // Cleanup failed upload
      this.activeUploads.delete(message.uploadId)

      return {
        type: 'FILE_UPLOAD_COMPLETE',
        componentId: message.componentId,
        uploadId: message.uploadId,
        success: false,
        error: error.message,
        requestId: message.requestId,
        timestamp: Date.now()
      }
    }
  }

  private cleanupStaleUploads() {
    const now = Date.now()
    const staleUploads: string[] = []

    for (const [uploadId, upload] of this.activeUploads.entries()) {
      const timeSinceLastChunk = now - upload.lastChunkTime
      
      if (timeSinceLastChunk > this.chunkTimeout) {
        staleUploads.push(uploadId)
      }
    }

    for (const uploadId of staleUploads) {
      this.activeUploads.delete(uploadId)
      console.log(`🧹 Cleaned up stale upload: ${uploadId}`)
    }

    if (staleUploads.length > 0) {
      console.log(`🧹 Cleaned up ${staleUploads.length} stale uploads`)
    }
  }

  getUploadStatus(uploadId: string): ActiveUpload | null {
    return this.activeUploads.get(uploadId) || null
  }

  getStats() {
    return {
      activeUploads: this.activeUploads.size,
      uploads: Array.from(this.activeUploads.values()).map(upload => ({
        uploadId: upload.uploadId,
        componentId: upload.componentId,
        filename: upload.filename,
        progress: (upload.receivedChunks.size / upload.totalChunks) * 100,
        duration: Date.now() - upload.startTime
      }))
    }
  }
}

// Global file upload manager instance
export const fileUploadManager = new FileUploadManager()