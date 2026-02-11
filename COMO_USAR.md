# 🎯 Como Usar: Monitoramento de Calls em Tempo Real

## ✅ Pré-requisitos (Você já tem!)

- ✅ Backend rodando em `http://localhost:3001`
- ✅ Dashboard rodando em `http://localhost:3000`  
- ✅ Extension build rodando

---

## 1️⃣ Carregar Extension no Chrome

### Build da Extension
```powershell
cd extension
npm run build
# Ou se já está em dev mode, ignore este passo
```

### Carregar no Chrome
1. Abra Chrome
2. Vá em `chrome://extensions/`
3. Ative "Modo do desenvolvedor" (canto superior direito)
4. Clique em "Carregar sem compactação"
5. Selecione a pasta: `e:\Projetos Cursor\closeia\extension\dist`

✅ A extensão deve aparecer com ícone na barra do Chrome

---

## 2️⃣ Iniciar uma Call (Como Vendedor)

1. **Abra uma aba** com qualquer site (ex: Google Meet, YouTube, etc.)

2. **Clique no ícone da extensão** na barra do Chrome
   - Sidebar deve abrir na direita

3. **Faça login** (se necessário)
   - Use suas credenciais Supabase

4. **Selecione um script** no dropdown

5. **Clique em "Iniciar Call"**
   - Extension captura áudio + vídeo da aba
   - Transcrição em tempo real aparece no sidebar
   - Coaching tips aparecem automaticamente

---

## 3️⃣ Acessar Call como Manager (Dashboard)

### Opção A: Dashboard Web (Já está rodando!)

1. **Abra**: http://localhost:3000

2. **Faça login** com conta de manager

3. **Ver calls ativas**:
   - Dashboard deve listar calls em andamento
   - Clique em uma call para ver detalhes

4. **Monitoramento em Tempo Real**:
   - 📹 **Video Stream**: Vê o que o vendedor vê (se implementado)
   - 💬 **Transcrição Live**: Acompanha conversa em tempo real
   - 🎤 **Whisper**: Envie dicas que só o vendedor vê

### Componente MediaStreamPlayer

Para adicionar video streaming no dashboard, use:

```tsx
import { MediaStreamPlayer } from '@/components/MediaStreamPlayer';

export default function CallMonitor({ callId, token }: Props) {
    return (
        <div>
            <h2>Call Ao Vivo</h2>
            <MediaStreamPlayer
                callId={callId}
                wsUrl="ws://localhost:3001/ws/manager"
                token={token}
            />
        </div>
    );
}
```

---

## 4️⃣ Testar Funcionalidades

### A. Transcrição em Tempo Real
1. Vendedor fala no microfone
2. Áudio → Backend → Whisper
3. Transcrição aparece:
   - Sidebar da extension
   - Dashboard do manager

### B. Coaching Automático
1. Sistema detecta objeções na fala do lead
2. GPT-4 gera dica de resposta
3. Tip aparece no sidebar do vendedor

### C. Manager Whisper
1. Manager digita mensagem no dashboard
2. Clica "Enviar Whisper"
3. Vendedor recebe notificação discreta no sidebar

### D. Video Streaming (se habilitado)
1. Manager vê vídeo da tela do vendedor
2. Latência: ~200-500ms
3. Sincronizado com transcrição

---

## 🔍 Debug / Verificação

### Verificar Backend
```powershell
# Abrir http://localhost:3001/health
# Deve retornar: {"status": "ok"}
```

### Verificar WebSocket Extension
1. F12 no Chrome (onde extension está)
2. Aba Console
3. Deve ver: `WebSocket connected`

### Verificar Dashboard
1. F12 no Dashboard
2. Console deve mostrar conexão WebSocket

### Ver Logs Backend
No terminal do backend, você deve ver:
```
🔌 Seller WS connection
✅ User authenticated: [user-id]
🎧 Audio segment received
✨ [Vendedor]: "texto transcrito"
```

---

## 📋 Estrutura de Arquivos Importantes

**Extension**:
- `extension/src/sidebar/Sidebar.tsx` - UI principal
- `extension/src/background/index.ts` - WebSocket client
- `extension/src/offscreen/index.ts` - Captura áudio/vídeo

**Backend**:
- `backend/src/infrastructure/websocket/server.ts` - WebSocket routes

**Dashboard**:
- `dashboard/src/components/MediaStreamPlayer.tsx` - Video player

---

## ⚠️ Troubleshooting

### "WebSocket connection failed"
- Backend não está rodando → `cd backend && npm run dev`
- Firewall bloqueando → Permitir Node.js

### "Sem transcrição"
- Chave OpenAI não configurada → Edite `backend/.env`
- Whisper API com erro → Verifique logs backend

### "Video não carrega"
- MediaStreamPlayer não implementado no dashboard
- Ou: permissão de captura de tela não concedida

### "Manager não vê call"
- Call não foi salva no Supabase
- Manager não tem permissão (role)

---

## 🎬 Fluxo Completo

```
1. Vendedor abre Chrome
2. Clica na extension
3. Inicia call → Backend cria registro
4. Extension captura áudio/vídeo
5. Backend transcreve com Whisper
6. Manager abre dashboard
7. Vê call ativa na lista
8. Clica para monitorar
9. Vê transcrição + vídeo em tempo real
10. Envia whisper para vendedor
11. Vendedor recebe dica discreta
12. Call termina → Métricas salvas
```

---

**Próximo passo**: Teste carregar a extension e iniciar uma call!
