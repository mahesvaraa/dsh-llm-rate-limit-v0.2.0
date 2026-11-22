import type { AdmissionWaitId } from './brand.ts'

export type { AdmissionWaitId }

/**
 * DSH v0.2.2+ session persistence requires out-of-repo diagnostic records to
 * live under `PluginRecordMap` (`plugin:<pkg>/<event>`) written via
 * `appendPluginRecord()`, which stamps `ignorable: true` automatically so
 * SQLite and JSONL v4 restore/fork never fail with SessionFormatUnsupportedError.
 */
declare module '@deepseek-ai/dsh-session/types' {
  interface PluginRecordMap {
    /** Ignorable record written before one model call waits for local provider admission. */
    'plugin:dsh-llm-rate-limit/admission-wait': LlmAdmissionWaitEventData
    /** Ignorable transition written after local admission succeeds and immediately before dispatch. */
    'plugin:dsh-llm-rate-limit/admission-started': LlmAdmissionStartedEventData
  }
}

/** Capacity that prevented a model call from entering its provider immediately. */
export type AdmissionWaitReason = 'cooldown' | 'concurrency' | 'queue' | 'requests' | 'tokens'

/** Durable payload recorded before one model call enters the local admission queue. */
export interface LlmAdmissionWaitEventData {
  waitId: AdmissionWaitId
  provider: string
  reason: AdmissionWaitReason
  maxWaitMs: number
  purpose?: string
}

/** Durable transition recorded after admission succeeds. */
export interface LlmAdmissionStartedEventData {
  waitId: AdmissionWaitId
  provider: string
}
