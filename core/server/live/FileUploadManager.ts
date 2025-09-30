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
      const progress = (upload.receivedChunks.size / totalChunks) * 100
      const bytesUploaded = upload.receivedChunks.size * (upload.fileSize / totalChunks)

      // Check if upload is complete
      if (upload.receivedChunks.size === totalChunks) {
        await this.finalizeUpload(upload)
      }

      return {
        type: 'FILE_UPLOAD_PROGRESS',
        componentId: upload.componentId,
        uploadId: upload.uploadId,
        chunkIndex,
        totalChunks,
        bytesUploaded: Math.min(bytesUploaded, upload.fileSize),
        totalBytes: upload.fileSize,
        progress: Math.min(progress, 100),
        timestamp: Date.now()
      }

    } catch (error: any) {
      console.error(`❌ Chunk receive failed for upload ${message.uploadId}:`, error.message)
      throw error
    }
  }

  private async finalizeUpload(upload: ActiveUpload): Promise<void> {
    try {
      console.log(`✅ Upload completed: ${upload.uploadId}`)
      
      // Assemble file from chunks
      const fileUrl = await this.assembleFile(upload)
      
      // Cleanup
      this.activeUploads.delete(upload.uploadId)
      
    } catch (error: any) {
      console.error(`❌ Upload finalization failed for ${upload.uploadId}:`, error.message)
      throw error
    }
  }

  async completeUpload(message: FileUploadCompleteMessage): Promise<FileUploadCompleteResponse> {
    try {
      const { uploadId } = message

      const upload = this.activeUploads.get(uploadId)
      if (!upload) {
        throw new Error(`Upload ${uploadId} not found`)
      }

      console.log(`✅ Upload completed: ${uploadId}`)

      // Check for missing chunks
      const missingChunks: number[] = []
      for (let i = 0; i < upload.totalChunks; i++) {
        if (!upload.receivedChunks.has(i)) {
          missingChunks.push(i)
        }
      }

      if (missingChunks.length > 0) {
        throw new Error(`Missing chunks: ${missingChunks.join(', ')}`)
      }

      // Assemble file from chunks
      const fileUrl = await this.assembleFile(upload)

      // Cleanup
      this.activeUploads.delete(uploadId)

      return {
        type: 'FILE_UPLOAD_COMPLETE',
        componentId: upload.componentId,
        uploadId: upload.uploadId,
        success: true,
        filename: upload.filename,
        fileUrl,
        timestamp: Date.now()
      }

    } catch (error: any) {
      console.error(`❌ Upload completion failed for ${message.uploadId}:`, error.message)
      
      return {
        type: 'FILE_UPLOAD_COMPLETE',
        componentId: '',
        uploadId: message.uploadId,
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  private async assembleFile(upload: ActiveUpload): Promise<string> {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = './uploads'
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const extension = extname(upload.filename)
      const baseName = upload.filename.replace(extension, '')
      const safeFilename = `${baseName}_${timestamp}${extension}`
      const filePath = join(uploadsDir, safeFilename)

      // Assemble chunks in order
      const chunks: Buffer[] = []
      for (let i = 0; i < upload.totalChunks; i++) {
        const chunkData = upload.receivedChunks.get(i)
        if (chunkData) {
          chunks.push(Buffer.from(chunkData, 'base64'))
        }
      }

      // Write assembled file
      const fileBuffer = Buffer.concat(chunks)
      await writeFile(filePath, fileBuffer)

      console.log(`📁 File assembled: ${filePath}`)
      return `/uploads/${safeFilename}`

    } catch (error) {
      console.error('❌ File assembly failed:', error)
      throw error
    }
  }

  private cleanupStaleUploads(): void {
    const now = Date.now()
    const staleUploads: string[] = []

    for (const [uploadId, upload] of this.activeUploads) {
      const timeSinceLastChunk = now - upload.lastChunkTime
      
      if (timeSinceLastChunk > this.chunkTimeout * 2) {
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
      maxUploadSize: this.maxUploadSize,
      allowedTypes: this.allowedTypes
    }
  }
}

// Global instance
export const fileUploadManager = new FileUploadManager()