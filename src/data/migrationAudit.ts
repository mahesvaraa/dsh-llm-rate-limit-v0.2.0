export interface MigrationFinding {
  id: string
  area: string
  severity: 'breaking' | 'contract' | 'enhancement'
  titleRu: string
  titleEn: string
  causeRu: string
  causeEn: string
  fixRu: string
  fixEn: string
  beforeCode: string
  afterCode: string
}

export const MIGRATION_FINDINGS: MigrationFinding[] = [
  {
    id: 'invariants-removed',
    area: '@deepseek-ai/dsh-invariants',
    severity: 'breaking',
    titleRu: 'Пакет dsh-invariants удалён из DeepSeek Harness',
    titleEn: 'dsh-invariants package removed from DeepSeek Harness',
    causeRu:
      'Оригинальный плагин v0.1.1 требует peer-зависимость @deepseek-ai/dsh-invariants (^0.1.0-rc.8) и экспортирует ./invariant (src/invariant.ts), обращаясь к session.events. В релизе DSH v0.2.2-rc.5 пакет dsh-invariants полностью удалён, а session.events помечен deprecated.',
    causeEn:
      'Original v0.1.1 declares @deepseek-ai/dsh-invariants (^0.1.0-rc.8) as a peerDependency and exports ./invariant reading session.events. In DSH v0.2.2-rc.5, dsh-invariants no longer exists and session.events is deprecated.',
    fixRu:
      'Зависимость @deepseek-ai/dsh-invariants и устаревший ./invariant удалены. Валидация конфигурации и проверка инвариантов перенесены в самодостаточный validateConfig() без внешних сервисных зависимостей.',
    fixEn:
      'Removed @deepseek-ai/dsh-invariants peer dependency and ./invariant entry point. All config and admission checks are self-contained inside validateConfig().',
    beforeCode: `// dsh-llm-rate-limit 0.1.1 (0.1.0-rc.8)
"peerDependencies": {
  "@deepseek-ai/dsh-invariants": "^0.1.0-rc.8"
}
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'
for (const session of ctx.sessions.list()) validateSession(session, fail)`,
    afterCode: `// dsh-llm-rate-limit 0.2.0 (0.2.2-rc.5)
// dsh-invariants removed; zero non-existent peer deps
export function validateConfig(config: Config): void { ... }
// Session persistence safety enforced via appendPluginRecord()`,
  },
  {
    id: 'session-persistence-ignorable',
    area: '@deepseek-ai/dsh-session',
    severity: 'breaking',
    titleRu: 'Запись событий без ignorable: true ломает восстановление сессий (v4)',
    titleEn: 'Session.append without ignorable: true breaks Session persistence v4 restore',
    causeRu:
      'В DSH 0.2.2-rc.5 модуль validateStoredEvents проверяет тип каждого события по KNOWN_SESSION_EVENT_TYPES. Вызов session.append("llm/admission-wait", ...) записывает неизвестный ядру тип без флага ignorable: true, что вызывает SessionFormatUnsupportedError при повторном открытии или fork сессии.',
    causeEn:
      'In DSH 0.2.2-rc.5, validateStoredEvents checks every stored event against KNOWN_SESSION_EVENT_TYPES. Calling session.append("llm/admission-wait", ...) writes an unregistered event without ignorable: true, throwing SessionFormatUnsupportedError on session restore or fork.',
    fixRu:
      'Плагин переведён на расширение PluginRecordMap и функцию appendPluginRecord(session, "plugin:dsh-llm-rate-limit/admission-wait", ...). Она автоматически ставит ignorable: true, проверяет грамматику plugin:... и делает JSON-снимок без нарушения лога.',
    fixEn:
      'Migrated to PluginRecordMap + appendPluginRecord(session, "plugin:dsh-llm-rate-limit/admission-wait", ...), which stamps ignorable: true and passes JSONL/SQLite v4 validation.',
    beforeCode: `declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    'llm/admission-wait': LlmAdmissionWaitEventData
    'llm/admission-started': LlmAdmissionStartedEventData
  }
}
session.append('llm/admission-wait', { ... }) // throws on restore!`,
    afterCode: `declare module '@deepseek-ai/dsh-session/types' {
  interface PluginRecordMap {
    'plugin:dsh-llm-rate-limit/admission-wait': LlmAdmissionWaitEventData
    'plugin:dsh-llm-rate-limit/admission-started': LlmAdmissionStartedEventData
  }
}
appendPluginRecord(session, 'plugin:dsh-llm-rate-limit/admission-wait', { ... })`,
  },
  {
    id: 'optional-sessions-inject',
    area: '@deepseek-ai/cordis',
    severity: 'contract',
    titleRu: 'Опциональная зависимость от sessions (поддержка sdk-minimal)',
    titleEn: 'Optional sessions injection for minimal profiles',
    causeRu:
      'Жёсткий inject = ["llm", "sessions"] не позволяет плагину активироваться в облегчённых профилях (например, sdk-minimal), где сервис sessions не смонтирован.',
    causeEn:
      'Hard inject = ["llm", "sessions"] prevents plugin activation in headless or sdk-minimal profiles where sessions is not mounted.',
    fixRu:
      'Используется export const inject = ["llm"] и динамическое разрешение ctx.get("sessions"): если сервис сессий активен, пишется аудит PluginRecord; если отсутствует — лимитер работает в полном объёме без сбоев.',
    fixEn:
      'Uses export const inject = ["llm"] with optional ctx.get("sessions"): logs PluginRecords when sessions is present and still enforces all limits when absent.',
    beforeCode: `export const inject = ['llm', 'sessions']
// Stalls forever if sessions service is omitted
const session = ctx.sessions.get(sessionId)`,
    afterCode: `export const inject = ['llm']
// Works in web, headless, acp, sdk, and sdk-minimal
const session = sessionId === undefined ? undefined : ctx.get('sessions')?.get(sessionId)`,
  },
  {
    id: 'generate-options-v2',
    area: '@deepseek-ai/dsh-llm',
    severity: 'contract',
    titleRu: 'Поддержка FileBlock, offloaded-изображений, toolHistory и произвольных purpose',
    titleEn: 'Support for FileBlock, offloaded images, toolHistory, and extensible purpose',
    causeRu:
      'В DSH 0.2.2-rc.5 в ContentBlockMap появились FileBlock ("file"), "tool-addition", "tool-removal", флаг block.offloaded у изображений, поле options.toolHistory для отложенной загрузки инструментов, а LlmRequestPurposeMap стал расширяемым.',
    causeEn:
      'DSH 0.2.2-rc.5 introduced FileBlock ("file"), "tool-addition", "tool-removal", image.offloaded, options.toolHistory for deferred tool schemas, and extensible LlmRequestPurposeMap.',
    fixRu:
      'estimateRequestTokens явно оценивает новые типы блоков и toolHistory без мутации frozen-объекта GenerateOptions, а LlmAdmissionWaitEventData.purpose принимает любые строки LlmRequestPurpose.',
    fixEn:
      'estimateRequestTokens prices FileBlock, offloaded images, tool deltas, and toolHistory without mutating deep-frozen requests; purpose accepts any extensible string.',
    beforeCode: `purpose?: 'compaction' | 'session-title'
// Ignored FileBlock, image.offloaded, and options.toolHistory`,
    afterCode: `purpose?: string
case 'file': total += textTokens(JSON.stringify(block.attachment)) + BLOCK_OVERHEAD
case 'image': total += (block.offloaded ? 32 : imageTokens) + BLOCK_OVERHEAD
if (!options.tools?.length && options.toolHistory) { ... }`,
  },
  {
    id: 'manifest-cordis-4-1',
    area: 'package.json & manifests',
    severity: 'enhancement',
    titleRu: 'Выравнивание Cordis 4.1.0, Schemastery 3.19.0 и экспортов бандла DSH',
    titleEn: 'Aligned Cordis 4.1.0, Schemastery 3.19.0, and DSH bundle exports',
    causeRu:
      'Версия 0.1.1 требовала @deepseek-ai/dsh-* ^0.1.0-rc.8 и @deepseek-ai/cordis ^4.0.1, не объявляла engines.dsh, icon.svg и locale/*.json для каталога плагинов.',
    causeEn:
      'v0.1.1 pinned ^0.1.0-rc.8 peerDeps and ^4.0.1 Cordis, missing engines.dsh, icon.svg, and localized metadata exports.',
    fixRu:
      'Обновлены peerDependencies под ^0.2.2-rc.5 и Cordis ^4.1.0, добавлены engines.dsh (>=0.2.2-rc.0 <0.3.0), exports для ./cordis.patch.yml и ./locale/*.json, а также brandString из dsh-brand.',
    fixEn:
      'Updated peerDependencies to ^0.2.2-rc.5 and Cordis ^4.1.0, added engines.dsh, ./cordis.patch.yml & ./locale/*.json exports, and brandString().',
    beforeCode: `"peerDependencies": {
  "@deepseek-ai/cordis": "^4.0.1",
  "@deepseek-ai/dsh-llm": "^0.1.0-rc.8"
}`,
    afterCode: `"engines": { "node": ">=24.9.0", "dsh": ">=0.2.2-rc.0 <0.3.0" },
"peerDependencies": {
  "@deepseek-ai/cordis": "^4.1.0",
  "@deepseek-ai/dsh-llm": "^0.2.2-rc.5"
}`,
  },
]
