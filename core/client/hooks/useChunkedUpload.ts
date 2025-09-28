import { useState, useCallback, useRef } from 'react'
import type { 
  FileUploadStartMessage, 
  FileUploadChunkMessage, 
  FileUploadCompleteMessage,
  FileUploadProgressResponse,
  FileUploadCompleteResponse
} from '../../types/types'

export interface ChunkedUploadOptions {
  chunkSize?: number // Default 64KB
  maxFileSize?: number // Default 50MB
  allowedTypes?: string[]
  sendMessageAndWait?: (message: any, timeout?: number) => Promise<any> // WebSocket send function
  onProgress?: (progress: number, bytesUploaded: number, totalBytes: number) => void
  onComplete?: (response: FileUploadCompleteResponse) => void
  onError?: (error: string) => void
}

export interface ChunkedUploadState {
  uploading: boolean
  progress: number
  error: string | null
  uploadId: string | null
  bytesUploaded: number
  totalBytes: number
}

export function useChunkedUpload(componentId: string, options: ChunkedUploadOptions = {}) {
  
  const [state, setState] = useState<ChunkedUploadState>({
    uploading: false,
    progress: 0,
    error: null,
    uploadId: null,
    bytesUploaded: 0,
    totalBytes: 0
  })

  const {
    chunkSize = 64 * 1024, // 64KB default
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    sendMessageAndWait,
    onProgress,
    onComplete,
    onError
  } = options

  const abortControllerRef = useRef<AbortController | null>(null)

  // Convert file to base64 chunks
  const fileToChunks = useCallback(async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Split binary data into chunks first, then convert each chunk to base64
        const chunks: string[] = []
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunkEnd = Math.min(i + chunkSize, uint8Array.length)
          const chunkBytes = uint8Array.slice(i, chunkEnd)
          
          // Convert chunk to base64
          let binary = ''
          for (let j = 0; j < chunkBytes.length; j++) {
            binary += String.fromCharCode(chunkBytes[j])
          }
          const base64Chunk = btoa(binary)
          chunks.push(base64Chunk)
        }
        
        resolve(chunks)
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }, [chunkSize])

  // Start chunked upload
  const uploadFile = useCallback(async (file: File) => {
    if (!sendMessageAndWait) {
      const error = 'No sendMessageAndWait function provided'
      setState(prev => ({ ...prev, error }))
      onError?.(error)
      return
    }

    // Validate file
    if (!allowedTypes.includes(file.type)) {
      const error = `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`
      setState(prev => ({ ...prev, error }))
      onError?.(error)
      return
    }

    if (file.size > maxFileSize) {
      const error = `File too large: ${file.size} bytes. Max: ${maxFileSize} bytes`
      setState(prev => ({ ...prev, error }))
      onError?.(error)
      return
    }

    try {
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      
      // Create abort controller for this upload
      abortControllerRef.current = new AbortController()
      
      setState({
        uploading: true,
        progress: 0,
        error: null,
        uploadId,
        bytesUploaded: 0,
        totalBytes: file.size
      })

      console.log('🚀 Starting chunked upload:', { uploadId, filename: file.name, size: file.size })

      // Convert file to chunks
      const chunks = await fileToChunks(file)
      const totalChunks = chunks.length

      console.log(`📦 File split into ${totalChunks} chunks of ~${chunkSize} bytes each`)

      // Start upload
      const startMessage: FileUploadStartMessage = {
        type: 'FILE_UPLOAD_START',
        componentId,
        uploadId,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        chunkSize,
        requestId: `start-${uploadId}`
      }

      const startResponse = await sendMessageAndWait(startMessage, 10000)
      if (!startResponse?.success) {
        throw new Error(startResponse?.error || 'Failed to start upload')
      }

      console.log('✅ Upload started successfully')

      // Send chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Upload cancelled')
        }

        const chunkMessage: FileUploadChunkMessage = {
          type: 'FILE_UPLOAD_CHUNK',
          componentId,
          uploadId,
          chunkIndex: i,
          totalChunks,
          data: chunks[i],
          requestId: `chunk-${uploadId}-${i}`
        }

        console.log(`📤 Sending chunk ${i + 1}/${totalChunks}`)

        // Send chunk and wait for progress response
        const progressResponse = await sendMessageAndWait(chunkMessage, 10000) as FileUploadProgressResponse
        
        if (progressResponse) {
          const { progress, bytesUploaded } = progressResponse
          setState(prev => ({ ...prev, progress, bytesUploaded }))
          onProgress?.(progress, bytesUploaded, file.size)
        }

        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Complete upload
      const completeMessage: FileUploadCompleteMessage = {
        type: 'FILE_UPLOAD_COMPLETE',
        componentId,
        uploadId,
        requestId: `complete-${uploadId}`
      }

      console.log('🏁 Completing upload...')

      const completeResponse = await sendMessageAndWait(completeMessage, 10000) as FileUploadCompleteResponse

      if (completeResponse?.success) {
        setState(prev => ({ 
          ...prev, 
          uploading: false, 
          progress: 100,
          bytesUploaded: file.size
        }))
        
        console.log('🎉 Upload completed successfully:', completeResponse.fileUrl)
        onComplete?.(completeResponse)
      } else {
        throw new Error(completeResponse?.error || 'Upload completion failed')
      }

    } catch (error: any) {
      console.error('❌ Chunked upload failed:', error.message)
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: error.message 
      }))
      onError?.(error.message)
    }
  }, [
    componentId,
    allowedTypes,
    maxFileSize,
    chunkSize,
    sendMessageAndWait,
    fileToChunks,
    onProgress,
    onComplete,
    onError
  ])

  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: 'Upload cancelled' 
      }))
    }
  }, [])

  // Reset state
  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      uploadId: null,
      bytesUploaded: 0,
      totalBytes: 0
    })
  }, [])

  return {
    ...state,
    uploadFile,
    cancelUpload,
    reset
  }
}