/**
 * FluxStack Electron Preload Script
 * This script runs in the renderer process with limited Node.js access
 * It exposes a safe API to the renderer process via contextBridge
 */

import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronPreloadAPI } from '../types'

// Allowed IPC channels
const ALLOWED_CHANNELS = {
  // App info
  invoke: ['app:version', 'app:platform', 'window:state'],
  // Window controls
  send: ['window:minimize', 'window:maximize', 'window:close'],
  // Custom channels (add your own here)
  on: ['app:update', 'app:notification'],
}

/**
 * Validate if a channel is allowed
 */
function isChannelAllowed(type: 'invoke' | 'send' | 'on', channel: string): boolean {
  return ALLOWED_CHANNELS[type].includes(channel)
}

/**
 * Electron API exposed to the renderer process
 */
const electronAPI: ElectronPreloadAPI = {
  // Process versions
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },

  // Platform info
  platform: process.platform,

  /**
   * Invoke an IPC handler (request-response pattern)
   * @param channel - The IPC channel to invoke
   * @param args - Arguments to pass to the handler
   * @returns Promise with the handler response
   */
  invoke: async (channel: string, ...args: any[]): Promise<any> => {
    if (!isChannelAllowed('invoke', channel)) {
      throw new Error(`IPC channel "${channel}" is not allowed for invoke`)
    }
    return ipcRenderer.invoke(channel, ...args)
  },

  /**
   * Send a message to the main process (fire-and-forget)
   * @param channel - The IPC channel to send to
   * @param args - Arguments to pass with the message
   */
  send: (channel: string, ...args: any[]): void => {
    if (!isChannelAllowed('send', channel)) {
      throw new Error(`IPC channel "${channel}" is not allowed for send`)
    }
    ipcRenderer.send(channel, ...args)
  },

  /**
   * Listen for messages from the main process
   * @param channel - The IPC channel to listen to
   * @param listener - The callback function
   */
  on: (channel: string, listener: (...args: any[]) => void): void => {
    if (!isChannelAllowed('on', channel)) {
      throw new Error(`IPC channel "${channel}" is not allowed for on`)
    }
    ipcRenderer.on(channel, (_, ...args) => listener(...args))
  },

  /**
   * Listen for a single message from the main process
   * @param channel - The IPC channel to listen to
   * @param listener - The callback function (will be called once)
   */
  once: (channel: string, listener: (...args: any[]) => void): void => {
    if (!isChannelAllowed('on', channel)) {
      throw new Error(`IPC channel "${channel}" is not allowed for once`)
    }
    ipcRenderer.once(channel, (_, ...args) => listener(...args))
  },

  /**
   * Remove a message listener
   * @param channel - The IPC channel
   * @param listener - The listener to remove
   */
  removeListener: (channel: string, listener: (...args: any[]) => void): void => {
    if (!isChannelAllowed('on', channel)) {
      throw new Error(`IPC channel "${channel}" is not allowed for removeListener`)
    }
    ipcRenderer.removeListener(channel, listener)
  },
}

/**
 * Expose the Electron API to the renderer process
 * This is the ONLY way the renderer should communicate with the main process
 */
contextBridge.exposeInMainWorld('electron', electronAPI)

/**
 * Optional: Log when preload script is loaded (useful for debugging)
 */
if (process.env.NODE_ENV === 'development') {
  console.log('[Preload] Electron API exposed to renderer process')
  console.log('[Preload] Versions:', electronAPI.versions)
  console.log('[Preload] Platform:', electronAPI.platform)
}
