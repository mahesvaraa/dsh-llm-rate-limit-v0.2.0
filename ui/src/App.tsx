/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react'
import { Download } from 'lucide-react'
import { CompatibilityView } from './components/CompatibilityView'
import { ConfiguratorView } from './components/ConfiguratorView'
import { SimulatorView } from './components/SimulatorView'
import { CodeExplorerView } from './components/CodeExplorerView'
import { getPluginFiles } from './data/pluginRegistry'
import {
  PRESET_CONFIGS,
  buildCordisPatchYaml,
  type ProviderPolicyConfig,
} from './engine/simulator'
import { buildZipBlob } from './utils/zipBuilder'

type ActiveTab = 'compat' | 'config' | 'simulator' | 'code'

export default function App() {
  const [tab, setTab] = useState<ActiveTab>('compat')
  const [lang, setLang] = useState<'ru' | 'en'>('ru')
  const [policy, setPolicy] = useState<ProviderPolicyConfig>(() => ({
    ...PRESET_CONFIGS.deepseekDefault!.policy,
  }))

  const handleDownloadZip = () => {
    const customYaml = buildCordisPatchYaml(policy)
    const files = getPluginFiles(customYaml)
    const blob = buildZipBlob(
      files.map(file => ({
        path: `dsh-llm-rate-limit/${file.path}`,
        content: file.content,
      })),
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'dsh-llm-rate-limit-v0.2.0.zip'
    link.click()
    URL.revokeObjectURL(url)
  }

  const navItems: { id: ActiveTab; labelRu: string; labelEn: string }[] = [
    { id: 'compat', labelRu: 'Совместимость', labelEn: 'Compatibility' },
    { id: 'config', labelRu: 'Конфигуратор', labelEn: 'Configurator' },
    { id: 'simulator', labelRu: 'Симулятор', labelEn: 'Simulator' },
    { id: 'code', labelRu: 'Исходный код', labelEn: 'Plugin Source' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setTab('compat')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            DSH Rate Limit
          </button>

          <nav className="flex items-center gap-6 overflow-x-auto" aria-label="Primary navigation">
            {navItems.map(item => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {lang === 'ru' ? item.labelRu : item.labelEn}
                </button>
              )
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleDownloadZip}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'ru' ? 'Скачать плагин (.zip)' : 'Download Plugin (.zip)'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-mono">dsh-llm-rate-limit</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">v0.2.0</span>
            <span aria-hidden="true">·</span>
            <span>{lang === 'ru' ? 'Совместим с DeepSeek Harness 0.2.2-rc.5' : 'Built for DeepSeek Harness 0.2.2-rc.5'}</span>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-md">
            <button
              type="button"
              onClick={() => setLang('ru')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                lang === 'ru' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                lang === 'en' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {tab === 'compat' && (
          <CompatibilityView
            lang={lang}
            onJumpToTab={target => setTab(target)}
          />
        )}
        {tab === 'config' && (
          <ConfiguratorView
            lang={lang}
            policy={policy}
            onChange={setPolicy}
          />
        )}
        {tab === 'simulator' && (
          <SimulatorView
            lang={lang}
            policy={policy}
          />
        )}
        {tab === 'code' && (
          <CodeExplorerView
            lang={lang}
            policy={policy}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1360px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            {lang === 'ru'
              ? 'Обновлённая реализация на базе Asong6824/dsh-llm-rate-limit под API DeepSeek Harness v0.2.2-rc.5'
              : 'Updated implementation inspired by Asong6824/dsh-llm-rate-limit for DeepSeek Harness v0.2.2-rc.5'}
          </span>
          <span className="font-mono">MIT License</span>
        </div>
      </footer>
    </div>
  )
}
