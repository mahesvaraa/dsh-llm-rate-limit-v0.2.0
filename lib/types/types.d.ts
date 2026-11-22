import type { AdmissionWaitId } from './brand.d.ts'

export type { AdmissionWaitId }

declare module '@deepseek-ai/dsh-session/types' {
  interface PluginRecordMap {
    'plugin:dsh-llm-rate-limit/admission-wait': LlmAdmissionWaitEventData
    'plugin:dsh-llm-rate-limit/admission-started': LlmAdmissionStartedEventData
  }
}

export type AdmissionWaitReason = 'cooldown' | 'concurrency' | 'queue' | 'requests' | 'tokens'

export interface LlmAdmissionWaitEventData {
  waitId: AdmissionWaitId
  provider: string
  reason: AdmissionWaitReason
  maxWaitMs: number
  purpose?: string
}

export interface LlmAdmissionStartedEventData {
  waitId: AdmissionWaitId
  provider: string
}
