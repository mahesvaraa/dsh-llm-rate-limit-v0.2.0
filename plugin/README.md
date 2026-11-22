# dsh-llm-rate-limit (v0.2.0 for DeepSeek Harness v0.2.2+)

Proactive LLM rate-limiting, concurrency control, bounded FIFO queuing, auxiliary-request shedding, and adaptive `429`/`529` cooldown plugin updated for **DeepSeek Harness (`@deepseek-ai/dsh`) v0.2.2-rc.5+**.

## What changed vs v0.1.x (`0.1.0-rc.8`)

1. **Removed `@deepseek-ai/dsh-invariants` & `./invariant`**: `dsh-invariants` was removed in DSH 0.2.x. All config and admission invariants are self-contained.
2. **Session persistence safety (`PluginRecordMap` + `appendPluginRecord`)**: DSH v0.2.2+ persistence (`validateStoredEvents`) rejects unknown `SessionEventMap` events lacking `ignorable: true` with `SessionFormatUnsupportedError`. This version records `plugin:dsh-llm-rate-limit/admission-wait` and `plugin:dsh-llm-rate-limit/admission-started` via `appendPluginRecord()`, which stamps `ignorable: true` automatically.
3. **Optional `sessions` service (`ctx.get('sessions')`)**: Works seamlessly in both full profiles (`web`, `headless`, `acp`, `sdk`) and minimal profiles (`sdk-minimal`) without stalling plugin boot.
4. **Updated `GenerateOptions` token estimator**: Prices `FileBlock` (`file`), `tool-addition`, `tool-removal`, `offloaded` image placeholders, and `options.toolHistory` without mutating frozen agent-loop requests.
5. **Cordis `^4.1.0` & Schemastery `^3.19.0`**: Aligned peer dependencies, `engines.dsh`, `exports`, `./cordis.patch.yml`, `./locale/*.json`, and `icon.svg`.

## Install (Prebuilt — no build step required)

`lib/index.js` and `lib/types/*` are already prebuilt inside this package, so `dsh` / `pnpm` does not need any `prepare` or build scripts:

```bash
# Install from a local directory:
dsh plugin --profile web add ./path/to/dsh-llm-rate-limit

# Or push the contents of this directory (NOT the web studio root) to GitHub:
dsh plugin --profile web add github:<your-user>/<your-repo>
```

To rebuild locally after editing `src/`:

```bash
npm install
npm run check
```

## Custom OpenAI-Compatible Providers

In DeepSeek Harness `v0.2.2+`, custom OpenAI-compatible gateways are configured via `@deepseek-ai/dsh-llm-pi-ai` (either in the Web UI **Models** page or in `$DSH_HOME/profiles/<profile>/settings.yml`):

```yaml
# $DSH_HOME/profiles/<profile>/settings.yml
llm-pi-ai:
  providers:
    my-openai-gateway:
      displayName: My OpenAI Gateway
      api: openai-completions   # or openai-responses
      baseURL: https://api.example.com/v1
      apiKeyEnv: MY_GATEWAY_API_KEY
      models:
        - id: gpt-4o-mini
          name: GPT-4o Mini
          contextWindow: 128000
```

Then configure `dsh-llm-rate-limit` using the **exact same route key** (`my-openai-gateway`) under `providers:` in `cordis.patch.yml`:

```yaml
- insert:
    - id: llm-rate-limit
      name: dsh-llm-rate-limit
      config:
        providers:
          deepseek-official:
            requests: { perMinute: 30, burst: 2 }
            maxConcurrentRequests: 2
            queue: { maxSize: 100, maxWaitMs: 300000, auxiliary: reject }
          my-openai-gateway:
            requests: { perMinute: 60, burst: 5 }
            tokens: { perMinute: 150000, burst: 40000, estimatedOutputTokens: 4096, imageTokens: 1024 }
            maxConcurrentRequests: 4
            queue: { maxSize: 100, maxWaitMs: 180000, auxiliary: reject }
```
