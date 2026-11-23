// plugin/src/index.ts
import { randomUUID } from "node:crypto";
import z from "@deepseek-ai/schemastery";

// plugin/src/brand.ts
function AdmissionWaitId(id) {
  return id;
}

// plugin/src/estimate.ts
var CHARS_PER_TOKEN = 4;
var BLOCK_OVERHEAD = 4;
var MESSAGE_OVERHEAD = 4;
var OFFLOADED_IMAGE_PLACEHOLDER_TOKENS = 32;
function textTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
function contentTokens(blocks, imageTokens) {
  let total = 0;
  for (const block of blocks) {
    switch (block.type) {
      case "text":
      case "reasoning":
        total += textTokens(block.text) + BLOCK_OVERHEAD;
        break;
      case "image":
        total += (block.offloaded ? Math.min(imageTokens, OFFLOADED_IMAGE_PLACEHOLDER_TOKENS) : imageTokens) + BLOCK_OVERHEAD;
        break;
      case "file":
        total += textTokens(JSON.stringify(block.attachment)) + BLOCK_OVERHEAD;
        break;
      case "tool-call":
        total += textTokens(block.name) + textTokens(block.arguments) + BLOCK_OVERHEAD;
        break;
      case "tool-addition":
      case "tool-removal":
        total += textTokens(block.toolName) + BLOCK_OVERHEAD;
        break;
      case "tool-result":
        total += contentTokens(block.content, imageTokens) + BLOCK_OVERHEAD;
        break;
      default:
        total += textTokens(JSON.stringify(block)) + BLOCK_OVERHEAD;
    }
  }
  return total;
}
function estimateRequestTokens(options, configuredOutputTokens, imageTokens) {
  let total = options.system === void 0 ? 0 : textTokens(options.system) + MESSAGE_OVERHEAD;
  for (const message of options.messages) {
    total += contentTokens(message.content, imageTokens) + MESSAGE_OVERHEAD;
  }
  if (options.tools !== void 0 && options.tools.length > 0) {
    total += textTokens(JSON.stringify(options.tools)) + BLOCK_OVERHEAD;
  } else if (options.toolHistory !== void 0) {
    if (options.toolHistory.tools.length > 0) {
      total += textTokens(JSON.stringify(options.toolHistory.tools)) + BLOCK_OVERHEAD;
    }
    if (options.toolHistory.updates.length > 0) {
      total += textTokens(JSON.stringify(options.toolHistory.updates)) + BLOCK_OVERHEAD;
    }
  }
  if (options.stop !== void 0 && options.stop.length > 0) {
    total += textTokens(JSON.stringify(options.stop)) + BLOCK_OVERHEAD;
  }
  total += options.maxTokens ?? configuredOutputTokens;
  return Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, total));
}

// plugin/src/index.ts
var MAX_TIMER_DELAY_MS = 2147483647;
var name = "llm-rate-limit";
var inject = ["llm"];
var vol = (schema) => (typeof schema?.volatile === "function" ? schema.volatile() : schema);
var positiveInteger = () => z.number().step(1).min(1).max(Number.MAX_SAFE_INTEGER);
var timerDelay = () => z.number().min(1).max(MAX_TIMER_DELAY_MS);
var Config = vol(z.object({
  providers: vol(z.dict(z.object({
    requests: z.union([z.const(void 0), z.object({
      perMinute: positiveInteger().required(),
      burst: positiveInteger().required()
    })]),
    tokens: z.union([z.const(void 0), z.object({
      perMinute: positiveInteger().required(),
      burst: positiveInteger().required(),
      estimatedOutputTokens: positiveInteger().required(),
      imageTokens: positiveInteger().required()
    })]),
    maxConcurrentRequests: positiveInteger(),
    queue: z.object({
      maxSize: positiveInteger().required(),
      maxWaitMs: timerDelay().required(),
      auxiliary: z.union(["queue", "reject"]).required()
    }).required(),
    cooldown: z.union([z.const(void 0), z.object({
      codes: z.array(z.string()),
      statuses: z.array(z.number().step(1).min(100).max(599)),
      initialDelayMs: timerDelay().required(),
      maxDelayMs: timerDelay().required(),
      maxProviderDelayMs: timerDelay().required(),
      jitterRatio: z.number().min(0).max(1).required()
    })])
  })).required()
}));
var KNOWN_PROVIDER_KEYS = /* @__PURE__ */ new Set(["requests", "tokens", "maxConcurrentRequests", "queue", "cooldown"]);
var KNOWN_REQUEST_KEYS = /* @__PURE__ */ new Set(["perMinute", "burst"]);
var KNOWN_TOKEN_KEYS = /* @__PURE__ */ new Set(["perMinute", "burst", "estimatedOutputTokens", "imageTokens"]);
var KNOWN_QUEUE_KEYS = /* @__PURE__ */ new Set(["maxSize", "maxWaitMs", "auxiliary"]);
var KNOWN_COOLDOWN_KEYS = /* @__PURE__ */ new Set([
  "codes",
  "statuses",
  "initialDelayMs",
  "maxDelayMs",
  "maxProviderDelayMs",
  "jitterRatio"
]);
var WAIT_RECORD_TYPE = "plugin:dsh-llm-rate-limit/admission-wait";
var STARTED_RECORD_TYPE = "plugin:dsh-llm-rate-limit/admission-started";
function rejectUnknownKeys(subject, value, known) {
  const unknown = Object.keys(value).find((key) => !known.has(key));
  if (unknown !== void 0) throw new Error(`llm-rate-limit: ${subject} has unknown key "${unknown}"`);
}
function positiveSafeInteger(subject, value) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`llm-rate-limit: ${subject} must be a positive safe integer`);
  }
}
function validateConfig(config) {
  rejectUnknownKeys("config", config, /* @__PURE__ */ new Set(["providers"]));
  for (const [provider, policy] of Object.entries(config.providers)) {
    if (provider.length === 0) throw new Error("llm-rate-limit: provider keys must be non-empty");
    rejectUnknownKeys(`provider "${provider}"`, policy, KNOWN_PROVIDER_KEYS);
    if (policy.requests === void 0 && policy.tokens === void 0 && policy.maxConcurrentRequests === void 0 && policy.cooldown === void 0) {
      throw new Error(`llm-rate-limit: provider "${provider}" must configure requests, tokens, maxConcurrentRequests, or cooldown`);
    }
    rejectUnknownKeys(`provider "${provider}" queue`, policy.queue, KNOWN_QUEUE_KEYS);
    positiveSafeInteger(`provider "${provider}" queue.maxSize`, policy.queue.maxSize);
    positiveSafeInteger(`provider "${provider}" queue.maxWaitMs`, policy.queue.maxWaitMs);
    if (policy.queue.maxWaitMs > MAX_TIMER_DELAY_MS) {
      throw new Error(`llm-rate-limit: provider "${provider}" queue.maxWaitMs exceeds the timer limit`);
    }
    if (policy.queue.auxiliary !== "queue" && policy.queue.auxiliary !== "reject") {
      throw new Error(`llm-rate-limit: provider "${provider}" queue.auxiliary must be "queue" or "reject"`);
    }
    if (policy.requests !== void 0) {
      rejectUnknownKeys(`provider "${provider}" requests`, policy.requests, KNOWN_REQUEST_KEYS);
      positiveSafeInteger(`provider "${provider}" requests.perMinute`, policy.requests.perMinute);
      positiveSafeInteger(`provider "${provider}" requests.burst`, policy.requests.burst);
    }
    if (policy.tokens !== void 0) {
      rejectUnknownKeys(`provider "${provider}" tokens`, policy.tokens, KNOWN_TOKEN_KEYS);
      positiveSafeInteger(`provider "${provider}" tokens.perMinute`, policy.tokens.perMinute);
      positiveSafeInteger(`provider "${provider}" tokens.burst`, policy.tokens.burst);
      positiveSafeInteger(`provider "${provider}" tokens.estimatedOutputTokens`, policy.tokens.estimatedOutputTokens);
      positiveSafeInteger(`provider "${provider}" tokens.imageTokens`, policy.tokens.imageTokens);
    }
    if (policy.maxConcurrentRequests !== void 0) {
      positiveSafeInteger(`provider "${provider}" maxConcurrentRequests`, policy.maxConcurrentRequests);
    }
    if (policy.cooldown !== void 0) {
      rejectUnknownKeys(`provider "${provider}" cooldown`, policy.cooldown, KNOWN_COOLDOWN_KEYS);
      const { codes, statuses } = policy.cooldown;
      if ((codes?.length ?? 0) === 0 && (statuses?.length ?? 0) === 0) {
        throw new Error(`llm-rate-limit: provider "${provider}" cooldown must configure codes or statuses`);
      }
      if (codes?.some((code) => typeof code !== "string" || code.length === 0)) {
        throw new Error(`llm-rate-limit: provider "${provider}" cooldown.codes must contain non-empty strings`);
      }
      if (codes !== void 0 && new Set(codes).size !== codes.length) {
        throw new Error(`llm-rate-limit: provider "${provider}" cooldown.codes must not contain duplicates`);
      }
      if (statuses?.some((status) => !Number.isInteger(status) || status < 100 || status > 599)) {
        throw new Error(`llm-rate-limit: provider "${provider}" cooldown.statuses must contain HTTP statuses`);
      }
      if (statuses !== void 0 && new Set(statuses).size !== statuses.length) {
        throw new Error(`llm-rate-limit: provider "${provider}" cooldown.statuses must not contain duplicates`);
      }
      positiveSafeInteger(`provider "${provider}" cooldown.initialDelayMs`, policy.cooldown.initialDelayMs);
      positiveSafeInteger(`provider "${provider}" cooldown.maxDelayMs`, policy.cooldown.maxDelayMs);
      positiveSafeInteger(`provider "${provider}" cooldown.maxProviderDelayMs`, policy.cooldown.maxProviderDelayMs);
      if (policy.cooldown.maxDelayMs < policy.cooldown.initialDelayMs) {
        throw new Error(`llm-rate-limit: provider "${provider}" cooldown.maxDelayMs must not be below initialDelayMs`);
      }
      if (policy.cooldown.maxProviderDelayMs < policy.cooldown.maxDelayMs) {
        throw new Error(`llm-rate-limit: provider "${provider}" cooldown.maxProviderDelayMs must not be below maxDelayMs`);
      }
      if (!Number.isFinite(policy.cooldown.jitterRatio) || policy.cooldown.jitterRatio < 0 || policy.cooldown.jitterRatio > 1) {
        throw new Error(`llm-rate-limit: provider "${provider}" cooldown.jitterRatio must be within 0..1`);
      }
    }
  }
}
function bucket(config, now) {
  return {
    tokens: config.burst,
    lastRefillAt: now,
    perMillisecond: config.perMinute / 6e4,
    burst: config.burst
  };
}
function refill(target, now) {
  const elapsed = Math.max(0, now - target.lastRefillAt);
  target.tokens = Math.min(target.burst, target.tokens + elapsed * target.perMillisecond);
  target.lastRefillAt = Math.max(target.lastRefillAt, now);
}
function bucketDelay(target, cost) {
  if (target.tokens >= cost) return 0;
  return (cost - target.tokens) / target.perMillisecond;
}
function usageTokens(usage) {
  return usage.inputTokens + (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0) + usage.outputTokens;
}
function localFailure(message) {
  return { ok: false, aborted: false, failure: { message, code: "LOCAL_RATE_LIMIT" } };
}
function abortedFailure(message) {
  return { ok: false, aborted: true, failure: { message, code: "ABORTED" } };
}
const SETTINGS_ENTRY_ID = "llm-rate-limit";
function isLoopback(addr) {
  if (!addr) return true;
  return addr === "127.0.0.1" || addr === "::1" || addr === "::ffff:127.0.0.1" || addr === "localhost";
}
function sendJson(res, status, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": data.length
  });
  res.end(data);
}
async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const str = Buffer.concat(chunks).toString("utf8");
        resolve(str ? JSON.parse(str) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}
function findOwnDescriptor(service) {
  try {
    const rows = service.describe();
    return rows.find((row) => row && row.ns === SETTINGS_ENTRY_ID)
      ?? rows.find((row) => row && row.value && typeof row.value === "object" && "providers" in row.value)
      ?? null;
  } catch {
    return null;
  }
}
function apply(ctx, config, internals = {}) {
  validateConfig(config);
  const now = internals.now ?? Date.now;
  const random = internals.random ?? Math.random;
  const lifetime = new AbortController();
  const active = /* @__PURE__ */ new Set();
  const states = /* @__PURE__ */ new Map();
  let currentConfig = { providers: { ...(config.providers ?? {}) } };

  function createProviderState(policy) {
    const createdAt = now();
    return {
      config: policy,
      ...policy.requests === void 0 ? {} : { requests: bucket(policy.requests, createdAt) },
      ...policy.tokens === void 0 ? {} : { tokens: bucket(policy.tokens, createdAt) },
      active: 0,
      failureEpoch: 0,
      failureStreak: 0,
      cooldownUntil: 0,
      queue: [],
      timer: void 0,
      pumping: false
    };
  }

  for (const [provider, policy] of Object.entries(currentConfig.providers)) {
    states.set(provider, createProviderState(policy));
  }

  function applyConfigUpdate(nextConfig) {
    validateConfig(nextConfig);
    currentConfig = { providers: { ...nextConfig.providers } };
    for (const [provider, state] of states.entries()) {
      if (!Object.hasOwn(nextConfig.providers, provider)) {
        if (state.timer !== void 0) clearTimeout(state.timer);
        state.timer = void 0;
        for (const entry of state.queue.splice(0)) {
          settleEntry(entry, abortedFailure(`llm-rate-limit: provider "${provider}" removed`));
        }
        states.delete(provider);
      }
    }
    for (const [provider, policy] of Object.entries(nextConfig.providers)) {
      const existing = states.get(provider);
      if (existing === void 0) {
        states.set(provider, createProviderState(policy));
      } else {
        existing.config = policy;
        if (policy.requests !== void 0) {
          if (existing.requests === void 0) {
            existing.requests = bucket(policy.requests, now());
          } else {
            existing.requests.burst = policy.requests.burst;
            existing.requests.perMillisecond = policy.requests.perMinute / 6e4;
            existing.requests.tokens = Math.min(existing.requests.tokens, existing.requests.burst);
          }
        } else {
          existing.requests = void 0;
        }
        if (policy.tokens !== void 0) {
          if (existing.tokens === void 0) {
            existing.tokens = bucket(policy.tokens, now());
          } else {
            existing.tokens.burst = policy.tokens.burst;
            existing.tokens.perMillisecond = policy.tokens.perMinute / 6e4;
            existing.tokens.tokens = Math.min(existing.tokens.tokens, existing.tokens.burst);
          }
        } else {
          existing.tokens = void 0;
        }
        pump(existing);
      }
    }
  }
  function capacityWait(state, tokenCost, at) {
    if (state.requests !== void 0) refill(state.requests, at);
    if (state.tokens !== void 0) refill(state.tokens, at);
    if (state.cooldownUntil > at) return { reason: "cooldown", delayMs: state.cooldownUntil - at };
    if (state.config.maxConcurrentRequests !== void 0 && state.active >= state.config.maxConcurrentRequests) {
      return { reason: "concurrency", delayMs: Number.POSITIVE_INFINITY };
    }
    if (state.requests !== void 0) {
      const delayMs = bucketDelay(state.requests, 1);
      if (delayMs > 0) return { reason: "requests", delayMs };
    }
    if (state.tokens !== void 0) {
      const delayMs = bucketDelay(state.tokens, tokenCost);
      if (delayMs > 0) return { reason: "tokens", delayMs };
    }
    return void 0;
  }
  function reserve(state, tokenCost, at) {
    if (state.requests !== void 0) {
      refill(state.requests, at);
      state.requests.tokens -= 1;
    }
    if (state.tokens !== void 0) {
      refill(state.tokens, at);
      state.tokens.tokens -= tokenCost;
    }
    state.active += 1;
    return {
      state,
      reservedTokens: state.tokens === void 0 ? 0 : tokenCost,
      failureEpoch: state.failureEpoch,
      released: false
    };
  }
  function schedulePump(state, delayMs) {
    if (state.timer !== void 0) clearTimeout(state.timer);
    if (!Number.isFinite(delayMs)) return;
    state.timer = setTimeout(() => {
      state.timer = void 0;
      pump(state);
    }, Math.max(0, Math.min(MAX_TIMER_DELAY_MS, Math.ceil(delayMs))));
  }
  function settleEntry(entry, result) {
    if (entry.settled) return;
    entry.settled = true;
    if (entry.abortListener !== void 0) {
      entry.options.signal?.removeEventListener("abort", entry.abortListener);
    }
    entry.resolve(result);
  }
  function pump(state) {
    if (state.pumping || lifetime.signal.aborted) return;
    state.pumping = true;
    try {
      while (state.queue.length > 0) {
        const entry = state.queue[0];
        const at = now();
        if (at > entry.deadline) {
          state.queue.shift();
          settleEntry(entry, localFailure(`llm-rate-limit: provider "${entry.options.provider}" admission timed out`));
          continue;
        }
        if (entry.options.signal?.aborted) {
          state.queue.shift();
          settleEntry(entry, abortedFailure("llm-rate-limit: admission cancelled"));
          continue;
        }
        const wait = capacityWait(state, entry.tokenCost, at);
        if (wait !== void 0) {
          schedulePump(state, Math.min(wait.delayMs, entry.deadline - at));
          return;
        }
        state.queue.shift();
        settleEntry(entry, { ok: true, lease: reserve(state, entry.tokenCost, at) });
      }
    } finally {
      state.pumping = false;
    }
  }
  function cancelQueued(state, entry) {
    const index = state.queue.indexOf(entry);
    if (index < 0) return;
    state.queue.splice(index, 1);
    settleEntry(entry, abortedFailure("llm-rate-limit: admission cancelled"));
    pump(state);
  }
  async function acquire(state, options, tokenCost) {
    if (lifetime.signal.aborted) return abortedFailure("llm-rate-limit: plugin disposed");
    if (options.signal?.aborted) return abortedFailure("llm-rate-limit: admission cancelled");
    if (state.tokens !== void 0 && tokenCost > state.tokens.burst) {
      return localFailure(
        `llm-rate-limit: provider "${options.provider}" request estimate ${tokenCost} exceeds token burst ${state.tokens.burst}`
      );
    }
    const at = now();
    const wait = state.queue.length === 0 ? capacityWait(state, tokenCost, at) : { reason: "queue", delayMs: 0 };
    if (wait === void 0) return { ok: true, lease: reserve(state, tokenCost, at) };
    if (options.purpose !== void 0 && state.config.queue.auxiliary === "reject") {
      return localFailure(`llm-rate-limit: provider "${options.provider}" auxiliary request was shed`);
    }
    if (state.queue.length >= state.config.queue.maxSize) {
      return localFailure(`llm-rate-limit: provider "${options.provider}" admission queue is full`);
    }
    const sessions = ctx.get("sessions");
    const sessionId = options.sessionId;
    const session = sessionId === void 0 ? void 0 : sessions?.get(sessionId);
    const waitId = session === void 0 ? void 0 : AdmissionWaitId(randomUUID());
    const deadline = at + state.config.queue.maxWaitMs;
    let resolveResult = () => {
    };
    const result = new Promise((resolve) => {
      resolveResult = resolve;
    });
    const entry = {
      options,
      tokenCost,
      enqueuedAt: at,
      deadline,
      ...session === void 0 ? {} : { session },
      ...waitId === void 0 ? {} : { waitId },
      resolve: resolveResult,
      settled: false
    };
    if (session !== void 0 && waitId !== void 0) {
      appendPluginRecord(session, WAIT_RECORD_TYPE, {
        waitId,
        provider: options.provider,
        reason: wait.reason,
        maxWaitMs: state.config.queue.maxWaitMs,
        ...options.purpose === void 0 ? {} : { purpose: options.purpose }
      });
    }
    entry.abortListener = () => {
      cancelQueued(state, entry);
    };
    options.signal?.addEventListener("abort", entry.abortListener, { once: true });
    state.queue.push(entry);
    pump(state);
    const admitted = await result;
    if (admitted.ok) {
      if (lifetime.signal.aborted) {
        rollback(admitted.lease);
        return abortedFailure("llm-rate-limit: plugin disposed");
      }
      if (options.signal?.aborted) {
        rollback(admitted.lease);
        return abortedFailure("llm-rate-limit: admission cancelled");
      }
      const startedAt = now();
      if (startedAt > deadline) {
        rollback(admitted.lease);
        return localFailure(`llm-rate-limit: provider "${options.provider}" admission timed out`);
      }
      if (session !== void 0 && waitId !== void 0 && sessionId !== void 0 && ctx.get("sessions")?.get(sessionId) === session) {
        try {
          appendPluginRecord(session, STARTED_RECORD_TYPE, { waitId, provider: options.provider });
        } catch (error) {
          rollback(admitted.lease);
          throw error;
        }
      }
    }
    return admitted;
  }
  function release(lease) {
    if (lease.released) return;
    lease.released = true;
    lease.state.active -= 1;
    pump(lease.state);
  }
  function rollback(lease) {
    const at = now();
    if (lease.state.requests !== void 0) {
      refill(lease.state.requests, at);
      lease.state.requests.tokens = Math.min(lease.state.requests.burst, lease.state.requests.tokens + 1);
    }
    if (lease.state.tokens !== void 0) {
      refill(lease.state.tokens, at);
      lease.state.tokens.tokens = Math.min(
        lease.state.tokens.burst,
        lease.state.tokens.tokens + lease.reservedTokens
      );
    }
    release(lease);
  }
  function reconcile(lease, usage) {
    const tokens = lease.state.tokens;
    if (tokens === void 0 || usage === void 0) return;
    refill(tokens, now());
    tokens.tokens = Math.min(tokens.burst, tokens.tokens + lease.reservedTokens - usageTokens(usage));
    pump(lease.state);
  }
  function cooldownDelay(config2, streak) {
    const exponent = Math.min(streak - 1, 1024);
    const target = Math.min(config2.initialDelayMs * 2 ** exponent, config2.maxDelayMs);
    const jitter = 1 - config2.jitterRatio + 2 * config2.jitterRatio * random();
    return Math.min(config2.maxDelayMs, Math.max(0, Math.round(target * jitter)));
  }
  function observeFinish(lease, chunk) {
    const { state } = lease;
    const cooldown = state.config.cooldown;
    if (chunk.reason.kind === "error" && cooldown !== void 0 && (cooldown.codes?.includes(chunk.reason.failure.code) === true || chunk.reason.failure.status !== void 0 && cooldown.statuses?.includes(chunk.reason.failure.status) === true)) {
      state.failureEpoch += 1;
      state.failureStreak += 1;
      const providerDelay = chunk.reason.failure.providerRetryAfterMs;
      const delay = providerDelay !== void 0 && Number.isFinite(providerDelay) && providerDelay > 0 && providerDelay <= cooldown.maxProviderDelayMs ? providerDelay : cooldownDelay(cooldown, state.failureStreak);
      state.cooldownUntil = Math.max(state.cooldownUntil, now() + delay);
      pump(state);
      return;
    }
    if ((chunk.reason.kind === "stop" || chunk.reason.kind === "tool-calls" || chunk.reason.kind === "max-tokens") && state.failureEpoch === lease.failureEpoch) {
      state.failureStreak = 0;
    }
  }
  async function* limitedStream(options, next) {
    let resolveDone = () => {
    };
    const done = new Promise((resolve) => {
      resolveDone = resolve;
    });
    active.add(done);
    try {
      if (lifetime.signal.aborted) {
        const failure = abortedFailure("llm-rate-limit: plugin disposed");
        yield { type: "finish", reason: { kind: "aborted", failure: failure.failure } };
        return;
      }
      const state = states.get(options.provider);
      if (state === void 0) {
        yield* next();
        return;
      }
      const tokenCost = state.config.tokens === void 0 ? 0 : estimateRequestTokens(
        options,
        state.config.tokens.estimatedOutputTokens,
        state.config.tokens.imageTokens
      );
      const admission = await acquire(state, options, tokenCost);
      if (!admission.ok) {
        yield {
          type: "finish",
          reason: admission.aborted ? { kind: "aborted", failure: admission.failure } : { kind: "error", failure: admission.failure }
        };
        return;
      }
      let usage;
      try {
        for await (const chunk of next()) {
          if (chunk.type === "usage") usage = chunk.usage;
          else if (chunk.type === "finish") observeFinish(admission.lease, chunk);
          yield chunk;
        }
      } finally {
        reconcile(admission.lease, usage);
        release(admission.lease);
      }
    } finally {
      active.delete(done);
      resolveDone();
    }
  }
  const disposeListener = ctx.on("llm/stream", (options, next) => limitedStream(options, next));
  ctx.effect(() => async () => {
    disposeListener();
    lifetime.abort(new Error("llm-rate-limit plugin disposed"));
    for (const state of states.values()) {
      if (state.timer !== void 0) clearTimeout(state.timer);
      state.timer = void 0;
      for (const entry of state.queue.splice(0)) {
        settleEntry(entry, abortedFailure("llm-rate-limit: plugin disposed"));
      }
    }
    await Promise.allSettled([...active]);
  }, "llm-rate-limit: abort queued admission and drain active streams");
  ctx.inject(["webServer"], (webCtx) => {
    const route = {
      kind: "prefix",
      path: "/llm-rate-limit",
      handler: async (req, res) => {
        if (!isLoopback(req.socket?.remoteAddress ?? "")) {
          sendJson(res, 403, { ok: false, error: "Forbidden" });
          return;
        }
        const url = new URL(req.url ?? "/", "http://x");
        const method = req.method ?? "GET";
        try {
          if (method === "GET" && url.pathname === "/llm-rate-limit/config") {
            const knownProviders = new Set(Object.keys(currentConfig.providers));
            try {
              const llm = ctx.get("llm");
              if (llm?.adapters) {
                for (const k of Object.keys(llm.adapters)) knownProviders.add(k);
              }
            } catch {}
            sendJson(res, 200, {
              ok: true,
              config: currentConfig,
              knownProviders: [...knownProviders]
            });
            return;
          }
          if (method === "POST" && url.pathname === "/llm-rate-limit/config") {
            const body = await readBody(req);
            if (!body || typeof body !== "object" || !body.config) {
              sendJson(res, 400, { ok: false, error: 'Invalid body: "config" required' });
              return;
            }
            const nextConfig = body.config;
            applyConfigUpdate(nextConfig);
            const settings = ctx.get("settings", false);
            if (settings && typeof settings.describe === "function" && typeof settings.update === "function") {
              const row = findOwnDescriptor(settings);
              if (row) {
                await settings.update(row.ns, { providers: nextConfig.providers });
              }
            }
            sendJson(res, 200, { ok: true, config: currentConfig });
            return;
          }
          if (method === "GET" && url.pathname === "/llm-rate-limit/stats") {
            const at = now();
            const stats = {};
            for (const [provider, state] of states.entries()) {
              if (state.requests !== void 0) refill(state.requests, at);
              if (state.tokens !== void 0) refill(state.tokens, at);
              stats[provider] = {
                active: state.active,
                queued: state.queue.length,
                cooldownRemainingMs: Math.max(0, state.cooldownUntil - at),
                failureStreak: state.failureStreak,
                requestsRemaining: state.requests !== void 0 ? Math.floor(state.requests.tokens) : null,
                tokensRemaining: state.tokens !== void 0 ? Math.floor(state.tokens.tokens) : null
              };
            }
            sendJson(res, 200, { ok: true, stats });
            return;
          }
          if (method === "POST" && url.pathname === "/llm-rate-limit/reset-cooldown") {
            const body = await readBody(req);
            const provider = body?.provider;
            if (typeof provider === "string" && states.has(provider)) {
              const state = states.get(provider);
              state.cooldownUntil = 0;
              state.failureStreak = 0;
              pump(state);
              sendJson(res, 200, { ok: true });
              return;
            }
            sendJson(res, 400, { ok: false, error: "Provider not found" });
            return;
          }
          sendJson(res, 404, { ok: false, error: "Not found" });
        } catch (err) {
          sendJson(res, 500, { ok: false, error: err?.message ?? String(err) });
        }
      }
    };
    webCtx.effect(() => webCtx.webServer.register(route), "llm-rate-limit: web routes");
  });
}
export {
  AdmissionWaitId,
  Config,
  apply,
  estimateRequestTokens,
  inject,
  name,
  validateConfig
};
