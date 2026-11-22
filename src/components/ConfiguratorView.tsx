import { useState } from 'react'
import { Check, Copy, Download, AlertTriangle } from 'lucide-react'
import {
  PRESET_CONFIGS,
  buildCordisPatchYaml,
  buildPiAiSettingsYaml,
  validatePolicyConfig,
  type CustomOpenAiRouteMeta,
  type ProviderPolicyConfig,
} from '../engine/simulator'

interface ConfiguratorViewProps {
  lang: 'ru' | 'en'
  policy: ProviderPolicyConfig
  onChange: (next: ProviderPolicyConfig) => void
}

export function ConfiguratorView({ lang, policy, onChange }: ConfiguratorViewProps) {
  const [copied, setCopied] = useState(false)
  const [copiedPiAi, setCopiedPiAi] = useState(false)
  const [activePreset, setActivePreset] = useState<string>('deepseekDefault')
  const [showCustomGateway, setShowCustomGateway] = useState<boolean>(false)
  const [gatewayMeta, setGatewayMeta] = useState<CustomOpenAiRouteMeta>({
    displayName: 'OpenAI-Compatible Gateway',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    api: 'openai-completions',
    modelId: 'deepseek/deepseek-chat',
    contextWindow: 131072,
  })

  const yamlText = buildCordisPatchYaml(policy)
  const piAiYamlText = buildPiAiSettingsYaml(policy.provider, gatewayMeta)
  const errors = validatePolicyConfig(policy)

  const handlePreset = (key: string) => {
    const preset = PRESET_CONFIGS[key]
    if (!preset) return
    setActivePreset(key)
    onChange({ ...preset.policy })
    if (key === 'openaiCompatible') {
      setShowCustomGateway(true)
    }
  }

  const updateNum = (field: keyof ProviderPolicyConfig, raw: string, min = 1) => {
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return
    onChange({ ...policy, [field]: Math.max(min, Math.round(parsed)) })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(yamlText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const handleCopyPiAi = async () => {
    await navigator.clipboard.writeText(piAiYamlText)
    setCopiedPiAi(true)
    window.setTimeout(() => setCopiedPiAi(false), 1800)
  }

  const handleDownloadYaml = () => {
    const blob = new Blob([yamlText], { type: 'text/yaml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cordis.patch.yml'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {lang === 'ru' ? 'Конфигуратор политики провайдера' : 'Provider Policy Configurator'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {lang === 'ru'
              ? 'Изменения сразу применяются к экспортируемому cordis.patch.yml и живому симулятору.'
              : 'Edits sync directly with the exported cordis.patch.yml and live simulator.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {Object.entries(PRESET_CONFIGS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => handlePreset(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePreset === key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'ru' ? preset.labelRu : preset.labelEn}
            </button>
          ))}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <div className="font-semibold">
              {lang === 'ru' ? 'Ошибки валидации Schemastery / validateConfig' : 'Config validation errors'}
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-xs font-mono">
              {errors.map(err => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-700">
                  {lang === 'ru' ? 'Маршрут провайдера (GenerateOptions.provider)' : 'Provider route key'}
                </span>
                <input
                  type="text"
                  value={policy.provider}
                  onChange={e => onChange({ ...policy, provider: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                <span className="block text-[11px] text-slate-500">
                  {lang === 'ru'
                    ? 'Должен точно совпадать с ключом в llm-pi-ai.providers (строчные буквы и дефисы).'
                    : 'Must match the exact key declared in llm-pi-ai.providers.'}
                </span>
              </label>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-700">
                  {lang === 'ru' ? 'Вспомогательные вызовы (purpose)' : 'Auxiliary requests (purpose)'}
                </span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['reject', 'queue'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onChange({ ...policy, auxiliary: mode })}
                      className={`py-1.5 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                        policy.auxiliary === mode
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    {lang === 'ru'
                      ? 'Регистрация OpenAI-compatible провайдера (@deepseek-ai/dsh-llm-pi-ai)'
                      : 'OpenAI-compatible endpoint registration (@deepseek-ai/dsh-llm-pi-ai)'}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'ru'
                      ? 'Включите, чтобы сгенерировать settings.yml для своего OpenAI-compatible API и связать его с этим лимитом.'
                      : 'Generate the matching llm-pi-ai provider block for your custom OpenAI-compatible endpoint.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showCustomGateway}
                  onChange={e => setShowCustomGateway(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 cursor-pointer shrink-0"
                  aria-label="Show OpenAI-Compatible llm-pi-ai configuration"
                />
              </div>

              {showCustomGateway && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-600">baseURL</span>
                    <input
                      type="text"
                      value={gatewayMeta.baseURL}
                      onChange={e => setGatewayMeta({ ...gatewayMeta, baseURL: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-600">apiKeyEnv</span>
                    <input
                      type="text"
                      value={gatewayMeta.apiKeyEnv}
                      onChange={e => setGatewayMeta({ ...gatewayMeta, apiKeyEnv: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-600">api protocol</span>
                    <select
                      value={gatewayMeta.api}
                      onChange={e =>
                        setGatewayMeta({
                          ...gatewayMeta,
                          api: e.target.value as 'openai-completions' | 'openai-responses',
                        })
                      }
                      className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="openai-completions">openai-completions</option>
                      <option value="openai-responses">openai-responses</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-600">models[0].id</span>
                    <input
                      type="text"
                      value={gatewayMeta.modelId}
                      onChange={e => setGatewayMeta({ ...gatewayMeta, modelId: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {lang === 'ru' ? 'Параллелизм (maxConcurrentRequests)' : 'Concurrency gate'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ru'
                    ? 'Ключевой лимит для DeepSeek API — ограничивает активные стримы одновременно.'
                    : 'Caps simultaneous in-flight streams per provider.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.concurrencyEnabled}
                onChange={e => onChange({ ...policy, concurrencyEnabled: e.target.checked })}
                className="w-4 h-4 accent-slate-900 cursor-pointer"
                aria-label="Enable concurrency limit"
              />
            </div>
            {policy.concurrencyEnabled && (
              <label className="block max-w-xs space-y-1">
                <span className="text-xs text-slate-600">maxConcurrentRequests</span>
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={policy.maxConcurrentRequests}
                  onChange={e => updateNum('maxConcurrentRequests', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                />
              </label>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {lang === 'ru' ? 'Частота запросов (RPM Token Bucket)' : 'Requests per minute bucket'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ru'
                    ? 'Плавное пополнение разрешений на старт новых запросов.'
                    : 'Smooth token-bucket refill over 60 seconds with configurable burst.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.requestsEnabled}
                onChange={e => onChange({ ...policy, requestsEnabled: e.target.checked })}
                className="w-4 h-4 accent-slate-900 cursor-pointer"
                aria-label="Enable RPM bucket"
              />
            </div>
            {policy.requestsEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-xs text-slate-600">requests.perMinute</span>
                  <input
                    type="number"
                    min={1}
                    value={policy.requestsPerMinute}
                    onChange={e => updateNum('requestsPerMinute', e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-slate-600">requests.burst</span>
                  <input
                    type="number"
                    min={1}
                    value={policy.requestsBurst}
                    onChange={e => updateNum('requestsBurst', e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {lang === 'ru' ? 'Бюджет токенов (TPM + сверка usage)' : 'Estimated TPM bucket'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ru'
                    ? 'Резервирует оценку перед стримом и корректирует по фактическому TokenUsage после ответа.'
                    : 'Reserves pre-call estimate and reconciles against actual TokenUsage on completion.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.tokensEnabled}
                onChange={e => onChange({ ...policy, tokensEnabled: e.target.checked })}
                className="w-4 h-4 accent-slate-900 cursor-pointer"
                aria-label="Enable TPM bucket"
              />
            </div>
            {policy.tokensEnabled && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs text-slate-600">perMinute</span>
                  <input
                    type="number"
                    min={100}
                    step={1000}
                    value={policy.tokensPerMinute}
                    onChange={e => updateNum('tokensPerMinute', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-slate-600">burst</span>
                  <input
                    type="number"
                    min={100}
                    step={1000}
                    value={policy.tokensBurst}
                    onChange={e => updateNum('tokensBurst', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-slate-600">estOutput</span>
                  <input
                    type="number"
                    min={1}
                    value={policy.estimatedOutputTokens}
                    onChange={e => updateNum('estimatedOutputTokens', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-slate-600">imageTokens</span>
                  <input
                    type="number"
                    min={1}
                    value={policy.imageTokens}
                    onChange={e => updateNum('imageTokens', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {lang === 'ru' ? 'Очередь FIFO и адаптивный cooldown' : 'FIFO queue & adaptive cooldown'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ru'
                    ? 'Уважает Retry-After от провайдера и предотвращает каскадные 429-штормы.'
                    : 'Honors upstream Retry-After and suppresses thundering-herd retries.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.cooldownEnabled}
                onChange={e => onChange({ ...policy, cooldownEnabled: e.target.checked })}
                className="w-4 h-4 accent-slate-900 cursor-pointer"
                aria-label="Enable cooldown"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-slate-600">queue.maxSize</span>
                <input
                  type="number"
                  min={1}
                  value={policy.queueMaxSize}
                  onChange={e => updateNum('queueMaxSize', e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-slate-600">queue.maxWaitMs</span>
                <input
                  type="number"
                  min={100}
                  step={1000}
                  value={policy.queueMaxWaitMs}
                  onChange={e => updateNum('queueMaxWaitMs', e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
                />
              </label>
              {policy.cooldownEnabled && (
                <label className="block space-y-1">
                  <span className="text-xs text-slate-600">initialDelayMs</span>
                  <input
                    type="number"
                    min={1}
                    step={100}
                    value={policy.initialDelayMs}
                    onChange={e => updateNum('initialDelayMs', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 font-mono">cordis.patch.yml</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  $DSH_HOME/profiles/&lt;profile&gt;/cordis.patch.yml
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (lang === 'ru' ? 'Готово' : 'Copied') : (lang === 'ru' ? 'Копировать' : 'Copy')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadYaml}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>YAML</span>
                </button>
              </div>
            </div>

            <pre className="text-xs font-mono bg-slate-950 text-slate-100 rounded-lg p-4 overflow-x-auto leading-relaxed">
              {yamlText}
            </pre>

            <div className="text-xs text-slate-600 space-y-1.5 pt-1">
              <div className="font-medium text-slate-800">
                {lang === 'ru' ? 'Как привязать пользовательский OpenAI-compatible провайдер' : 'Binding custom OpenAI-compatible routes'}
              </div>
              <p className="leading-relaxed">
                {lang === 'ru'
                  ? 'Укажите под providers: тот же ключ маршрута, под которым провайдер зарегистрирован в @deepseek-ai/dsh-llm-pi-ai (например openrouter, local-vllm или my-openai-gateway). Для нескольких провайдеров добавьте несколько ключей под providers:.'
                  : 'Use the exact route key registered in @deepseek-ai/dsh-llm-pi-ai (such as openrouter, local-vllm, or my-openai-gateway) under providers:. You can declare multiple routes simultaneously.'}
              </p>
            </div>
          </div>

          {showCustomGateway && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 font-mono">settings.yml (llm-pi-ai)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'ru'
                      ? 'Регистрация самого OpenAI-compatible эндпоинта в DSH'
                      : 'Custom OpenAI-compatible endpoint declaration in DSH'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPiAi}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedPiAi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPiAi ? (lang === 'ru' ? 'Готово' : 'Copied') : (lang === 'ru' ? 'Копировать' : 'Copy')}</span>
                </button>
              </div>
              <pre className="text-xs font-mono bg-slate-950 text-slate-100 rounded-lg p-4 overflow-x-auto leading-relaxed">
                {piAiYamlText}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
