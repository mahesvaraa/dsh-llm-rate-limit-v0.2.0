import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, { LlmAdapter, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'
import { pluginRecordOf } from '@deepseek-ai/dsh-session'
import * as rateLimit from '../src/index.ts'

describe('dsh-llm-rate-limit (DSH v0.2.2+)', () => {
  it('enforces concurrency cap and drains FIFO queue', async () => {
    const ctx = new Context()
    ctx.plugin(LlmRuntime)
    let inFlight = 0
    let maxSeen = 0

    class MockAdapter extends LlmAdapter {
      override async prepareCall(provider: string, model: string) {
        return {
          model: { id: model, name: model, provider },
          async *stream(): AsyncIterable<StreamChunk> {
            inFlight += 1
            maxSeen = Math.max(maxSeen, inFlight)
            await new Promise(resolve => setTimeout(resolve, 25))
            inFlight -= 1
            yield { type: 'finish', reason: { kind: 'stop' } }
          },
        }
      }
    }

    await ctx.start()
    ctx.llm.registerAdapter(['deepseek-official'], new MockAdapter())
    ctx.plugin(rateLimit, {
      providers: {
        'deepseek-official': {
          maxConcurrentRequests: 2,
          queue: { maxSize: 10, maxWaitMs: 5000, auxiliary: 'reject' },
        },
      },
    })

    const request = (purpose?: string): GenerateOptions => ({
      provider: 'deepseek-official',
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
      ...(purpose ? { purpose } : {}),
    })

    const consume = async (opts: GenerateOptions) => {
      const chunks: StreamChunk[] = []
      for await (const chunk of ctx.llm.stream(opts)) chunks.push(chunk)
      return chunks
    }

    const [a, b, c, aux] = await Promise.all([
      consume(request()),
      consume(request()),
      consume(request()),
      consume(request('session-title')),
    ])

    expect(maxSeen).toBe(2)
    expect(a.at(-1)).toMatchObject({ type: 'finish', reason: { kind: 'stop' } })
    expect(b.at(-1)).toMatchObject({ type: 'finish', reason: { kind: 'stop' } })
    expect(c.at(-1)).toMatchObject({ type: 'finish', reason: { kind: 'stop' } })
    // Auxiliary request while saturated is shed immediately
    expect(aux.at(-1)).toMatchObject({
      type: 'finish',
      reason: { kind: 'error', failure: { code: 'LOCAL_RATE_LIMIT' } },
    })

    await ctx.stop()
  })

  it('recognizes ignorable PluginRecord entries cleanly', () => {
    const record = pluginRecordOf({
      type: 'plugin:dsh-llm-rate-limit/admission-wait',
      seq: 1 as never,
      time: Date.now(),
      ignorable: true,
      data: { waitId: 'w1', provider: 'deepseek-official', reason: 'concurrency', maxWaitMs: 5000 },
    } as never)
    expect(record?.type).toBe('plugin:dsh-llm-rate-limit/admission-wait')
  })
})
