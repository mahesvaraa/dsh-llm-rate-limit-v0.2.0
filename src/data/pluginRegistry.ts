import packageJsonRaw from '../../plugin/package.json?raw'
import cordisPatchRaw from '../../plugin/cordis.patch.yml?raw'
import tsconfigRaw from '../../plugin/tsconfig.json?raw'
import tsdownRaw from '../../plugin/tsdown.config.ts?raw'
import iconSvgRaw from '../../plugin/icon.svg?raw'
import localeEnRaw from '../../plugin/locale/en.json?raw'
import localeRuRaw from '../../plugin/locale/ru.json?raw'
import localeZhRaw from '../../plugin/locale/zh.json?raw'
import indexTsRaw from '../../plugin/src/index.ts?raw'
import typesTsRaw from '../../plugin/src/types.ts?raw'
import brandTsRaw from '../../plugin/src/brand.ts?raw'
import estimateTsRaw from '../../plugin/src/estimate.ts?raw'
import testSpecRaw from '../../plugin/tests/rate-limit.spec.ts?raw'
import readmeRaw from '../../plugin/README.md?raw'

export interface PluginFileEntry {
  path: string
  language: 'typescript' | 'json' | 'yaml' | 'markdown' | 'svg'
  content: string
  summaryRu: string
  summaryEn: string
}

export const DEFAULT_CORDIS_PATCH_YML = cordisPatchRaw

export function getPluginFiles(customCordisPatch?: string): PluginFileEntry[] {
  return [
    {
      path: 'src/index.ts',
      language: 'typescript',
      content: indexTsRaw,
      summaryRu: 'Ядро плагина: перехват llm/stream, token buckets, FIFO-очередь, cooldown и appendPluginRecord',
      summaryEn: 'Plugin core: llm/stream waterfall, token buckets, FIFO queue, cooldown, and appendPluginRecord',
    },
    {
      path: 'src/types.ts',
      language: 'typescript',
      content: typesTsRaw,
      summaryRu: 'Аугментация PluginRecordMap для совместимости с DSH v0.2.2+ persistence v4',
      summaryEn: 'PluginRecordMap module augmentation compatible with DSH v0.2.2+ persistence v4',
    },
    {
      path: 'src/estimate.ts',
      language: 'typescript',
      content: estimateTsRaw,
      summaryRu: 'Оценщик токенов: FileBlock, offloaded-изображения, toolHistory и tool-addition/removal',
      summaryEn: 'Token estimator supporting FileBlock, offloaded images, toolHistory, and tool deltas',
    },
    {
      path: 'src/brand.ts',
      language: 'typescript',
      content: brandTsRaw,
      summaryRu: 'Типизированный AdmissionWaitId через brandString из @deepseek-ai/dsh-brand',
      summaryEn: 'Branded AdmissionWaitId helper using brandString from @deepseek-ai/dsh-brand',
    },
    {
      path: 'package.json',
      language: 'json',
      content: packageJsonRaw,
      summaryRu: 'Манифест пакета под @deepseek-ai/cordis ^4.1.0 и dsh ^0.2.2-rc.5 без удалённого dsh-invariants',
      summaryEn: 'Package manifest targeting @deepseek-ai/cordis ^4.1.0 and dsh ^0.2.2-rc.5 without dsh-invariants',
    },
    {
      path: 'cordis.patch.yml',
      language: 'yaml',
      content: customCordisPatch ?? cordisPatchRaw,
      summaryRu: 'Конфигурация патча профиля DSH (синхронизируется с Конфигуратором)',
      summaryEn: 'DSH profile patch configuration (synced with Configurator)',
    },
    {
      path: 'tests/rate-limit.spec.ts',
      language: 'typescript',
      content: testSpecRaw,
      summaryRu: 'Vitest-тесты на лимит одновременных запросов, отсев auxiliary-вызовов и PluginRecord',
      summaryEn: 'Vitest suite covering concurrency limits, auxiliary shedding, and PluginRecord parsing',
    },
    {
      path: 'tsconfig.json',
      language: 'json',
      content: tsconfigRaw,
      summaryRu: 'Конфигурация TypeScript ES2024 / NodeNext для генерации .d.ts',
      summaryEn: 'TypeScript ES2024 / NodeNext configuration for declaration output',
    },
    {
      path: 'tsdown.config.ts',
      language: 'typescript',
      content: tsdownRaw,
      summaryRu: 'Конфигурация сборщика tsdown (ESM, Node 24)',
      summaryEn: 'tsdown bundler config for Node 24 ESM target',
    },
    {
      path: 'locale/ru.json',
      language: 'json',
      content: localeRuRaw,
      summaryRu: 'Локализация названия и описания в UI менеджера плагинов DSH (RU)',
      summaryEn: 'Russian plugin inventory metadata for DSH UI',
    },
    {
      path: 'locale/en.json',
      language: 'json',
      content: localeEnRaw,
      summaryRu: 'Локализация названия и описания в UI менеджера плагинов DSH (EN)',
      summaryEn: 'English plugin inventory metadata for DSH UI',
    },
    {
      path: 'locale/zh.json',
      language: 'json',
      content: localeZhRaw,
      summaryRu: 'Локализация названия и описания в UI менеджера плагинов DSH (ZH)',
      summaryEn: 'Chinese plugin inventory metadata for DSH UI',
    },
    {
      path: 'icon.svg',
      language: 'svg',
      content: iconSvgRaw,
      summaryRu: 'Иконка плагина для каталога расширений DSH',
      summaryEn: 'Plugin SVG icon for DSH inventory',
    },
    {
      path: 'README.md',
      language: 'markdown',
      content: readmeRaw,
      summaryRu: 'Документация по сборке, установке и миграции с 0.1.x',
      summaryEn: 'Build, installation, and 0.1.x migration guide',
    },
  ]
}
