export interface ProviderPolicyConfig {
  provider: string
  requestsEnabled: boolean
  requestsPerMinute: number
  requestsBurst: number
  tokensEnabled: boolean
  tokensPerMinute: number
  tokensBurst: number
  estimatedOutputTokens: number
  imageTokens: number
  concurrencyEnabled: boolean
  maxConcurrentRequests: number
  queueMaxSize: number
  queueMaxWaitMs: number
  auxiliary: 'queue' | 'reject'
  cooldownEnabled: boolean
  cooldownCodes: string[]
  cooldownStatuses: number[]
  initialDelayMs: number
  maxDelayMs: number
  maxProviderDelayMs: number
  jitterRatio: number
}

export const PRESET_CONFIGS: Record<string, { labelRu: string; labelEn: string; policy: ProviderPolicyConfig }> = {
  deepseekDefault: {
    labelRu: 'DeepSeek Official (рекомендуемый)',
    labelEn: 'DeepSeek Official (Recommended)',
    policy: {
      provider: 'deepseek-official',
      requestsEnabled: true,
      requestsPerMinute: 30,
      requestsBurst: 2,
      tokensEnabled: false,
      tokensPerMinute: 120000,
      tokensBurst: 40000,
      estimatedOutputTokens: 4096,
      imageTokens: 1024,
      concurrencyEnabled: true,
      maxConcurrentRequests: 2,
      queueMaxSize: 100,
      queueMaxWaitMs: 300000,
      auxiliary: 'reject',
      cooldownEnabled: true,
      cooldownCodes: ['RATE_LIMIT', 'SERVER'],
      cooldownStatuses: [429, 529],
      initialDelayMs: 500,
      maxDelayMs: 60000,
      maxProviderDelayMs: 3600000,
      jitterRatio: 0.1,
    },
  },
  deepseekR1Burst: {
    labelRu: 'DeepSeek R1 + сабагенты',
    labelEn: 'DeepSeek R1 + Subagents',
    policy: {
      provider: 'deepseek-official',
      requestsEnabled: true,
      requestsPerMinute: 20,
      requestsBurst: 3,
      tokensEnabled: true,
      tokensPerMinute: 100000,
      tokensBurst: 32000,
      estimatedOutputTokens: 8192,
      imageTokens: 1024,
      concurrencyEnabled: true,
      maxConcurrentRequests: 3,
      queueMaxSize: 64,
      queueMaxWaitMs: 180000,
      auxiliary: 'reject',
      cooldownEnabled: true,
      cooldownCodes: ['RATE_LIMIT', 'SERVER', 'TIMEOUT'],
      cooldownStatuses: [429, 529, 503],
      initialDelayMs: 1000,
      maxDelayMs: 60000,
      maxProviderDelayMs: 3600000,
      jitterRatio: 0.15,
    },
  },
  volcengineArk: {
    labelRu: 'Volcengine Ark (строгий RPM + TPM)',
    labelEn: 'Volcengine Ark (Strict RPM + TPM)',
    policy: {
      provider: 'volcengine-ark',
      requestsEnabled: true,
      requestsPerMinute: 60,
      requestsBurst: 4,
      tokensEnabled: true,
      tokensPerMinute: 200000,
      tokensBurst: 50000,
      estimatedOutputTokens: 4096,
      imageTokens: 1200,
      concurrencyEnabled: true,
      maxConcurrentRequests: 4,
      queueMaxSize: 120,
      queueMaxWaitMs: 120000,
      auxiliary: 'queue',
      cooldownEnabled: true,
      cooldownCodes: ['RATE_LIMIT', 'SERVER'],
      cooldownStatuses: [429, 529],
      initialDelayMs: 500,
      maxDelayMs: 30000,
      maxProviderDelayMs: 600000,
      jitterRatio: 0.1,
    },
  },
}

export function buildCordisPatchYaml(policy: ProviderPolicyConfig): string {
  const lines: string[] = [
    '- insert:',
    '    - id: llm-rate-limit',
    '      name: dsh-llm-rate-limit',
    '      config:',
    '        providers:',
    `          ${policy.provider || 'deepseek-official'}:`,
  ]
  if (policy.requestsEnabled) {
    lines.push(
      '            requests:',
      `              perMinute: ${policy.requestsPerMinute}`,
      `              burst: ${policy.requestsBurst}`,
    )
  }
  if (policy.tokensEnabled) {
    lines.push(
      '            tokens:',
      `              perMinute: ${policy.tokensPerMinute}`,
      `              burst: ${policy.tokensBurst}`,
      `              estimatedOutputTokens: ${policy.estimatedOutputTokens}`,
      `              imageTokens: ${policy.imageTokens}`,
    )
  }
  if (policy.concurrencyEnabled) {
    lines.push(`            maxConcurrentRequests: ${policy.maxConcurrentRequests}`)
  }
  lines.push(
    '            queue:',
    `              maxSize: ${policy.queueMaxSize}`,
    `              maxWaitMs: ${policy.queueMaxWaitMs}`,
    `              auxiliary: ${policy.auxiliary}`,
  )
  if (policy.cooldownEnabled) {
    lines.push(
      '            cooldown:',
      `              codes: [${policy.cooldownCodes.join(', ')}]`,
      `              statuses: [${policy.cooldownStatuses.join(', ')}]`,
      `              initialDelayMs: ${policy.initialDelayMs}`,
      `              maxDelayMs: ${policy.maxDelayMs}`,
      `              maxProviderDelayMs: ${policy.maxProviderDelayMs}`,
      `              jitterRatio: ${policy.jitterRatio}`,
    )
  }
  return lines.join('\n') + '\n'
}

export function validatePolicyConfig(policy: ProviderPolicyConfig): string[] {
  const errors: string[] = []
  if (!policy.provider.trim()) errors.push('Provider route name must be non-empty')
  if (!policy.requestsEnabled && !policy.tokensEnabled && !policy.concurrencyEnabled && !policy.cooldownEnabled) {
    errors.push('At least one limit (requests, tokens, maxConcurrentRequests, or cooldown) must be enabled')
  }
  if (policy.queueMaxSize < 1) errors.push('queue.maxSize must be >= 1')
  if (policy.queueMaxWaitMs < 1 || policy.queueMaxWaitMs > 2_147_483_647) {
    errors.push('queue.maxWaitMs must be between 1 and 2,147,483,647')
  }
  if (policy.cooldownEnabled) {
    if (policy.cooldownCodes.length === 0 && policy.cooldownStatuses.length === 0) {
      errors.push('cooldown must specify at least one failure code or HTTP status')
    }
    if (policy.maxDelayMs < policy.initialDelayMs) {
      errors.push('cooldown.maxDelayMs cannot be less than initialDelayMs')
    }
    if (policy.maxProviderDelayMs < policy.maxDelayMs) {
      errors.push('cooldown.maxProviderDelayMs cannot be less than maxDelayMs')
    }
    if (policy.jitterRatio < 0 || policy.jitterRatio > 1) {
      errors.push('cooldown.jitterRatio must be between 0 and 1')
    }
  }
  return errors
}

// --- Live Rate-Limiter Engine (1:1 faithful port of plugin/src/index.ts state machine) ---

export type WaitReason = 'cooldown' | 'concurrency' | 'queue' | 'requests' | 'tokens'

export interface SimRequestItem {
  id: string
  waitId?: string
  label: string
  purpose?: string
  estimatedTokens: number
  actualTokens: number
  durationMs: number
  status: 'active' | 'queued' | 'completed' | 'shed' | 'error-429' | 'error-529' | 'aborted' | 'timed-out'
  waitReason?: WaitReason
  enqueuedAt: number
  startedAt?: number
  finishedAt?: number
  endsAt?: number
}

export interface SimPluginRecord {
  seq: number
  time: number
  type: 'plugin:dsh-llm-rate-limit/admission-wait' | 'plugin:dsh-llm-rate-limit/admission-started' | 'local-shed' | 'cooldown-triggered'
  ignorable: boolean
  detail: string
}

export interface SimSnapshot {
  now: number
  activeCount: number
  queueLength: number
  reqTokens: number
  reqBurst: number
  tokTokens: number
  tokBurst: number
  cooldownRemainingMs: number
  failureStreak: number
  totals: {
    admitted: number
    queued: number
    shed: number
    cooldowns: number
    aborted: number
  }
  requests: SimRequestItem[]
  records: SimPluginRecord[]
}

export class RateLimitEngine {
  private policy: ProviderPolicyConfig
  private reqTokens = 0
  private tokTokens = 0
  private lastRefillAt = 0
  private activeCount = 0
  private failureEpoch = 0
  private failureStreak = 0
  private cooldownUntil = 0
  private seq = 0
  private nextId = 1
  private queue: SimRequestItem[] = []
  private active: SimRequestItem[] = []
  private history: SimRequestItem[] = []
  private records: SimPluginRecord[] = []
  private totals = { admitted: 0, queued: 0, shed: 0, cooldowns: 0, aborted: 0 }

  constructor(policy: ProviderPolicyConfig, startAt = 0) {
    this.policy = policy
    this.reset(policy, startAt)
  }

  reset(policy: ProviderPolicyConfig, startAt = 0): void {
    this.policy = policy
    this.reqTokens = policy.requestsBurst
    this.tokTokens = policy.tokensBurst
    this.lastRefillAt = startAt
    this.activeCount = 0
    this.failureEpoch = 0
    this.failureStreak = 0
    this.cooldownUntil = 0
    this.seq = 0
    this.nextId = 1
    this.queue = []
    this.active = []
    this.history = []
    this.records = []
    this.totals = { admitted: 0, queued: 0, shed: 0, cooldowns: 0, aborted: 0 }
  }

  updatePolicy(policy: ProviderPolicyConfig, at: number): void {
    this.refill(at)
    this.policy = policy
    this.reqTokens = Math.min(this.reqTokens, policy.requestsBurst)
    this.tokTokens = Math.min(this.tokTokens, policy.tokensBurst)
    this.tick(at)
  }

  private refill(at: number): void {
    const elapsed = Math.max(0, at - this.lastRefillAt)
    if (this.policy.requestsEnabled) {
      this.reqTokens = Math.min(
        this.policy.requestsBurst,
        this.reqTokens + elapsed * (this.policy.requestsPerMinute / 60_000),
      )
    }
    if (this.policy.tokensEnabled) {
      this.tokTokens = Math.min(
        this.policy.tokensBurst,
        this.tokTokens + elapsed * (this.policy.tokensPerMinute / 60_000),
      )
    }
    this.lastRefillAt = Math.max(this.lastRefillAt, at)
  }

  private capacityWait(tokenCost: number, at: number): WaitReason | undefined {
    this.refill(at)
    if (this.cooldownUntil > at) return 'cooldown'
    if (this.policy.concurrencyEnabled && this.activeCount >= this.policy.maxConcurrentRequests) return 'concurrency'
    if (this.policy.requestsEnabled && this.reqTokens < 1) return 'requests'
    if (this.policy.tokensEnabled && this.tokTokens < tokenCost) return 'tokens'
    return undefined
  }

  private reserve(item: SimRequestItem, at: number): void {
    this.refill(at)
    if (this.policy.requestsEnabled) this.reqTokens -= 1
    if (this.policy.tokensEnabled) this.tokTokens -= item.estimatedTokens
    this.activeCount += 1
    this.totals.admitted += 1
    item.status = 'active'
    item.startedAt = at
    item.endsAt = at + item.durationMs
    this.active.push(item)
  }

  private appendRecord(type: SimPluginRecord['type'], at: number, detail: string): void {
    this.seq += 1
    this.records.unshift({
      seq: this.seq,
      time: at,
      type,
      ignorable: type.startsWith('plugin:'),
      detail,
    })
    if (this.records.length > 40) this.records.pop()
  }

  submit(
    at: number,
    opts: {
      label: string
      purpose?: string
      estimatedTokens?: number
      actualTokens?: number
      durationMs?: number
      injectError?: 429 | 529
      retryAfterMs?: number
    },
  ): void {
    this.tick(at)
    const id = `req-${String(this.nextId++).padStart(3, '0')}`
    const est = opts.estimatedTokens ?? 2800
    const actual = opts.actualTokens ?? Math.round(est * 0.72)
    const durationMs = opts.durationMs ?? 1400

    if (this.policy.tokensEnabled && est > this.policy.tokensBurst) {
      const shedItem: SimRequestItem = {
        id,
        label: opts.label,
        purpose: opts.purpose,
        estimatedTokens: est,
        actualTokens: 0,
        durationMs,
        status: 'shed',
        enqueuedAt: at,
        finishedAt: at,
      }
      this.totals.shed += 1
      this.history.unshift(shedItem)
      this.appendRecord('local-shed', at, `${id} exceeded tokens.burst (${est} > ${this.policy.tokensBurst})`)
      return
    }

    const waitReason = this.queue.length === 0 ? this.capacityWait(est, at) : 'queue'
    if (waitReason === undefined) {
      const item: SimRequestItem = {
        id,
        label: opts.label,
        purpose: opts.purpose,
        estimatedTokens: est,
        actualTokens: actual,
        durationMs,
        status: 'active',
        enqueuedAt: at,
      }
      this.reserve(item, at)
      if (opts.injectError !== undefined) {
        this.triggerUpstreamError(item, opts.injectError, opts.retryAfterMs, at)
      }
      return
    }

    if (opts.purpose !== undefined && this.policy.auxiliary === 'reject') {
      const shedItem: SimRequestItem = {
        id,
        label: opts.label,
        purpose: opts.purpose,
        estimatedTokens: est,
        actualTokens: 0,
        durationMs,
        status: 'shed',
        waitReason,
        enqueuedAt: at,
        finishedAt: at,
      }
      this.totals.shed += 1
      this.history.unshift(shedItem)
      this.appendRecord(
        'local-shed',
        at,
        `${id} (${opts.purpose}) shed immediately — auxiliary=reject while blocked on ${waitReason}`,
      )
      return
    }

    if (this.queue.length >= this.policy.queueMaxSize) {
      const shedItem: SimRequestItem = {
        id,
        label: opts.label,
        purpose: opts.purpose,
        estimatedTokens: est,
        actualTokens: 0,
        durationMs,
        status: 'shed',
        waitReason,
        enqueuedAt: at,
        finishedAt: at,
      }
      this.totals.shed += 1
      this.history.unshift(shedItem)
      this.appendRecord('local-shed', at, `${id} rejected — queue full (${this.policy.queueMaxSize})`)
      return
    }

    const waitId = `wait-${id}`
    const item: SimRequestItem = {
      id,
      waitId,
      label: opts.label,
      purpose: opts.purpose,
      estimatedTokens: est,
      actualTokens: actual,
      durationMs,
      status: 'queued',
      waitReason,
      enqueuedAt: at,
    }
    this.totals.queued += 1
    this.queue.push(item)
    this.appendRecord(
      'plugin:dsh-llm-rate-limit/admission-wait',
      at,
      `waitId=${waitId} reason=${waitReason} maxWaitMs=${this.policy.queueMaxWaitMs}${opts.purpose ? ` purpose=${opts.purpose}` : ''}`,
    )
  }

  injectCooldown(status: 429 | 529, retryAfterMs: number | undefined, at: number): void {
    this.tick(at)
    const id = `req-${String(this.nextId++).padStart(3, '0')}`
    const item: SimRequestItem = {
      id,
      label: `Simulated HTTP ${status}`,
      estimatedTokens: 2400,
      actualTokens: 0,
      durationMs: 250,
      status: 'active',
      enqueuedAt: at,
      startedAt: at,
      endsAt: at + 250,
    }
    this.activeCount += 1
    this.active.push(item)
    this.triggerUpstreamError(item, status, retryAfterMs, at)
  }

  private triggerUpstreamError(
    item: SimRequestItem,
    status: 429 | 529,
    retryAfterMs: number | undefined,
    at: number,
  ): void {
    item.status = status === 429 ? 'error-429' : 'error-529'
    item.finishedAt = at
    this.active = this.active.filter(x => x.id !== item.id)
    this.activeCount = Math.max(0, this.activeCount - 1)
    this.history.unshift(item)

    if (this.policy.cooldownEnabled && this.policy.cooldownStatuses.includes(status)) {
      this.failureEpoch += 1
      this.failureStreak += 1
      const exp = Math.min(this.failureStreak - 1, 10)
      const localTarget = Math.min(this.policy.initialDelayMs * 2 ** exp, this.policy.maxDelayMs)
      const delay =
        retryAfterMs !== undefined && retryAfterMs > 0 && retryAfterMs <= this.policy.maxProviderDelayMs
          ? retryAfterMs
          : Math.round(localTarget)
      this.cooldownUntil = Math.max(this.cooldownUntil, at + delay)
      this.totals.cooldowns += 1
      this.appendRecord(
        'cooldown-triggered',
        at,
        `HTTP ${status} streak=${this.failureStreak} cooldown=${delay}ms${retryAfterMs ? ` (Retry-After ${retryAfterMs}ms)` : ''}`,
      )
    }
    this.pump(at)
  }

  abortNextQueued(at: number): boolean {
    const entry = this.queue.shift()
    if (!entry) return false
    entry.status = 'aborted'
    entry.finishedAt = at
    this.totals.aborted += 1
    this.history.unshift(entry)
    this.pump(at)
    return true
  }

  tick(at: number): void {
    this.refill(at)
    const finished = this.active.filter(item => item.endsAt !== undefined && at >= item.endsAt)
    for (const item of finished) {
      item.status = 'completed'
      item.finishedAt = item.endsAt
      this.active = this.active.filter(x => x.id !== item.id)
      this.activeCount = Math.max(0, this.activeCount - 1)
      if (this.policy.tokensEnabled) {
        this.tokTokens = Math.min(
          this.policy.tokensBurst,
          this.tokTokens + item.estimatedTokens - item.actualTokens,
        )
      }
      this.failureStreak = 0
      this.history.unshift(item)
    }
    this.pump(at)
    if (this.history.length > 30) this.history.length = 30
  }

  private pump(at: number): void {
    while (this.queue.length > 0) {
      const next = this.queue[0]!
      if (at - next.enqueuedAt > this.policy.queueMaxWaitMs) {
        this.queue.shift()
        next.status = 'timed-out'
        next.finishedAt = at
        this.totals.shed += 1
        this.history.unshift(next)
        continue
      }
      const wait = this.capacityWait(next.estimatedTokens, at)
      if (wait !== undefined) return
      this.queue.shift()
      this.reserve(next, at)
      if (next.waitId) {
        this.appendRecord(
          'plugin:dsh-llm-rate-limit/admission-started',
          at,
          `waitId=${next.waitId} waited=${at - next.enqueuedAt}ms`,
        )
      }
    }
  }

  snapshot(at: number): SimSnapshot {
    this.tick(at)
    return {
      now: at,
      activeCount: this.activeCount,
      queueLength: this.queue.length,
      reqTokens: this.reqTokens,
      reqBurst: this.policy.requestsBurst,
      tokTokens: this.tokTokens,
      tokBurst: this.policy.tokensBurst,
      cooldownRemainingMs: Math.max(0, this.cooldownUntil - at),
      failureStreak: this.failureStreak,
      totals: { ...this.totals },
      requests: [...this.active, ...this.queue, ...this.history].slice(0, 18),
      records: [...this.records],
    }
  }
}
