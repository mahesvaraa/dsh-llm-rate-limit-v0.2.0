import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

export type {
  AdmissionWaitReason,
  LlmAdmissionStartedEventData,
  LlmAdmissionWaitEventData,
} from './types.d.ts'
export { AdmissionWaitId } from './brand.d.ts'
export { estimateRequestTokens } from './estimate.d.ts'

export declare const name = 'llm-rate-limit'
export declare const inject: string[]

export interface RequestLimitConfig {
  perMinute: number
  burst: number
}

export interface TokenLimitConfig {
  perMinute: number
  burst: number
  estimatedOutputTokens: number
  imageTokens: number
}

export interface QueueConfig {
  maxSize: number
  maxWaitMs: number
  auxiliary: 'queue' | 'reject'
}

export interface CooldownConfig {
  codes?: string[]
  statuses?: number[]
  initialDelayMs: number
  maxDelayMs: number
  maxProviderDelayMs: number
  jitterRatio: number
}

export interface ProviderLimitConfig {
  requests?: RequestLimitConfig
  tokens?: TokenLimitConfig
  maxConcurrentRequests?: number
  queue: QueueConfig
  cooldown?: CooldownConfig
}

export interface Config {
  providers: Record<string, ProviderLimitConfig>
}

export declare const Config: z<Config>

export interface RateLimitInternals {
  now?: () => number
  random?: () => number
}

export declare function validateConfig(config: Config): void
export declare function apply(ctx: Context, config: Config, internals?: RateLimitInternals): void
