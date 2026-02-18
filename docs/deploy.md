# Deploy: Vercel (Front) + GCP (Backend) + Extension

Visão geral do que sobe onde e o que configurar.

---

## 1. Frontend (Dashboard) → **Vercel**

- **O que sobe:** pasta `dashboard` (Next.js).
- **Pronto:** Next.js é detectado automaticamente pela Vercel; `build` e `start` já existem no `package.json`.

**Passos:**

1. Conectar o repositório à Vercel e escolher a **root** do projeto.
2. **Importante:** Definir **Root Directory** = `dashboard`.  
   Se não definir, o Vercel faz o build na raiz do repo (onde não há Next.js) e o site retorna **404 NOT_FOUND**.  
   Onde: **Vercel Dashboard** → seu projeto **helpseller** → **Settings** → **General** → **Root Directory** → clique em **Edit** → digite `dashboard` → **Save**. Depois faça **Redeploy** (Deployments → ⋮ no último deploy → Redeploy).
3. Configurar variáveis de ambiente na Vercel (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (para webhook Pagar.me e outras rotas server-side)
   - `NEXT_PUBLIC_API_URL` = URL do backend no GCP (ex.: `https://seu-backend-xxx.run.app`)
   - Pagar.me: `PAGARME_SECRET_KEY`, `PAGARME_BASE_URL`
   - LiveKit (se usar): `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`

**Ajuste para produção:** Em `dashboard/src/app/(dashboard)/live/page.tsx` a URL do WebSocket está fixa em `ws://localhost:3001/ws/manager`. Trocar para usar a URL do backend em produção, por exemplo derivar de `NEXT_PUBLIC_API_URL` (ex.: `wss://seu-backend.run.app/ws/manager`).

### Se `/` ou `/landing` retornam 404 na Vercel (build OK, produção 404)

1. **Root Directory**  
   **Settings** → **General** → **Root Directory** = `dashboard` (sem barra no final).

2. **Framework Preset e Output Directory**  
   **Settings** → **Build & Development** (ou **General**):
   - **Framework Preset** deve ser **Next.js**. Se estiver "Other" ou outro valor, a Vercel pode não processar o output do Next e servir 404.
   - **Output Directory**: deixe **vazio** (não preencha). Next.js usa `.next` e a Vercel espera o output padrão do framework. Se estiver preenchido (ex.: `out` ou `.next`), pode causar 404.

3. **Redeploy com cache limpo**  
   **Deployments** → ⋮ no último deploy → **Redeploy** → marque **Clear build cache and redeploy**.

4. **Testar outras rotas**  
   Teste `https://seu-app.vercel.app/login`. Se `/login` também der 404, o app inteiro não está sendo servido (confirme Framework Preset e Output Directory).

5. **Se ainda 404 com Next.js 16: downgrade para Next.js 15**  
   O dashboard foi configurado para usar **Next.js 15** (em vez de 16) para máxima compatibilidade com a Vercel. O build na Vercel usa Webpack (padrão no Next 15) e evita problemas conhecidos do Next 16 (Turbopack / proxy). Faça **push** do código atual e **Redeploy** na Vercel.

6. **Framework Preset = Next.js (causa mais comum de 404)**  
   A Vercel confirma: se o preset não for Next.js, o site pode dar 404 mesmo com build OK ([comunidade](https://community.vercel.com/t/deployed-next-js-site-shows-404-despite-successful-build/10600)).
   - Abra **Settings** → **Build and Deployment** (ou **Build & Development**).
   - Em **Framework Preset** (ou **Framework Settings**), selecione **Next.js** (não "Other").
   - **Output Directory**: deixe vazio.
   - Salve e faça **Redeploy** (com "Clear build cache and redeploy").
   Se ainda der 404, crie um **novo projeto** na Vercel: importe o mesmo repo, Root Directory = `dashboard`, e na hora de configurar escolha Framework **Next.js**. Se o novo projeto abrir normal, o projeto antigo tem alguma configuração travada; você pode passar a usar o novo e desligar o antigo.

---

## 2. Backend (Fastify) → **GCP (Cloud Run)**

- **O que sobe:** pasta `backend` (API + WebSocket).
- **Pronto:** Foi adicionado `backend/Dockerfile` e `backend/.dockerignore` para container.

**Passos (Cloud Run):**

1. **Build da imagem** (no seu máquina ou no Cloud Build):
   ```bash
   cd backend
   docker build -t gcr.io/SEU_PROJECT_ID/closeia-backend .
   docker push gcr.io/SEU_PROJECT_ID/closeia-backend
   ```
   Ou usar Cloud Build: conectar o repo e configurar build a partir do `Dockerfile` em `backend/`.

2. **Criar serviço no Cloud Run** usando essa imagem. Definir **PORT=8080** (já usado no Dockerfile).

3. **Variáveis de ambiente** no Cloud Run (ou Secret Manager):
   - `NODE_ENV=production`
   - `PORT=8080` (Cloud Run define automaticamente)
   - `CORS_ORIGIN` = URL do dashboard na Vercel + `chrome-extension://` (ex.: `https://seu-app.vercel.app,chrome-extension://`)
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL` (ex.: Redis no Memorystore ou Upstash)
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

4. **Redis:** Se o backend usa Redis, provisionar (Memorystore, Upstash, etc.) e colocar `REDIS_URL` no Cloud Run.

5. **WebSocket:** Cloud Run suporta WebSocket; não é necessário config extra.

---

## 3. Extension (Chrome) → **não sobe na GCP**

- A **Extension** roda no navegador do usuário. Ela **não é deployada na GCP**.
- Você faz o **build** da extension e depois:
  - **Publicar na Chrome Web Store**, ou
  - **Carregar como “unpacked”** (só para testes).

**Build:**

```bash
cd extension
npm ci
npm run build
```

O resultado fica em `extension/dist/` (ou o output configurado no Vite). Para publicar na Chrome Web Store, envie o conteúdo desse build (geralmente em zip).

**Produção:** A extension usa `extension/src/config/env.ts`, que lê `VITE_API_URL` e `VITE_DASHBOARD_URL` (default: localhost). Para produção:

1. Na pasta `extension`, crie ou edite `.env` (veja `extension/.env.example`):
   - `VITE_API_URL` = URL do backend no Cloud Run (ex.: `https://helpseller-backend-xxx-ew.a.run.app`)
   - `VITE_DASHBOARD_URL` = URL do dashboard na Vercel (ex.: `https://seu-app.vercel.app`)
2. Dê build de novo: `npm run build`. O output em `extension/dist/` já usa essas URLs.
3. O `manifest.json` já inclui `https://*.vercel.app/*` em `host_permissions` para o dashboard na Vercel.
4. Para publicar: envie o conteúdo de `extension/dist/` (zip) à Chrome Web Store ou carregue como “unpacked” em `chrome://extensions` para teste.

---

## Resumo

| Parte      | Onde sobe      | Pronto? | O que fazer |
|-----------|----------------|---------|-------------|
| **Front** | Vercel         | Sim     | Root = `dashboard`, configurar env e corrigir URL do WebSocket em produção. |
| **Backend** | GCP Cloud Run | Sim*    | Usar o `Dockerfile` em `backend/`, configurar env e Redis. |
| **Extension** | Chrome Web Store / unpacked | Build sim | Build + configurar URLs de produção (dashboard + backend) e `host_permissions`. |

\* Backend pronto no sentido de ter Dockerfile e poder rodar em Cloud Run; falta você criar o projeto no GCP, configurar Redis e env.

---

## Ordem sugerida

1. Subir o **backend** no Cloud Run e obter a URL.
2. Subir o **dashboard** na Vercel com `NEXT_PUBLIC_API_URL` apontando para essa URL e corrigir a URL do WebSocket na live.
3. Ajustar a **extension** para usar as URLs de produção, dar build e publicar (ou carregar unpacked para teste).
