import { Elysia, t } from 'elysia'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname } from 'path'

export const uploadRoutes = new Elysia({ prefix: '/upload' })
  .post('/avatar', async ({ body }: { body: { file: File } }) => {
    try {
      const { file } = body
      
      if (!file) {
        throw new Error('No file provided')
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.')
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 5MB.')
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'uploads', 'avatars')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const extension = extname(file.name) || '.jpg'
      const filename = `avatar-${timestamp}-${randomId}${extension}`
      const filepath = join(uploadsDir, filename)

      // Convert file to buffer and save
      const buffer = await file.arrayBuffer()
      await writeFile(filepath, new Uint8Array(buffer))

      // Return the URL path for the uploaded file
      const imageUrl = `/uploads/avatars/${filename}`
      
      console.log('📸 Avatar uploaded successfully:', {
        filename,
        size: file.size,
        type: file.type,
        url: imageUrl
      })

      return {
        success: true,
        message: 'Avatar uploaded successfully',
        imageUrl,
        filename,
        size: file.size,
        type: file.type
      }

    } catch (error: any) {
      console.error('❌ Avatar upload failed:', error.message)
      
      return {
        success: false,
        error: error.message || 'Upload failed',
        imageUrl: null
      }
    }
  }, {
    body: t.Object({
      file: t.File({
        type: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        maxSize: 5 * 1024 * 1024 // 5MB
      })
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.Optional(t.String()),
        error: t.Optional(t.String()),
        imageUrl: t.Union([t.String(), t.Null()]),
        filename: t.Optional(t.String()),
        size: t.Optional(t.Number()),
        type: t.Optional(t.String())
      })
    }
  })

  // Note: File serving is now handled by the static-files plugin at /uploads/*