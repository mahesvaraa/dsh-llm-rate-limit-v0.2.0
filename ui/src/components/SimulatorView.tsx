import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Zap, ShieldAlert, XCircle } from 'lucide-react'
import {
  RateLimitEngine,
  type ProviderPolicyConfig,
  type SimSnapshot,
} from '../engine/simulator'

interface SimulatorViewProps {
  lang: 'ru' | 'en'
  policy: ProviderPolicyConfig
}

export function SimulatorView({ lang, policy }: SimulatorViewProps) {
  const clockRef = useRef<number>(0)
  const engineRef = useRef<RateLimitEngine>(new RateLimitEngine(policy, 0))
  const [running, setRunning] = useState(true)
  const [snap, setSnap] = useState<SimSnapshot>(() => engineRef.current.snapshot(0))

  useEffect(() => {
    engineRef.current.updatePolicy(policy, clockRef.current)
    setSnap(engineRef.current.snapshot(clockRef.current))
  }, [policy])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      clockRef.current += 100
      setSnap(engineRef.current.snapshot(clockRef.current))
    }, 100)
    return () => window.clearInterval(timer)
  }, [running])

  const sync = () => setSnap(engineRef.current.snapshot(clockRef.current))

  const sendSingle = () => {
    engineRef.current.submit(clockRef.current, {
      label: 'Agent Turn',
      estimatedTokens: 3200,
      actualTokens: 2150,
      durationMs: 1400,
    })
    sync()
  }

  const sendBurst = () => {
    for (let i = 1; i <= 5; i++) {
      engineRef.current.submit(clockRef.current, {
        label: `Subagent #${i}`,
        estimatedTokens: 2800 + i * 250,
        actualTokens: 1950 + i * 180,
        durationMs: 1500 + i * 150,
      })
    }
    sync()
  }

  const sendAuxiliary = () => {
    engineRef.current.submit(clockRef.current, {
      label: 'Title Generator',
      purpose: 'session-title',
      estimatedTokens: 900,
      actualTokens: 420,
      durationMs: 650,
    })
    sync()
  }

  const trigger429 = () => {
    engineRef.current.injectCooldown(429, 3000, clockRef.current)
    sync()
  }

  const trigger529 = () => {
    engineRef.current.injectCooldown(529, undefined, clockRef.current)
    sync()
  }

  const cancelQueued = () => {
    engineRef.current.abortNextQueued(clockRef.current)
    sync()
  }

  const reset = () => {
    clockRef.current = 0
    engineRef.current.reset(policy, 0)
    sync()
  }

  const statusText = (status: SimSnapshot['requests'][number]['status']) => {
    switch (status) {
      case 'active':
        return <span className="text-blue-700 font-medium">active</span>
      case 'queued':
        return <span className="text-amber-700 font-medium">queued</span>
      case 'completed':
        return <span className="text-emerald-700 font-medium">completed</span>
      case 'shed':
        return <span className="text-red-700 font-medium">shed (LOCAL_RATE_LIMIT)</span>
      case 'error-429':
        return <span className="text-red-700 font-medium">HTTP 429</span>
      case 'error-529':
        return <span className="text-red-700 font-medium">HTTP 529</span>
      case 'aborted':
        return <span className="text-slate-500 font-medium">aborted</span>
      case 'timed-out':
        return <span className="text-red-700 font-medium">timed-out</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {lang === 'ru' ? 'Симулятор лимитера и очередей' : 'Rate-Limit & Queue Simulator'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {lang === 'ru'
              ? `Тестирование текущей политики для "${policy.provider}" — проверяйте параллельные сабагенты, отсев auxiliary-вызовов и 429 cooldown.`
              : `Testing live policy for "${policy.provider}" — burst subagents, auxiliary shedding, and 429 Retry-After cooldown.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRunning(r => !r)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{running ? (lang === 'ru' ? 'Пауза' : 'Pause') : (lang === 'ru' ? 'Продолжить' : 'Resume')}</span>
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'ru' ? 'Сброс' : 'Reset'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={sendSingle}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>{lang === 'ru' ? '+1 Запрос агента' : '+1 Agent Request'}</span>
        </button>
        <button
          type="button"
          onClick={sendBurst}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{lang === 'ru' ? 'Залп: 5 сабагентов' : 'Burst: 5 Subagents'}</span>
        </button>
        <button
          type="button"
          onClick={sendAuxiliary}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>{lang === 'ru' ? '+1 Auxiliary (session-title)' : '+1 Auxiliary (session-title)'}</span>
        </button>
        <button
          type="button"
          onClick={trigger429}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white text-red-700 border border-red-200 rounded-lg hover:bg-red-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{lang === 'ru' ? 'Сбой HTTP 429 (Retry-After 3s)' : 'Inject 429 (Retry-After 3s)'}</span>
        </button>
        <button
          type="button"
          onClick={trigger529}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white text-red-700 border border-red-200 rounded-lg hover:bg-red-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>{lang === 'ru' ? 'Сбой HTTP 529' : 'Inject 529'}</span>
        </button>
        <button
          type="button"
          onClick={cancelQueued}
          disabled={snap.queueLength === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>{lang === 'ru' ? 'Отменить из очереди' : 'Abort Queued'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">{lang === 'ru' ? 'В работе (Concurrency)' : 'Active In-Flight'}</div>
          <div className="text-xl font-semibold font-mono tabular-nums text-slate-900">
            {snap.activeCount} / {policy.concurrencyEnabled ? policy.maxConcurrentRequests : '∞'}
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            admitted: {snap.totals.admitted}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">{lang === 'ru' ? 'Очередь FIFO' : 'FIFO Queue'}</div>
          <div className="text-xl font-semibold font-mono tabular-nums text-slate-900">
            {snap.queueLength} / {policy.queueMaxSize}
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            shed: {snap.totals.shed} · aborted: {snap.totals.aborted}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">{lang === 'ru' ? 'Бакет RPM' : 'RPM Bucket'}</div>
          <div className="text-xl font-semibold font-mono tabular-nums text-slate-900">
            {policy.requestsEnabled ? `${snap.reqTokens.toFixed(2)} / ${snap.reqBurst}` : 'disabled'}
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            {policy.requestsEnabled ? `${policy.requestsPerMinute} req/min` : '—'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">{lang === 'ru' ? 'Бакет TPM' : 'TPM Bucket'}</div>
          <div className="text-xl font-semibold font-mono tabular-nums text-slate-900">
            {policy.tokensEnabled
              ? `${Math.round(snap.tokTokens).toLocaleString()} / ${snap.tokBurst.toLocaleString()}`
              : 'disabled'}
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            {policy.tokensEnabled ? `${policy.tokensPerMinute.toLocaleString()} tok/min` : '—'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">{lang === 'ru' ? 'Cooldown (пауза)' : 'Cooldown Timer'}</div>
          <div
            className={`text-xl font-semibold font-mono tabular-nums ${
              snap.cooldownRemainingMs > 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {(snap.cooldownRemainingMs / 1000).toFixed(1)}s
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            streak: {snap.failureStreak} · clock: {(snap.now / 1000).toFixed(1)}s
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {lang === 'ru' ? 'Поток LLM-запросов' : 'LLM Request Stream'}
            </h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {snap.requests.length} {lang === 'ru' ? 'последних' : 'recent'}
            </span>
          </div>
          {snap.requests.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {lang === 'ru'
                ? 'Нажмите «Залп: 5 сабагентов» или «+1 Запрос агента», чтобы увидеть работу бакетов и очереди.'
                : 'Trigger a single request or 5-subagent burst above to observe admission and queuing.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                    <th className="py-2.5 px-3 font-medium">ID</th>
                    <th className="py-2.5 px-3 font-medium">{lang === 'ru' ? 'Источник' : 'Caller'}</th>
                    <th className="py-2.5 px-3 font-medium">{lang === 'ru' ? 'Состояние' : 'State'}</th>
                    <th className="py-2.5 px-3 font-medium">{lang === 'ru' ? 'Причина ожидания' : 'Wait Reason'}</th>
                    <th className="py-2.5 px-3 font-medium text-right">{lang === 'ru' ? 'Токены' : 'Tokens'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {snap.requests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono text-slate-700 tabular-nums">{req.id}</td>
                      <td className="py-2.5 px-3 text-slate-900">
                        {req.label}
                        {req.purpose ? <span className="text-slate-400 font-mono"> · {req.purpose}</span> : null}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{statusText(req.status)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{req.waitReason ?? 'immediate'}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-700">
                        {req.status === 'completed' ? req.actualTokens : req.estimatedTokens}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {lang === 'ru' ? 'Журнал Session PluginRecord (v4)' : 'Session PluginRecord Log (v4)'}
            </h2>
            <span className="text-xs font-mono text-slate-500">ignorable: true</span>
          </div>
          {snap.records.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {lang === 'ru'
                ? 'Записи admission-wait и admission-started появятся здесь при постановке запросов в очередь.'
                : 'admission-wait and admission-started records appear here whenever requests queue or shed.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {snap.records.map(rec => (
                <div key={rec.seq} className="px-4 py-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2 font-mono">
                    <span
                      className={
                        rec.type.startsWith('plugin:')
                          ? 'text-blue-700 font-medium'
                          : 'text-red-700 font-medium'
                      }
                    >
                      {rec.type}
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      #{(rec.seq)} · {(rec.time / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <div className="font-mono text-slate-600 break-all">{rec.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
