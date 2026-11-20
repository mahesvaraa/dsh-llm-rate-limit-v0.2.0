# dsh-llm-rate-limit (v0.2.0 for DeepSeek Harness v0.2.2+)

Proactive LLM rate-limiting, concurrency control, bounded FIFO queuing, auxiliary-request shedding, and adaptive `429`/`529` cooldown plugin updated for **DeepSeek Harness (`@deepseek-ai/dsh`) v0.2.2-rc.5+**.

## What changed vs v0.1.x (`0.1.0-rc.8`)

1. **Removed `@deepseek-ai/dsh-invariants` & `./invariant`**: `dsh-invariants` was removed in DSH 0.2.x. All config and admission invariants are self-contained.
2. **Session persistence safety (`PluginRecordMap` + `appendPluginRecord`)**: DSH v0.2.2+ persistence (`validateStoredEvents`) rejects unknown `SessionEventMap` events lacking `ignorable: true` with `SessionFormatUnsupportedError`. This version records `plugin:dsh-llm-rate-limit/admission-wait` and `plugin:dsh-llm-rate-limit/admission-started` via `appendPluginRecord()`, which stamps `ignorable: true` automatically.
3. **Optional `sessions` service (`ctx.get('sessions')`)**: Works seamlessly in both full profiles (`web`, `headless`, `acp`, `sdk`) and minimal profiles (`sdk-minimal`) without stalling plugin boot.
4. **Updated `GenerateOptions` token estimator**: Prices `FileBlock` (`file`), `tool-addition`, `tool-removal`, `offloaded` image placeholders, and `options.toolHistory` without mutating frozen agent-loop requests.
5. **Cordis `^4.1.0` & Schemastery `^3.19.0`**: Aligned peer dependencies, `engines.dsh`, `exports`, `./cordis.patch.yml`, `./locale/*.json`, and `icon.svg`.

## Build & Install

```bash
npm install
npm run check
# Install from local directory into a DSH profile:
dsh plugin --profile web add ./path/to/dsh-llm-rate-limit
```
