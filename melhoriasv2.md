Diagnóstico Completo — Helpseller (v2)

BACKEND
Arquitetura e Estrutura — 7/10
✅ Bom: Fastify + camadas (interfaces/infrastructure/application/shared), config centralizado com Zod, logger Pino, fallback Redis→Memory, fallback Deepgram→Whisper. ⚠️ Problemas: Supabase acessado diretamente nas rotas (sem repositório), websocket/server.ts com ~1.830 linhas (monolito), serviços de IA sem singleton consistente, nenhuma camada de application real além de call-reprocessing.
Qualidade TypeScript — 5/10
✅ Bom: async/await correto, error handling estruturado, interfaces CallSession e TranscriptChunk bem definidas. ⚠️ Problemas: Uso frequente de as any (routes/index.ts:58, plan-guard.ts:27, admin.ts:147), funções sem tipo de retorno explícito, magic strings ("gpt-4.1-mini", "CONVERTED", "LOST"), unsafe casting em vez de type guards.
Rotas HTTP — 6/10 (+1 vs. anterior)
✅ Melhorias: Rate limiting adicionado (100 req/min em server.ts), plan-guard middleware aplicado nas rotas. ⚠️ Problemas restantes: N+1 query ainda presente em /scripts/:id/objections, Zod validation ausente na maioria dos endpoints POST/PUT, PDF parse sem try/catch em coaches.ts, timeout ausente no reprocessamento de análise.
Serviços de IA — 5/10 (-2 vs. anterior)
🔴 CRÍTICO: Modelo gpt-4.1-mini não existe na API da OpenAI — todas as chamadas de coaching e análise falham em produção. O correto é gpt-4o-mini. Verificado em env.ts:24 e openai-client.ts:17. 🔴 CRÍTICO: Pricing em usage-tracker.ts referencia gpt-4.1-mini e gpt-4.1-nano (inexistentes) — custo calculado incorretamente. ⚠️ Outros: JSON.parse() sem try/catch em post-call-analyzer.ts:234, prompt de 11KB na análise pós-chamada (custo alto), coach-engine.ts monta system prompt com input do usuário sem sanitização (risco de prompt injection).
WebSocket Server — 5/10
✅ Bom: Deduplicação sofisticada, broadcast via Redis pub/sub, fallback Deepgram↔Whisper, manager whisper support. 🔴 Crítico: managerSocketsByCallId (linha 30) cresce indefinidamente se manager desconecta após fim da chamada (memory leak). commandHandler em setupCommandSubscription não limpa handlers antigos se chamado duas vezes. Estado Redis e in-memory pode divergir. Arquivo de 1.830 linhas dificulta manutenção.
Billing/Planos — 7/10 (+1 vs. anterior)
✅ Melhoria: plan-guard.ts middleware agora valida plano no backend antes de processar requisições. 🔴 Crítico: plan-limits.ts:259-265 retorna allowed: true em caso de erro de query — usuário pode ultrapassar limite silenciosamente. ⚠️ Problemas: Definições de plano em três lugares diferentes (plan-limits.ts, plan-guard.ts hardcoded, migration 011) — divergência inevitável. checkCallHoursLimit() faz N+1 buscando todos os calls do mês em vez de agregar no SQL.
Configuração e Segurança — 5/10 (+1 vs. anterior)
✅ Melhoria: CORS melhorado, plan-guard adicionado. 🔴 Crítico: Em produção, servidor inicia mesmo sem credentials OpenAI/Deepgram (só logger.warn, não lança erro) — sistema opera degradado silenciosamente. Sem verificação de org_id entre token JWT e body da requisição. ⚠️ Problemas: CORS_ORIGIN="*" como default, sem rate limiting diferenciado por endpoint sensível, upload de PDF sem validação de conteúdo (apenas mimetype).
Migrations SQL — 7/10 (+2 vs. anterior)
✅ Melhorias: Conflito 008 resolvido (renomeados para 008a e 008b). Migration 013 adiciona RLS nas tabelas de billing. ⚠️ Problemas restantes: Ausência de índices em calls.organization_id, calls.user_id, call_summaries.call_id — full table scan em toda query de listagem. Política RLS em 013_rls_billing_tables.sql linha 7 usa true (overly permissive para service role). Dados de plano definidos tanto em código quanto em migration (011) — source of truth duplicado.
Testes — 1/10
🔴 Crítico: Zero testes. "test": "echo \"Error: no test specified\"". Sem ESLint/Prettier. Áreas críticas sem cobertura: billing limits, deduplicação de transcrição, checkout flow.

FRONTEND (Dashboard Next.js)
Arquitetura e Estrutura — 8/10
✅ Bom: App Router bem organizado com route groups (auth) e (dashboard), separação clara de libs, componentes e pages, TypeScript full-stack, Radix-UI + Tailwind consistente. ⚠️ Problemas: dashboard/page.tsx com 1.009 linhas (componente monolito), falta de error boundaries ao redor de seções críticas.
Autenticação — 7/10 (+1 vs. anterior)
✅ Melhoria: middleware.ts reativado com proteção server-side usando @supabase/ssr. Lista de rotas públicas configurada. ⚠️ Problemas: Rota /coaches não está na lista de rotas públicas mas aparece na sidebar sem feature gate explícito. Sem logging no catch do middleware (erros silenciosos). Sem 2FA, sem verificação de email duplicado no cadastro.
Dashboard e Pages — 6/10
✅ Bom: Gráficos SVG customizados com animações, suporte a roles SELLER/MANAGER, KPI de uso de horas. 🔴 Crítico: Race condition em dashboard/page.tsx — múltiplos Promise.all sem error handling individual (linha 206-259). topPerfData[0].data pode ser undefined (crash). Type casting inseguro (recentRes.data as unknown[]) sem validação de estrutura. Número de telefone hardcoded em billing/page.tsx:94.
Componentes — 7/10 (+1 vs. anterior)
✅ Melhoria: feature-gate.tsx com PlanProvider + Context API, usePlanLimits() bem implementado, dashboard-content-guard.tsx validando acesso. ⚠️ Problemas: feature-gate.tsx:56 refaz fetch de /api/billing/limits a cada mount sem debounce/cache. dashboard-content-guard.tsx:116 não valida se organizationPlan é um PlanSlug válido. Strings em português hardcoded (sem i18n). Definição de planos duplicada em paywall-screen.tsx vs billing/page.tsx.
API Routes — 7/10 (+2 vs. anterior)
✅ Melhorias: Checkout cria order no BD ANTES de redirecionar para Stripe. Webhook com verificação de assinatura e deduplicação. Portal de billing bem implementado. ⚠️ Problemas: verify-session com lógica inconsistente (linhas 71-73, dois campos diferentes para resolver plano). Sem caching em /api/billing/limits (refetch a cada request). Non-null assertion organizationId! em webhook sem check adequado.
Libs e Utilitários — 5/10
⚠️ Problemas: api.ts cria novo Supabase client a cada requisição (deveria ser singleton), .catch(() => {}) em 5 lugares silenciando erros silenciosamente, sem timeout em fetch, sem retry logic. recharts importado mas não utilizado (SVG customizado).
Qualidade TypeScript — 5/10
⚠️ Problemas: (profile as any)?.role generalizado, (recentRes.data as unknown[]), sem discriminated unions, tipos do Supabase não gerados (supabase gen types). tsconfig sem noUncheckedIndexedAccess nem noImplicitReturns.
UX/UI e Acessibilidade — 7/10
✅ Bom: Design system consistente (neon pink + dark mode), mobile responsive, Material Icons + Lucide, estados de loading. ⚠️ Problemas: Cores como único indicador de limite de plano (problema para daltônicos), focus indicators fracos, sem ARIA labels em elementos interativos, sem lazy loading nas seções do dashboard.
Testes — 1/10
🔴 Crítico: Zero testes de frontend. Sem jest/vitest nem @testing-library.

EXTENSÃO CHROME
Estrutura e MV3 Compliance — 7/10
✅ Bom: Service Worker com "type": "module", permissões corretamente scoped, ícones em múltiplas resoluções, sem eval(). ⚠️ Problemas: localhost:3000 ainda em host_permissions (deve ser removido em produção), web_accessible_resources com padrão <all_urls> muito amplo, sem CSP declarado no manifest.
Captura de Áudio — 6/10 (-1 vs. anterior)
🔴 Crítico: Video track abandonado do combinedStream (offscreen/index.ts:418) — nunca é parado, consome recursos indefinidamente. fullCallChunks: Blob[] sem limite de tamanho — em chamada de 30min pode exceder 100MB de memória. ⚠️ Problemas: Múltiplos AudioContext (até 4) sem garantia de fechamento se stopTranscription() falhar. startRecorderCycle() cria novo MediaRecorder a cada 5s sem parar o anterior explicitamente.
Background Service Worker — 5/10
✅ Bom: Retry com backoff exponencial (10 tentativas), message queue para offline resilience, coordenação offscreen. 🔴 Crítico: cachedObjections (linha 33) cresce indefinidamente — sem limite nem limpeza ao fim da chamada. callStartRetryIntervalId pode vazar em alguns caminhos de erro. Estado global (currentLeadName, micIsMuted, lastCallStartParams) não isolado por chamada.
Autenticação na Extensão — 7/10 (+3 vs. anterior)
✅ Melhorias: Token agora enviado na primeira mensagem WebSocket ({type: 'auth', payload: {token}}), não mais na URL. Tokens migrados para chrome.storage.session (limpos ao fechar o browser). ⚠️ Problemas restantes: Race condition em getFreshToken() — duas chamadas concorrentes podem fazer double-refresh. Sem mutex para proteger o refresh. Mic permission listener em SimpleSidebar não é removido no unmount (memory leak).
WebSocket da Extensão — 6/10
✅ Bom: Reconnection com backoff, message queue para offline. ⚠️ Problemas: messageQueue sem tamanho máximo — memory exhaustion em conexão perdida longa. onPlanRequired pode disparar duas vezes (mensagem + código 4403). Sem jitter no backoff — thundering herd se muitos clientes reconectam simultaneamente.

INTEGRAÇÕES
Stripe — 8/10 (+1 vs. anterior)
✅ Melhorias: Order criada no BD antes do redirect Stripe. Verificação de assinatura no webhook. Deduplicação idempotente. Portal de billing funcionando. Trial period configurado. ⚠️ Problemas: verify-session com dois campos conflitantes para resolver plano (plan_id vs plan_slug). Non-null assertion sem check.
Deepgram — 7/10
✅ Bom: Modelo nova-2 em pt-BR, Opus encoding, interim results, keepalive a cada 3s, silence detection, utterance end, backoff exponencial. ⚠️ Problemas: Token não renovado automaticamente (chamadas >1h podem expirar), MAX_RECONNECT_ATTEMPTS=3 pode ser insuficiente para instabilidades de rede.
OpenAI — 3/10 (-3 vs. anterior)
🔴 CRÍTICO: Modelo padrão gpt-4.1-mini não existe na API da OpenAI. Todas as chamadas de coaching em tempo real e análise pós-chamada falham com "model not found". Pricing table em usage-tracker.ts também referencia modelos inexistentes, tornando o custo calculado inválido. ✅ Bom: Streaming implementado, timeout de 60s configurado, usage tracking estruturado. ⚠️ Fix: Alterar OPENAI_MODEL default para gpt-4o-mini em env.ts:24 e atualizar usage-tracker.ts com pricing real.
Supabase — 7/10 (+1 vs. anterior)
✅ Melhorias: Migrations 008 renomeadas (sem conflito), RLS adicionado em tabelas de billing (migration 013), client/server separation com SSR. ⚠️ Problemas: Índices ausentes em colunas críticas (calls.organization_id, calls.user_id). Tipos TypeScript não gerados. ai_usage_logs pode não ter RLS configurado.
LiveKit — 5/10
✅ Bom: Adaptive stream, dynacast, publicação de screen share, token via Authorization header. ⚠️ Problemas: Token sem refresh automático (desconecta após ~1h de chamada), sem tratamento de desconexão de gerente (seller continua enviando stream desnecessariamente).
Redis — 5/10
⚠️ Problemas: Fallback in-memory usa arquivo redis-dump.json no diretório atual — em Cloud Run (ephemeral filesystem) este arquivo é perdido a cada restart. Pub/sub in-memory não funciona entre múltiplas instâncias. TTL timers ok.
CI/CD (GitHub Actions) — 4/10
🔴 Crítico: Deploy vai direto para produção sem nenhum teste automatizado. Trigger em paths: '**' — mudança em qualquer arquivo (docs, README) dispara deploy completo. ✅ Bom: Secrets no GitHub Actions variables (não hardcoded no workflow).

