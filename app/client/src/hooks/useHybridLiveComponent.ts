// 🔥 Hybrid Live Component Hook (Deprecated - Use core directly)

import { 
  useHybridLiveComponent as coreUseHybridLiveComponent,
  type UseHybridLiveComponentReturn
} from '../../../../core/client/hooks/useHybridLiveComponent'
import type { HybridComponentOptions } from '../../../../core/types/types'

// Re-export from core for backward compatibility
export { coreUseHybridLiveComponent as useHybridLiveComponent }
export type { UseHybridLiveComponentReturn, HybridComponentOptions }
