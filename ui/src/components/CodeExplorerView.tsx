import { useState } from 'react'
import { Check, Copy, Download, FileCode2 } from 'lucide-react'
import { getPluginFiles } from '../data/pluginRegistry'
import { buildCordisPatchYaml, type ProviderPolicyConfig } from '../engine/simulator'

interface CodeExplorerViewProps {
  lang: 'ru' | 'en'
  policy: ProviderPolicyConfig
}

export function CodeExplorerView({ lang, policy }: CodeExplorerViewProps) {
  const files = getPluginFiles(buildCordisPatchYaml(policy))
  const [selectedPath, setSelectedPath] = useState<string>(files[0]!.path)
  const [copied, setCopied] = useState(false)

  const currentFile = files.find(f => f.path === selectedPath) ?? files[0]!

  const copyFile = async () => {
    await navigator.clipboard.writeText(currentFile.content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const downloadFile = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = currentFile.path.split('/').pop() ?? 'file.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {lang === 'ru' ? 'Файлы плагина dsh-llm-rate-limit v0.2.0' : 'Plugin Package Explorer (v0.2.0)'}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {lang === 'ru'
            ? 'Полный исходный код, тесты Vitest, локали и манифесты под DeepSeek Harness 0.2.2-rc.5. Нажмите «Скачать плагин (.zip)» в шапке для экспорта всего пакета.'
            : 'Complete TypeScript source, Vitest specs, locales, and DSH 0.2.2-rc.5 manifests. Use Download Plugin (.zip) in the top bar to export the package.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {files.map(file => {
            const active = file.path === currentFile.path
            return (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedPath(file.path)}
                className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                  active ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className={`text-xs font-mono font-medium truncate ${active ? 'text-blue-700' : 'text-slate-900'}`}>
                    {file.path}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {lang === 'ru' ? file.summaryRu : file.summaryEn}
                </p>
              </button>
            )
          })}
        </aside>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-mono font-semibold text-slate-900 truncate">{currentFile.path}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {lang === 'ru' ? currentFile.summaryRu : currentFile.summaryEn}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={copyFile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (lang === 'ru' ? 'Скопировано' : 'Copied') : (lang === 'ru' ? 'Копировать' : 'Copy')}</span>
              </button>
              <button
                type="button"
                onClick={downloadFile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'ru' ? 'Скачать файл' : 'Download'}</span>
              </button>
            </div>
          </div>

          <pre className="text-xs font-mono bg-slate-950 text-slate-100 p-4 overflow-x-auto max-h-[680px] leading-relaxed">
            {currentFile.content}
          </pre>
        </div>
      </div>
    </div>
  )
}
