window.__ModuleLoader__.load({
	id: "dsh-llm-rate-limit",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");

		const LOCALE_NS = "dsh-llm-rate-limit";

		const dictionaries = {
			en: {
				nav: "LLM Rate Limits",
				heading: "LLM Rate Limiting",
				intro: "Configure proactive RPM limits, concurrency caps, FIFO queues, and adaptive cooldowns for LLM providers.",
				providers: "Providers",
				addProvider: "+ Add Provider",
				removeProvider: "Remove Provider",
				noProviders: "No providers configured yet. Click \"+ Add Provider\" above to set limits.",
				requestsTitle: "Request Rate Limit (RPM)",
				requestsDesc: "Token bucket limiting total requests per minute and bursts.",
				requestsEnable: "Enable request limit",
				perMinute: "Requests per minute (RPM)",
				burst: "Burst allowance",
				concurrencyTitle: "Concurrency Control",
				concurrencyDesc: "Maximum simultaneous LLM calls in flight.",
				concurrencyEnable: "Limit concurrent requests",
				maxConcurrent: "Max concurrent requests",
				queueTitle: "Request Queue (FIFO)",
				queueDesc: "Bounded waiting buffer when limits or concurrency are exceeded.",
				maxQueueSize: "Max queue size",
				maxWaitMs: "Max wait time (ms)",
				auxiliaryMode: "Auxiliary requests policy",
				auxReject: "Reject immediately (shed)",
				auxQueue: "Wait in queue",
				cooldownTitle: "Adaptive Cooldown (429/529)",
				cooldownDesc: "Temporary backoff when a provider returns rate limit or server errors.",
				cooldownEnable: "Enable adaptive cooldown",
				initialDelayMs: "Initial delay (ms)",
				maxDelayMs: "Max delay (ms)",
				statuses: "HTTP status codes (comma separated)",
				statsTitle: "Live Status",
				activeCalls: "Active calls",
				inQueue: "Queued",
				requestsRemaining: "RPM bucket remaining",
				cooldownStatus: "Cooldown state",
				normal: "Normal (idle)",
				inCooldown: "Active ({ms}s remaining)",
				resetCooldown: "Reset Cooldown",
				save: "Save Changes",
				saving: "Saving…",
				saved: "Saved & applied successfully!",
				saveFailed: "Failed to save: "
			},
			ru: {
				nav: "Лимиты LLM",
				heading: "Ограничение частоты LLM",
				intro: "Проактивные лимиты запросов (RPM), контроль параллелизма, FIFO-очередь и адаптивный кулдаун при ошибках 429/529.",
				providers: "Провайдеры",
				addProvider: "+ Добавить провайдер",
				removeProvider: "Удалить провайдер",
				noProviders: "Провайдеры еще не настроены. Нажмите «+ Добавить провайдер», чтобы задать лимиты.",
				requestsTitle: "Лимит частоты запросов (RPM)",
				requestsDesc: "Корзина токенов для ограничения числа запросов в минуту и всплесков.",
				requestsEnable: "Включить лимит запросов",
				perMinute: "Запросов в минуту (RPM)",
				burst: "Всплеск (Burst)",
				concurrencyTitle: "Контроль параллелизма",
				concurrencyDesc: "Максимальное количество одновременно выполняемых запросов.",
				concurrencyEnable: "Ограничить параллельные запросы",
				maxConcurrent: "Макс. параллельных запросов",
				queueTitle: "Очередь вызовов (FIFO)",
				queueDesc: "Буфер ожидания при исчерпании лимитов или параллельных слотов.",
				maxQueueSize: "Максимальный размер очереди",
				maxWaitMs: "Макс. время ожидания (мс)",
				auxiliaryMode: "Вспомогательные вызовы (auxiliary)",
				auxReject: "Сбрасывать сразу (reject)",
				auxQueue: "Ставить в очередь (queue)",
				cooldownTitle: "Адаптивный кулдаун (429/529)",
				cooldownDesc: "Временная пауза при получении ошибок 429/529 от провайдера.",
				cooldownEnable: "Включить адаптивный кулдаун",
				initialDelayMs: "Начальная задержка (мс)",
				maxDelayMs: "Максимальная задержка (мс)",
				statuses: "HTTP-коды ошибок (через запятую)",
				statsTitle: "Текущее состояние в реальном времени",
				activeCalls: "Активные вызовы",
				inQueue: "В очереди",
				requestsRemaining: "Остаток в корзине RPM",
				cooldownStatus: "Статус кулдауна",
				normal: "Норма (готов)",
				inCooldown: "Пауза ({ms}с осталось)",
				resetCooldown: "Сбросить кулдаун",
				save: "Сохранить настройки",
				saving: "Сохранение…",
				saved: "Настройки успешно сохранены и применены!",
				saveFailed: "Ошибка при сохранении: "
			},
			zh: {
				nav: "LLM 速率限制",
				heading: "LLM 速率限制",
				intro: "面向请求的主动限流 (RPM)、并发槽位控制、FIFO 排队及 429/529 自适应冷却。",
				providers: "提供方",
				addProvider: "+ 添加提供方",
				removeProvider: "删除提供方",
				noProviders: "暂无配置的提供方。点击上方「+ 添加提供方」进行配置。",
				requestsTitle: "请求速率限制 (RPM)",
				requestsDesc: "基于令牌桶限制每分钟请求数和突发容量。",
				requestsEnable: "启用请求限制",
				perMinute: "每分钟请求数 (RPM)",
				burst: "突发容量 (Burst)",
				concurrencyTitle: "并发控制",
				concurrencyDesc: "允许同时进行的最多 LLM 调用数。",
				concurrencyEnable: "限制并发调用数",
				maxConcurrent: "最大并发请求数",
				queueTitle: "请求排队队列 (FIFO)",
				queueDesc: "当达到频率或并发上限时的缓冲等待队列。",
				maxQueueSize: "队列最大容量",
				maxWaitMs: "最大等待时间 (毫秒)",
				auxiliaryMode: "辅助调用策略",
				auxReject: "直接拒绝 (reject)",
				auxQueue: "进入排队 (queue)",
				cooldownTitle: "自适应冷却 (429/529)",
				cooldownDesc: "当提供方返回速率限制或服务器错误时自动退避。",
				cooldownEnable: "启用自适应冷却",
				initialDelayMs: "初始退避时间 (毫秒)",
				maxDelayMs: "最大退避时间 (毫秒)",
				statuses: "HTTP 状态码 (逗号分隔)",
				statsTitle: "实时状态",
				activeCalls: "活跃调用",
				inQueue: "排队中",
				requestsRemaining: "RPM 令牌剩余",
				cooldownStatus: "冷却状态",
				normal: "正常",
				inCooldown: "冷却中 (剩余 {ms} 秒)",
				resetCooldown: "重置冷却",
				save: "保存配置",
				saving: "保存中…",
				saved: "保存成功并已生效！",
				saveFailed: "保存失败: "
			}
		};

		const css = `
			.dsh-rl-section {
				max-width: 760px;
				color: var(--dsw-alias-label-primary);
				flex-direction: column;
				gap: 16px;
				display: flex;
			}
			.dsh-rl-heading {
				margin: 0;
				font-size: 18px;
				font-weight: 600;
			}
			.dsh-rl-intro {
				color: var(--dsw-alias-label-secondary);
				margin: 0;
				font-size: 13px;
				line-height: 18px;
			}
			.dsh-rl-tabs-bar {
				display: flex;
				align-items: center;
				justify-content: space-between;
				border-bottom: 1px solid var(--dsw-alias-border-l2);
				margin-top: 4px;
				gap: 12px;
			}
			.dsh-rl-tabs {
				align-items: flex-end;
				gap: 8px;
				display: flex;
				overflow-x: auto;
			}
			.dsh-rl-tab {
				color: var(--dsw-alias-label-tertiary);
				font: inherit;
				cursor: pointer;
				background: 0 0;
				border: 0;
				padding: 8px 12px;
				font-size: 13px;
				font-weight: 500;
				line-height: 20px;
				position: relative;
				white-space: nowrap;
				border-radius: 4px 4px 0 0;
			}
			.dsh-rl-tab:hover, .dsh-rl-tab[data-active=true] {
				color: var(--dsw-alias-label-primary);
			}
			.dsh-rl-tab[data-active=true]:after {
				background: var(--dsw-alias-label-primary);
				content: "";
				border-radius: 2px 2px 0 0;
				height: 2px;
				position: absolute;
				bottom: -1px;
				left: 0;
				right: 0;
			}
			.dsh-rl-add-btn {
				background: transparent;
				border: 1px dashed var(--dsw-alias-border-l2);
				color: var(--dsw-alias-label-secondary);
				border-radius: 6px;
				padding: 4px 10px;
				font-size: 12px;
				cursor: pointer;
				white-space: nowrap;
			}
			.dsh-rl-add-btn:hover {
				color: var(--dsw-alias-label-primary);
				border-color: var(--dsw-alias-label-primary);
			}
			.dsh-rl-card {
				background: var(--dsw-alias-bg-module-platform);
				border: 1px solid var(--dsw-alias-border-l2);
				border-radius: 12px;
				padding: 16px;
				display: flex;
				flex-direction: column;
				gap: 14px;
			}
			.dsh-rl-card-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
			}
			.dsh-rl-card-title {
				margin: 0;
				font-size: 14px;
				font-weight: 600;
				color: var(--dsw-alias-label-primary);
			}
			.dsh-rl-card-desc {
				margin: 2px 0 0;
				font-size: 12px;
				color: var(--dsw-alias-label-tertiary);
			}
			.dsh-rl-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 16px;
			}
			.dsh-rl-label {
				font-size: 13px;
				color: var(--dsw-alias-label-secondary);
			}
			.dsh-rl-input {
				box-sizing: border-box;
				background: transparent;
				color: var(--dsw-alias-label-primary);
				border: 1px solid var(--dsw-alias-border-l2);
				border-radius: 6px;
				height: 28px;
				padding: 0 8px;
				font-size: 13px;
				font-family: inherit;
				width: 140px;
				outline: none;
			}
			.dsh-rl-input:focus {
				border-color: var(--dsw-alias-state-business-primary, #3b82f6);
			}
			.dsh-rl-select {
				box-sizing: border-box;
				background: var(--dsw-alias-bg-module-platform);
				color: var(--dsw-alias-label-primary);
				border: 1px solid var(--dsw-alias-border-l2);
				border-radius: 6px;
				height: 28px;
				padding: 0 8px;
				font-size: 13px;
				font-family: inherit;
				outline: none;
			}
			.dsh-rl-switch {
				position: relative;
				display: inline-flex;
				align-items: center;
				cursor: pointer;
				gap: 8px;
			}
			.dsh-rl-switch input {
				cursor: pointer;
				accent-color: var(--dsw-alias-state-business-primary, #3b82f6);
			}
			.dsh-rl-stats-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
				gap: 12px;
			}
			.dsh-rl-stat-box {
				background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.05));
				border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.1));
				border-radius: 8px;
				padding: 10px 12px;
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
			.dsh-rl-stat-label {
				font-size: 11px;
				color: var(--dsw-alias-label-tertiary);
			}
			.dsh-rl-stat-val {
				font-size: 18px;
				font-weight: 600;
				color: var(--dsw-alias-label-primary);
				font-variant-numeric: tabular-nums;
			}
			.dsh-rl-footer {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-top: 8px;
				padding-top: 12px;
				border-top: 1px solid var(--dsw-alias-border-l2);
			}
			.dsh-rl-btn {
				background: var(--dsw-alias-state-business-primary, #3b82f6);
				color: #fff;
				border: 0;
				border-radius: 6px;
				padding: 7px 18px;
				font-size: 13px;
				font-weight: 500;
				cursor: pointer;
			}
			.dsh-rl-btn:hover {
				opacity: 0.9;
			}
			.dsh-rl-btn:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
			.dsh-rl-btn-danger {
				background: transparent;
				border: 1px solid var(--dsw-alias-border-l2);
				color: #ef4444;
				border-radius: 6px;
				padding: 5px 12px;
				font-size: 12px;
				cursor: pointer;
			}
			.dsh-rl-btn-danger:hover {
				background: rgba(239, 68, 68, 0.1);
			}
			.dsh-rl-msg {
				font-size: 13px;
				margin-left: 12px;
			}
			.dsh-rl-msg-ok {
				color: #10b981;
			}
			.dsh-rl-msg-err {
				color: #ef4444;
			}
		`;

		const tagId = "dsh-llm-rate-limit/styles";
		if (typeof document !== "undefined" && !document.querySelector(`style[data-plugin-css="${tagId}"]`)) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-llm-rate-limit";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		function RateLimitSection({ t }) {
			const [config, setConfig] = react.useState(null);
			const [knownProviders, setKnownProviders] = react.useState([]);
			const [selectedProvider, setSelectedProvider] = react.useState("");
			const [stats, setStats] = react.useState({});
			const [saving, setSaving] = react.useState(false);
			const [statusMsg, setStatusMsg] = react.useState(null);

			// Load initial config
			const loadConfig = () => {
				fetch("/llm-rate-limit/config")
					.then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
					.then((data) => {
						if (data && data.ok) {
							setConfig(data.config || { providers: {} });
							setKnownProviders(data.knownProviders || []);
							const provKeys = Object.keys(data.config?.providers || {});
							if (provKeys.length > 0 && (!selectedProvider || !data.config.providers[selectedProvider])) {
								setSelectedProvider(provKeys[0]);
							}
						}
					})
					.catch((e) => console.error("[dsh-llm-rate-limit] Failed to fetch config:", e));
			};

			// Load live stats
			const loadStats = () => {
				fetch("/llm-rate-limit/stats")
					.then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
					.then((data) => {
						if (data && data.ok) setStats(data.stats || {});
					})
					.catch(() => {});
			};

			react.useEffect(() => {
				loadConfig();
				loadStats();
				const interval = setInterval(loadStats, 2000);
				return () => clearInterval(interval);
			}, []);

			if (!config) {
				return react.createElement("div", { className: "dsh-rl-section" },
					react.createElement("h2", { className: "dsh-rl-heading" }, t("heading")),
					react.createElement("p", { className: "dsh-rl-intro" }, "Loading configuration…")
				);
			}

			const providers = config.providers || {};
			const providerKeys = Object.keys(providers);
			const current = providers[selectedProvider] || null;
			const currentStats = stats[selectedProvider] || null;

			const handleAddProvider = () => {
				const unconfigured = knownProviders.filter((p) => !providers[p]);
				const name = prompt(
					"Enter provider name" + (unconfigured.length ? " (known: " + unconfigured.join(", ") + ")" : ""),
					unconfigured[0] || ""
				);
				if (!name) return;
				const trimmed = name.trim();
				if (!trimmed) return;
				if (providers[trimmed]) {
					setSelectedProvider(trimmed);
					return;
				}
				const next = {
					...config,
					providers: {
						...providers,
						[trimmed]: {
							requests: { perMinute: 30, burst: 2 },
							maxConcurrentRequests: 2,
							queue: { maxSize: 100, maxWaitMs: 300000, auxiliary: "reject" },
							cooldown: {
								codes: ["RATE_LIMIT", "SERVER"],
								statuses: [429, 529],
								initialDelayMs: 500,
								maxDelayMs: 60000,
								maxProviderDelayMs: 3600000,
								jitterRatio: 0.1
							}
						}
					}
				};
				setConfig(next);
				setSelectedProvider(trimmed);
			};

			const handleRemoveProvider = () => {
				if (!confirm("Remove rate limit policy for provider \"" + selectedProvider + "\"?")) return;
				const nextProviders = { ...providers };
				delete nextProviders[selectedProvider];
				const next = { ...config, providers: nextProviders };
				setConfig(next);
				const remaining = Object.keys(nextProviders);
				setSelectedProvider(remaining[0] || "");
			};

			const updateCurrent = (patch) => {
				if (!selectedProvider) return;
				setConfig({
					...config,
					providers: {
						...providers,
						[selectedProvider]: {
							...current,
							...patch
						}
					}
				});
			};

			const handleSave = () => {
				setSaving(true);
				setStatusMsg(null);
				fetch("/llm-rate-limit/config", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ config })
				})
					.then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
					.then((data) => {
						setSaving(false);
						if (data && data.ok) {
							setStatusMsg({ ok: true, text: t("saved") });
							loadStats();
						} else {
							setStatusMsg({ ok: false, text: t("saveFailed") + (data?.error || "unknown") });
						}
						setTimeout(() => setStatusMsg(null), 4000);
					})
					.catch((err) => {
						setSaving(false);
						setStatusMsg({ ok: false, text: t("saveFailed") + err.message });
						setTimeout(() => setStatusMsg(null), 4000);
					});
			};

			const handleResetCooldown = () => {
				fetch("/llm-rate-limit/reset-cooldown", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ provider: selectedProvider })
				})
					.then(() => loadStats())
					.catch(() => {});
			};

			return react.createElement("div", { className: "dsh-rl-section" },
				react.createElement("h2", { className: "dsh-rl-heading" }, t("heading")),
				react.createElement("p", { className: "dsh-rl-intro" }, t("intro")),

				// Provider tabs
				react.createElement("div", { className: "dsh-rl-tabs-bar" },
					react.createElement("div", { className: "dsh-rl-tabs" },
						providerKeys.map((p) =>
							react.createElement("button", {
								key: p,
								type: "button",
								className: "dsh-rl-tab",
								"data-active": p === selectedProvider ? "true" : void 0,
								onClick: () => setSelectedProvider(p)
							}, p)
						)
					),
					react.createElement("button", {
						type: "button",
						className: "dsh-rl-add-btn",
						onClick: handleAddProvider
					}, t("addProvider"))
				),

				!current
					? react.createElement("p", { style: { color: "var(--dsw-alias-label-tertiary)" } }, t("noProviders"))
					: react.createElement(react.Fragment, null,

						// Card 1: Requests RPM
						react.createElement("div", { className: "dsh-rl-card" },
							react.createElement("div", { className: "dsh-rl-card-header" },
								react.createElement("div", null,
									react.createElement("h3", { className: "dsh-rl-card-title" }, t("requestsTitle")),
									react.createElement("p", { className: "dsh-rl-card-desc" }, t("requestsDesc"))
								),
								react.createElement("label", { className: "dsh-rl-switch" },
									react.createElement("input", {
										type: "checkbox",
										checked: Boolean(current.requests),
										onChange: (e) => {
											updateCurrent({
												requests: e.target.checked
													? { perMinute: 30, burst: 2 }
													: void 0
											});
										}
									}),
									react.createElement("span", { className: "dsh-rl-label" }, t("requestsEnable"))
								)
							),
							current.requests && react.createElement(react.Fragment, null,
								react.createElement("div", { className: "dsh-rl-row" },
									react.createElement("span", { className: "dsh-rl-label" }, t("perMinute")),
									react.createElement("input", {
										type: "number",
										min: 1,
										className: "dsh-rl-input",
										value: current.requests.perMinute,
										onChange: (e) => {
											const val = parseInt(e.target.value, 10);
											if (val > 0) updateCurrent({ requests: { ...current.requests, perMinute: val } });
										}
									})
								),
								react.createElement("div", { className: "dsh-rl-row" },
									react.createElement("span", { className: "dsh-rl-label" }, t("burst")),
									react.createElement("input", {
										type: "number",
										min: 1,
										className: "dsh-rl-input",
										value: current.requests.burst,
										onChange: (e) => {
											const val = parseInt(e.target.value, 10);
											if (val > 0) updateCurrent({ requests: { ...current.requests, burst: val } });
										}
									})
								)
							)
						),

						// Card 2: Concurrency
						react.createElement("div", { className: "dsh-rl-card" },
							react.createElement("div", { className: "dsh-rl-card-header" },
								react.createElement("div", null,
									react.createElement("h3", { className: "dsh-rl-card-title" }, t("concurrencyTitle")),
									react.createElement("p", { className: "dsh-rl-card-desc" }, t("concurrencyDesc"))
								),
								react.createElement("label", { className: "dsh-rl-switch" },
									react.createElement("input", {
										type: "checkbox",
										checked: typeof current.maxConcurrentRequests === "number",
										onChange: (e) => {
											updateCurrent({
												maxConcurrentRequests: e.target.checked ? 2 : void 0
											});
										}
									}),
									react.createElement("span", { className: "dsh-rl-label" }, t("concurrencyEnable"))
								)
							),
							typeof current.maxConcurrentRequests === "number" && react.createElement("div", { className: "dsh-rl-row" },
								react.createElement("span", { className: "dsh-rl-label" }, t("maxConcurrent")),
								react.createElement("input", {
									type: "number",
									min: 1,
									className: "dsh-rl-input",
									value: current.maxConcurrentRequests,
									onChange: (e) => {
										const val = parseInt(e.target.value, 10);
										if (val > 0) updateCurrent({ maxConcurrentRequests: val });
									}
								})
							)
						),

						// Card 3: Queue Settings
						react.createElement("div", { className: "dsh-rl-card" },
							react.createElement("div", null,
								react.createElement("h3", { className: "dsh-rl-card-title" }, t("queueTitle")),
								react.createElement("p", { className: "dsh-rl-card-desc" }, t("queueDesc"))
							),
							react.createElement("div", { className: "dsh-rl-row" },
								react.createElement("span", { className: "dsh-rl-label" }, t("maxQueueSize")),
								react.createElement("input", {
									type: "number",
									min: 1,
									className: "dsh-rl-input",
									value: current.queue?.maxSize ?? 100,
									onChange: (e) => {
										const val = parseInt(e.target.value, 10);
										if (val > 0) updateCurrent({ queue: { ...current.queue, maxSize: val } });
									}
								})
							),
							react.createElement("div", { className: "dsh-rl-row" },
								react.createElement("span", { className: "dsh-rl-label" }, t("maxWaitMs")),
								react.createElement("input", {
									type: "number",
									min: 100,
									step: 1000,
									className: "dsh-rl-input",
									value: current.queue?.maxWaitMs ?? 300000,
									onChange: (e) => {
										const val = parseInt(e.target.value, 10);
										if (val > 0) updateCurrent({ queue: { ...current.queue, maxWaitMs: val } });
									}
								})
							),
							react.createElement("div", { className: "dsh-rl-row" },
								react.createElement("span", { className: "dsh-rl-label" }, t("auxiliaryMode")),
								react.createElement("select", {
									className: "dsh-rl-select",
									value: current.queue?.auxiliary ?? "reject",
									onChange: (e) => updateCurrent({ queue: { ...current.queue, auxiliary: e.target.value } })
								},
									react.createElement("option", { value: "reject" }, t("auxReject")),
									react.createElement("option", { value: "queue" }, t("auxQueue"))
								)
							)
						),

						// Card 4: Cooldown
						react.createElement("div", { className: "dsh-rl-card" },
							react.createElement("div", { className: "dsh-rl-card-header" },
								react.createElement("div", null,
									react.createElement("h3", { className: "dsh-rl-card-title" }, t("cooldownTitle")),
									react.createElement("p", { className: "dsh-rl-card-desc" }, t("cooldownDesc"))
								),
								react.createElement("label", { className: "dsh-rl-switch" },
									react.createElement("input", {
										type: "checkbox",
										checked: Boolean(current.cooldown),
										onChange: (e) => {
											updateCurrent({
												cooldown: e.target.checked
													? {
														codes: ["RATE_LIMIT", "SERVER"],
														statuses: [429, 529],
														initialDelayMs: 500,
														maxDelayMs: 60000,
														maxProviderDelayMs: 3600000,
														jitterRatio: 0.1
													}
													: void 0
											});
										}
									}),
									react.createElement("span", { className: "dsh-rl-label" }, t("cooldownEnable"))
								)
							),
							current.cooldown && react.createElement(react.Fragment, null,
								react.createElement("div", { className: "dsh-rl-row" },
									react.createElement("span", { className: "dsh-rl-label" }, t("statuses")),
									react.createElement("input", {
										type: "text",
										className: "dsh-rl-input",
										value: (current.cooldown.statuses || []).join(", "),
										onChange: (e) => {
											const st = e.target.value.split(",")
												.map((s) => parseInt(s.trim(), 10))
												.filter((n) => Number.isInteger(n) && n >= 100 && n <= 599);
											updateCurrent({ cooldown: { ...current.cooldown, statuses: st } });
										}
									})
								),
								react.createElement("div", { className: "dsh-rl-row" },
									react.createElement("span", { className: "dsh-rl-label" }, t("initialDelayMs")),
									react.createElement("input", {
										type: "number",
										min: 1,
										className: "dsh-rl-input",
										value: current.cooldown.initialDelayMs,
										onChange: (e) => {
											const val = parseInt(e.target.value, 10);
											if (val > 0) updateCurrent({ cooldown: { ...current.cooldown, initialDelayMs: val } });
										}
									})
								),
								react.createElement("div", { className: "dsh-rl-row" },
									react.createElement("span", { className: "dsh-rl-label" }, t("maxDelayMs")),
									react.createElement("input", {
										type: "number",
										min: 1,
										className: "dsh-rl-input",
										value: current.cooldown.maxDelayMs,
										onChange: (e) => {
											const val = parseInt(e.target.value, 10);
											if (val > 0) updateCurrent({ cooldown: { ...current.cooldown, maxDelayMs: val } });
										}
									})
								)
							)
						),

						// Card 5: Live Stats
						react.createElement("div", { className: "dsh-rl-card" },
							react.createElement("div", { className: "dsh-rl-card-header" },
								react.createElement("h3", { className: "dsh-rl-card-title" }, t("statsTitle")),
								currentStats && currentStats.cooldownRemainingMs > 0 && react.createElement("button", {
									type: "button",
									className: "dsh-rl-add-btn",
									onClick: handleResetCooldown
								}, t("resetCooldown"))
							),
							react.createElement("div", { className: "dsh-rl-stats-grid" },
								react.createElement("div", { className: "dsh-rl-stat-box" },
									react.createElement("span", { className: "dsh-rl-stat-label" }, t("activeCalls")),
									react.createElement("span", { className: "dsh-rl-stat-val" },
										(currentStats ? currentStats.active : 0) +
										(typeof current.maxConcurrentRequests === "number" ? " / " + current.maxConcurrentRequests : "")
									)
								),
								react.createElement("div", { className: "dsh-rl-stat-box" },
									react.createElement("span", { className: "dsh-rl-stat-label" }, t("inQueue")),
									react.createElement("span", { className: "dsh-rl-stat-val" },
										(currentStats ? currentStats.queued : 0) +
										" / " + (current.queue?.maxSize ?? 100)
									)
								),
								react.createElement("div", { className: "dsh-rl-stat-box" },
									react.createElement("span", { className: "dsh-rl-stat-label" }, t("requestsRemaining")),
									react.createElement("span", { className: "dsh-rl-stat-val" },
										currentStats && currentStats.requestsRemaining !== null
											? currentStats.requestsRemaining + (current.requests ? " / " + current.requests.burst : "")
											: "—"
									)
								),
								react.createElement("div", { className: "dsh-rl-stat-box" },
									react.createElement("span", { className: "dsh-rl-stat-label" }, t("cooldownStatus")),
									react.createElement("span", {
										className: "dsh-rl-stat-val",
										style: {
											fontSize: "14px",
											color: currentStats && currentStats.cooldownRemainingMs > 0 ? "#ef4444" : "#10b981"
										}
									},
										currentStats && currentStats.cooldownRemainingMs > 0
											? t("inCooldown").replace("{ms}", String(Math.ceil(currentStats.cooldownRemainingMs / 1000)))
											: t("normal")
									)
								)
							)
						),

						// Footer
						react.createElement("div", { className: "dsh-rl-footer" },
							react.createElement("button", {
								type: "button",
								className: "dsh-rl-btn-danger",
								onClick: handleRemoveProvider
							}, t("removeProvider")),
							react.createElement("div", { style: { display: "flex", alignItems: "center" } },
								statusMsg && react.createElement("span", {
									className: "dsh-rl-msg " + (statusMsg.ok ? "dsh-rl-msg-ok" : "dsh-rl-msg-err")
								}, statusMsg.text),
								react.createElement("button", {
									type: "button",
									className: "dsh-rl-btn",
									style: { marginLeft: "12px" },
									disabled: saving,
									onClick: handleSave
								}, saving ? t("saving") : t("save"))
							)
						)
					)
			);
		}

		const inject = ["slots", "locale"];

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(LOCALE_NS, dictionaries), "llm-rate-limit: copy dictionaries");
			const t = ctx.locale.bind(LOCALE_NS);

			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "llm-rate-limit",
				order: 35,
				label: () => t("nav"),
				inject: () => ({ t })
			}, RateLimitSection));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
