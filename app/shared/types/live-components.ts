// 🔥 Live Components Type Exports
// This file defines component types for frontend type inference
// These types mirror the backend component structure for full autocomplete

import { LiveComponent } from '@/core/types/types'

// =============================================================================
// State Types
// =============================================================================

export interface LiveClockState {
  currentTime: string
  timeZone: string
  format: '12h' | '24h'
  showSeconds: boolean
  showDate: boolean
  lastSync: Date
  serverUptime: number
}

export interface LiveFileUploadState {
  files: UploadedFile[]
  totalSize: number
  totalFiles: number
  lastUpload: Date | null
}

export interface UploadedFile {
  id: string
  filename: string
  fileType: string
  fileSize: number
  uploadedAt: Date
  url?: string
}

// =============================================================================
// Component Type Definitions (mirror backend for type inference)
// =============================================================================

/**
 * LiveClockComponent type definition for frontend type inference
 * Mirrors the backend component structure
 */
export interface LiveClockComponent extends LiveComponent<LiveClockState> {
  setTimeFormat(payload: { format: '12h' | '24h' }): Promise<{
    success: boolean
    format: '12h' | '24h'
  }>

  toggleSeconds(payload?: { showSeconds?: boolean }): Promise<{
    success: boolean
    showSeconds: boolean
  }>

  toggleDate(payload?: { showDate?: boolean }): Promise<{
    success: boolean
    showDate: boolean
  }>

  setTimeZone(payload: { timeZone: string }): Promise<{
    success: boolean
    timeZone: string
  }>

  getServerInfo(): Promise<{
    success: boolean
    info: {
      serverTime: string
      localTime: string
      uptime: number
      uptimeFormatted: string
      timezone: string
      componentId: string
      startTime: string
    }
  }>

  syncTime(): Promise<{
    success: boolean
    syncTime: string
    currentTime: string
  }>
}

/**
 * LiveFileUploadComponent type definition for frontend type inference
 */
export interface LiveFileUploadComponent extends LiveComponent<LiveFileUploadState> {
  onFileUploaded(payload: {
    filename: string
    fileType: string
    fileSize: number
    url?: string
  }): Promise<{
    success: boolean
    file: UploadedFile
  }>

  removeFile(payload: { fileId: string }): Promise<{
    success: boolean
    removed: boolean
  }>

  clearAll(): Promise<{
    success: boolean
    cleared: number
  }>

  getStats(): Promise<{
    success: boolean
    stats: {
      totalFiles: number
      totalSize: number
      lastUpload: Date | null
    }
  }>
}
