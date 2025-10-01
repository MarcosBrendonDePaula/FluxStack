/**
 * Global instances for convenience
 */

import { getSessionManager, getRequestSigner } from './sessionInit'

/**
 * Global session manager instance
 */
export const sessionManager = getSessionManager()

/**
 * Global request signer instance
 */
export const requestSigner = getRequestSigner()