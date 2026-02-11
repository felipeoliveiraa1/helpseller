# 🚀 Setup Microservices - Passo a Passo no Windows

## 1️⃣ REDIS (OBRIGATÓRIO - rodar PRIMEIRO)

### Opção A: Redis via Memurai (Windows nativo)
```powershell
# Download: https://www.memurai.com/get-memurai
# Instalar e iniciar automaticamente
```

### Opção B: Redis via WSL (Recomendado)
```powershell
# Instalar WSL se não tiver
wsl --install

# Dentro do WSL
wsl
sudo apt update
sudo apt install redis-server -y
sudo service redis-server start

# Testar
redis-cli ping
# Deve retornar: PONG
```

---

## 2️⃣ CONFIGURAR .ENV

Edite os arquivos `.env` criados com suas credenciais:

### Core API (.env)
- `SUPABASE_URL` - da dashboard Supabase
- `SUPABASE_SERVICE_KEY` - chave service_role

### Gateway (.env)  
- Mesmas credenciais Supabase
- `CORE_API_URL=http://localhost:3004`

### AI Service (.env)
- `OPENAI_API_KEY` - sua chave OpenAI

---

## 3️⃣ INSTALAR DEPENDÊNCIAS

```powershell
# Core API (já rodando)
cd services/core-api
npm install

# Gateway
cd ../gateway
npm install

# Streaming
cd ../streaming
npm install

# AI Service (precisa Python + Poetry)
cd ../ai-service
pip install poetry
poetry install
```

---

## 4️⃣ INICIAR SERVIÇOS (4 terminais separados)

### Terminal 1: Core API
```powershell
cd services/core-api
npm run dev
# → http://localhost:3004
```

### Terminal 2: Gateway (MAIS IMPORTANTE)
```powershell
cd services/gateway
npm run dev
# → http://localhost:3001
```

### Terminal 3: AI Service (OPCIONAL - para transcrição)
```powershell
cd services/ai-service
poetry run uvicorn app.main:app --reload --port 3003
# → http://localhost:3003
```

### Terminal 4: Streaming (OPCIONAL - para vídeo)
```powershell
cd services/streaming
npm run dev
# → http://localhost:3002
```

---

## 5️⃣ TESTAR

Abra no navegador:
- Gateway: http://localhost:3001/health
- Core API: http://localhost:3004/health
- AI: http://localhost:3003/health
- Streaming: http://localhost:3003/health (porta 3002+1)

---

## 🎯 ORDEM MÍNIMA PARA TESTES

Para testar básico, você SÓ precisa:
1. **Redis** ✅ (obrigatório)
2. **Core API** ✅ (port 3004)
3. **Gateway** ✅ (port 3001) - conecta extension

AI Service e Streaming são opcionais inicialmente.

---

## ❓ TROUBLESHOOTING

### Redis não conecta
```powershell
# Ver se Redis está rodando
netstat -ano | findstr :6379

# No WSL
wsl
sudo service redis-server status
sudo service redis-server start
```

### Porta em uso
```powershell
# Ver processo na porta
netstat -ano | findstr :3001

# Matar processo
taskkill /PID <número> /F
```

### Python/Poetry não encontrado
```powershell
# Instalar Python
winget install Python.Python.3.11

# Instalar Poetry
pip install poetry
```
