# 🚀 Solução MAIS RÁPIDA: Redis via Chocolatey (Windows)

## Instalar Redis Nativo Windows (1 minuto)

### Opção 1: Chocolatey (Recomendado)
```powershell
# Instalar Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Redis
choco install redis-64 -y

# Iniciar Redis
redis-server --service-start

# Testar
redis-cli ping
```

### Opção 2: Memurai (GUI)
1. Download: https://www.memurai.com/get-memurai
2. Instalar (Next → Next → Finish)
3. Inicia automaticamente

### Opção 3: WSL Ubuntu Fresh
```powershell
# Instalar Ubuntu
wsl --install Ubuntu

# Após instalação, dentro do Ubuntu:
sudo apt update
sudo apt install redis-server -y
sudo service redis-server start
redis-cli ping
```

---

## ✅ Após Redis Instalado

```powershell
# Testar
redis-cli ping  # Deve retornar PONG

# Voltar ao Core API
cd services/core-api
npm run dev  # Agora deve funcionar!
```

---

## ⚡ ALTERNATIVA EMERGENCIAL: Usar backend monolítico

Se quiser testar rapidamente SEM microserviços:

```powershell
cd backend
npm run dev  # Port 3001

# Extension já está configurada para conectar em 3001
```

O backend antigo já tem Redis integrado e funcionando.

---

**Escolha uma opção e me avise!**
