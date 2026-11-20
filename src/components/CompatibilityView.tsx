import { useState } from 'react'
import { Check, Copy, ArrowRight } from 'lucide-react'
import { MIGRATION_FINDINGS, type MigrationFinding } from '../data/migrationAudit'

interface CompatibilityViewProps {
  lang: 'ru' | 'en'
  onJumpToTab: (tab: 'config' | 'simulator' | 'code') => void
}

export function CompatibilityView({ lang, onJumpToTab }: CompatibilityViewProps) {
  const [selectedId, setSelectedId] = useState<string>(MIGRATION_FINDINGS[0]!.id)
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)

  const selected: MigrationFinding =
    MIGRATION_FINDINGS.find(item => item.id === selectedId) ?? MIGRATION_FINDINGS[0]!

  const copyCommand = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedCmd(id)
    window.setTimeout(() => setCopiedCmd(null), 1800)
  }

  const installCmd = 'npm install && npm run check\ndsh plugin --profile web add ./dsh-llm-rate-limit'

  const severityLabel = (sev: MigrationFinding['severity']) => {
    if (sev === 'breaking') {
      return (
        <span className="text-xs font-medium text-red-700">
          {lang === 'ru' ? 'Критическое несоответствие' : 'Breaking incompatibility'}
        </span>
      )
    }
    if (sev === 'contract') {
      return (
        <span className="text-xs font-medium text-amber-700">
          {lang === 'ru' ? 'Контракт API' : 'API contract change'}
        </span>
      )
    }
    return (
      <span className="text-xs font-medium text-blue-700">
        {lang === 'ru' ? 'Манифест и зависимости' : 'Manifest & dependencies'}
      </span>
    )
  }

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-200 pb-8">
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <span>deepseek-ai/deepseek-harness</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">dsh-v0.2.2-rc.5</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">@deepseek-ai/cordis 4.1.0</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 text-balance">
            {lang === 'ru'
              ? 'Плагин ограничения частоты LLM, обновлённый под актуальный DeepSeek Harness'
              : 'Proactive LLM rate-limit plugin rebuilt for DeepSeek Harness v0.2.2'}
          </h1>
          <p className="text-[15px] leading-relaxed text-slate-600 max-w-2xl">
            {lang === 'ru'
              ? 'Оригинальный Asong6824/dsh-llm-rate-limit (v0.1.1) собран под ветку 0.1.0-rc.8 и падает на актуальном DSH 0.2.2-rc.5 из-за удаления dsh-invariants, обязательного флага ignorable в логах сессии и изменений ContentBlock/Cordis. Ниже — полный разбор исправлений и готовый к установке пакет.'
              : 'The original Asong6824/dsh-llm-rate-limit (v0.1.1) targeted 0.1.0-rc.8 and breaks on current DSH 0.2.2-rc.5 due to the removal of dsh-invariants, Session persistence v4 ignorable rules, and updated ContentBlock/Cordis contracts.'}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onJumpToTab('config')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{lang === 'ru' ? 'Настроить cordis.patch.yml' : 'Configure cordis.patch.yml'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onJumpToTab('simulator')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{lang === 'ru' ? 'Запустить симулятор 429' : 'Open 429 Simulator'}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              {lang === 'ru' ? 'Быстрая установка в профиль DSH' : 'Quick install into DSH profile'}
            </h2>
            <button
              type="button"
              onClick={() => copyCommand('install', installCmd)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedCmd === 'install' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'install' ? (lang === 'ru' ? 'Скопировано' : 'Copied') : (lang === 'ru' ? 'Копировать' : 'Copy')}</span>
            </button>
          </div>
          <pre className="text-xs font-mono bg-slate-950 text-slate-100 rounded-lg p-3.5 overflow-x-auto leading-relaxed">
            {installCmd}
          </pre>
          <dl className="grid grid-cols-2 gap-4 pt-1 text-xs">
            <div>
              <dt className="text-slate-500">{lang === 'ru' ? 'Целевой движок' : 'Target engine'}</dt>
              <dd className="font-mono font-medium text-slate-900 mt-0.5 tabular-nums">dsh &gt;=0.2.2-rc.0</dd>
            </div>
            <div>
              <dt className="text-slate-500">{lang === 'ru' ? 'Формат сессий' : 'Session format'}</dt>
              <dd className="font-mono font-medium text-slate-900 mt-0.5 tabular-nums">v4 PluginRecord</dd>
            </div>
            <div>
              <dt className="text-slate-500">{lang === 'ru' ? 'Точка перехвата' : 'Hook seam'}</dt>
              <dd className="font-mono font-medium text-slate-900 mt-0.5">ctx.on('llm/stream')</dd>
            </div>
            <div>
              <dt className="text-slate-500">{lang === 'ru' ? 'Профили' : 'Profiles'}</dt>
              <dd className="font-mono font-medium text-slate-900 mt-0.5">web · headless · sdk</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {lang === 'ru'
                ? 'Почему оригинальный плагин несовместим с 0.2.2-rc.5 и что исправлено'
                : 'Why v0.1.1 fails on 0.2.2-rc.5 and what was fixed'}
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              {lang === 'ru'
                ? 'Выберите пункт в списке слева, чтобы сравнить исходный контракт и обновлённую реализацию.'
                : 'Select an item on the left to inspect the exact API diff between 0.1.0-rc.8 and 0.2.2-rc.5.'}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {MIGRATION_FINDINGS.length} {lang === 'ru' ? 'изменений проверено' : 'changes verified'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
            {MIGRATION_FINDINGS.map((item, idx) => {
              const active = item.id === selected.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                    active ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1">
                    <span className="font-mono text-slate-500">{item.area}</span>
                    {severityLabel(item.severity)}
                  </div>
                  <div className={`text-sm font-medium ${active ? 'text-blue-700' : 'text-slate-900'}`}>
                    {String(idx + 1).padStart(2, '0')}. {lang === 'ru' ? item.titleRu : item.titleEn}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="space-y-1.5 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono">{selected.area}</span>
                <span aria-hidden="true">·</span>
                {severityLabel(selected.severity)}
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {lang === 'ru' ? selected.titleRu : selected.titleEn}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-700">
                  {lang === 'ru' ? 'Причина поломки в 0.2.2-rc.5' : 'Root cause in 0.2.2-rc.5'}
                </div>
                <p className="text-slate-600 leading-relaxed text-[13px]">
                  {lang === 'ru' ? selected.causeRu : selected.causeEn}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-700">
                  {lang === 'ru' ? 'Решение в новой версии (0.2.0)' : 'Resolution in v0.2.0'}
                </div>
                <p className="text-slate-600 leading-relaxed text-[13px]">
                  {lang === 'ru' ? selected.fixRu : selected.fixEn}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1">
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-red-700">
                  {lang === 'ru' ? 'Было (v0.1.1 / DSH 0.1.0-rc.8)' : 'Before (v0.1.1 / DSH 0.1.0-rc.8)'}
                </div>
                <pre className="text-xs font-mono bg-slate-950 text-red-200/90 rounded-lg p-3.5 overflow-x-auto leading-relaxed">
                  {selected.beforeCode}
                </pre>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-emerald-700">
                  {lang === 'ru' ? 'Стало (v0.2.0 / DSH 0.2.2-rc.5)' : 'After (v0.2.0 / DSH 0.2.2-rc.5)'}
                </div>
                <pre className="text-xs font-mono bg-slate-950 text-emerald-200/95 rounded-lg p-3.5 overflow-x-auto leading-relaxed">
                  {selected.afterCode}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
