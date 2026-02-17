# Deploy: Vercel (Front) + GCP (Backend) + Extension

Visão geral do que sobe onde e o que configurar.

---

## 1. Frontend (Dashboard) → **Vercel**

- **O que sobe:** pasta `dashboard` (Next.js).
- **Pronto:** Next.js é detectado automaticamente pela Vercel; `build` e `start` já existem no `package.json`.

**Passos:**

1. Conectar o repositório à Vercel e escolher a **root** do projeto.
2. Definir **Root Directory**: `dashboard`.
3. Configurar variáveis de ambiente na Vercel (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (para webhook Pagar.me e outras rotas server-side)
   - `NEXT_PUBLIC_API_URL` = URL do backend no GCP (ex.: `https://seu-backend-xxx.run.app`)
   - Pagar.me: `PAGARME_SECRET_KEY`, `PAGARME_BASE_URL`
   - LiveKit (se usar): `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`

**Ajuste para produção:** Em `dashboard/src/app/(dashboard)/live/page.tsx` a URL do WebSocket está fixa em `ws://localhost:3001/ws/manager`. Trocar para usar a URL do backend em produção, por exemplo derivar de `NEXT_PUBLIC_API_URL` (ex.: `wss://seu-backend.run.app/ws/manager`).

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

**Produção:** A extension hoje usa URLs fixas (`localhost:3000`, `localhost:3001`). Para produção:

- Definir no build da extension (ex.: variáveis de ambiente Vite `VITE_DASHBOARD_URL`, `VITE_API_URL`) a URL do dashboard (Vercel) e a URL do backend (Cloud Run).
- Atualizar `extension/manifest.json` em `host_permissions` para incluir o domínio do dashboard em produção (ex.: `https://seu-app.vercel.app/*`).
- Trocar no código da extension todas as referências a `localhost:3001` e `localhost:3000` por essas variáveis (ou por um config que mude conforme dev/prod).

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
