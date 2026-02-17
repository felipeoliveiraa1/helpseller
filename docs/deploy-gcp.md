# Como subir o projeto no GCP

Este guia cobre o **backend (Fastify)** no **Google Cloud Run**. O dashboard (Next.js) normalmente sobe na Vercel; ver `docs/deploy.md`.

---

## Pré-requisitos

- Conta no [Google Cloud](https://console.cloud.google.com)
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) instalado e logado (`gcloud auth login`)
- Projeto GCP criado (`gcloud projects create SEU_PROJECT_ID` ou use um existente)

---

## Opção A: Deploy direto do código (recomendado)

O Cloud Run faz o build da imagem a partir do `Dockerfile` no repositório. Não precisa rodar Docker na sua máquina.

### 1. Ativar APIs e configurar projeto

```bash
# Troque SEU_PROJECT_ID pelo ID do seu projeto
export PROJECT_ID=SEU_PROJECT_ID
gcloud config set project $PROJECT_ID

# Ativar APIs necessárias
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Criar repositório no Artifact Registry (para a imagem Docker)

```bash
gcloud artifacts repositories create closeia \
  --repository-format=docker \
  --location=us-central1 \
  --description="CloseIA backend"
```

### 3. Deploy do backend a partir da pasta do projeto

Na **raiz do repositório** (onde está a pasta `backend/`):

```bash
# Na raiz do repo CLOSEIA (não dentro de backend/)
gcloud run deploy closeia-backend \
  --source=./backend \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PORT=8080" \
  --set-env-vars="CORS_ORIGIN=https://seu-dashboard.vercel.app,chrome-extension://" \
  --set-env-vars="SUPABASE_URL=SUA_SUPABASE_URL,SUPABASE_ANON_KEY=SUA_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY" \
  --set-env-vars="REDIS_URL=redis://SEU_REDIS_URL" \
  --set-env-vars="OPENAI_API_KEY=SUA_OPENAI_KEY" \
  --set-env-vars="STRIPE_SECRET_KEY=SUA_STRIPE_KEY,STRIPE_WEBHOOK_SECRET=SUA_STRIPE_WEBHOOK"
```

Troque todos os valores `SUA_*` e `SEU_*` pelas variáveis reais. Se preferir não expor secrets na linha de comando, use **Secret Manager** (veja seção "Variáveis sensíveis" abaixo).

Ao finalizar, o Cloud Run mostra a **URL do serviço**, por exemplo:  
`https://closeia-backend-xxxxx-uc.a.run.app`

### 4. Variáveis sensíveis (opcional): Secret Manager

Crie os secrets e referencie no deploy:

```bash
# Exemplo: criar secret para SUPABASE_SERVICE_ROLE_KEY
echo -n "sua-chave-aqui" | gcloud secrets create supabase-service-role-key --data-file=-

# No deploy, use:
# --set-secrets="SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest"
```

No `gcloud run deploy`, substitua `--set-env-vars="...,SUPABASE_SERVICE_ROLE_KEY=..."` por:

```bash
--set-secrets="SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest"
```

(Repita para cada variável que quiser em Secret Manager.)

---

## Opção B: Build local com Docker e deploy da imagem

Use se quiser buildar a imagem na sua máquina e só fazer push para o GCP.

### 1. Configurar Docker para o Artifact Registry

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### 2. Build e push da imagem

```bash
cd backend

# Troque SEU_PROJECT_ID pelo ID do seu projeto
export PROJECT_ID=SEU_PROJECT_ID
export IMAGE=us-central1-docker.pkg.dev/${PROJECT_ID}/closeia/backend:latest

docker build -t $IMAGE .
docker push $IMAGE
```

### 3. Deploy da imagem no Cloud Run

```bash
gcloud run deploy closeia-backend \
  --image=$IMAGE \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PORT=8080,CORS_ORIGIN=...,SUPABASE_URL=...,SUPABASE_ANON_KEY=...,SUPABASE_SERVICE_ROLE_KEY=...,REDIS_URL=...,OPENAI_API_KEY=...,STRIPE_SECRET_KEY=...,STRIPE_WEBHOOK_SECRET=..."
```

(Preencha todas as env vars obrigatórias do backend; veja lista abaixo.)

---

## Variáveis de ambiente obrigatórias do backend

O backend valida estas variáveis ao iniciar (`backend/src/shared/config/env.ts`):

| Variável | Exemplo / descrição |
|----------|----------------------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` (Cloud Run define automaticamente) |
| `CORS_ORIGIN` | URL do dashboard + `chrome-extension://` (ex.: `https://seu-app.vercel.app,chrome-extension://`) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role do Supabase |
| `REDIS_URL` | Ex.: `redis://10.x.x.x:6379` (Memorystore) ou `rediss://...` (Upstash) |
| `OPENAI_API_KEY` | Chave da OpenAI |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret do webhook Stripe |

Se alguma faltar, o processo sobe mas o backend encerra com erro ao iniciar.

---

## Redis no GCP

O backend usa Redis. Opções:

1. **Memorystore for Redis** (GCP): criar instância na VPC e usar o IP interno em `REDIS_URL` (ex.: `redis://10.x.x.x:6379`). O Cloud Run precisa estar na mesma VPC (VPC connector) para acessar.
2. **Upstash** (Redis em nuvem): criar instância e usar a URL HTTPS/Redis que eles fornecem em `REDIS_URL`. Não exige VPC.

Para testes rápidos, Upstash costuma ser mais simples (sem VPC).

---

## Depois do deploy

1. Anote a **URL do serviço** (ex.: `https://closeia-backend-xxxxx-uc.a.run.app`).
2. No **dashboard (Vercel)**, defina `NEXT_PUBLIC_API_URL` = essa URL.
3. Ajuste a URL do WebSocket na live para usar essa mesma base em **wss** (ex.: `wss://closeia-backend-xxxxx-uc.a.run.app/ws/manager`).
4. Na **extension**, configure a URL do backend para essa URL em produção.

---

## Resumo dos comandos (Opção A)

```bash
export PROJECT_ID=seu-projeto-id
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
gcloud artifacts repositories create closeia --repository-format=docker --location=us-central1

# Na raiz do repo (onde está a pasta backend/)
gcloud run deploy closeia-backend \
  --source=./backend \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PORT=8080,CORS_ORIGIN=https://seu-app.vercel.app,chrome-extension://,SUPABASE_URL=...,SUPABASE_ANON_KEY=...,SUPABASE_SERVICE_ROLE_KEY=...,REDIS_URL=...,OPENAI_API_KEY=...,STRIPE_SECRET_KEY=...,STRIPE_WEBHOOK_SECRET=..."
```

Substitua os `...` pelas suas chaves e URLs. Depois disso, o projeto estará no GCP (backend no Cloud Run).
