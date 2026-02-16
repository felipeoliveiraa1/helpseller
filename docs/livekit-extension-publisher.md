# LiveKit Publisher na Extensão Chrome (Meet → SFU)

Este documento descreve como fazer a extensão Chrome publicar a stream de vídeo/áudio (tela do Meet) para o LiveKit, para que o dashboard (viewer) assista via WebRTC com baixa latência e estabilidade.

## Visão geral

- **Publisher**: extensão Chrome (contexto offscreen ou popup) captura a aba do Meet com `getDisplayMedia` e publica no LiveKit usando `livekit-client`.
- **Room**: uma sala por chamada — `roomName = callId`.
- **Token**: sempre obtido no backend via `POST /api/livekit/token` com `role: "publisher"`. Nunca gerar token no client.

## Pré-requisitos

- Conta LiveKit (Cloud ou self-hosted) com `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` configurados no dashboard Next.js.
- Extensão com permissões adequadas (ver Manifest abaixo).
- `getDisplayMedia` deve ser chamado em um contexto com **user gesture** ou a partir de uma **extension page** (e.g. offscreen document ou popup), não no service worker.

## 1. Dependências na extensão

No projeto da extensão (ex.: `extension/`):

```bash
npm install livekit-client
```

Ou adicione em `package.json`:

```json
"dependencies": {
  "livekit-client": "^2.9.0"
}
```

## 2. Manifest (MV3)

Permissões necessárias no `manifest.json`:

```json
{
  "manifest_version": 3,
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "https://meet.google.com/*",
    "https://your-dashboard-domain.com/*"
  ],
  "optional_permissions": [
    "tabCapture"
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

- `host_permissions`: inclua o domínio do seu dashboard para chamar `POST /api/livekit/token`.
- Para captura de tela/aba, o usuário vai escolher “Share” no prompt do `getDisplayMedia`; não é obrigatório declarar `desktopCapture` em todas as versões do Chrome, mas ter `activeTab` ajuda.

## 3. Onde rodar `getDisplayMedia` e o Room

- **Service worker**: não tem superfície de usuário; não pode chamar `getDisplayMedia` nem manter um `Room` de forma confiável.
- **Offscreen document**: ideal para manter um único documento com áudio ativo e captura de tela. Pode criar o `Room` e publicar tracks lá.
- **Popup / página de opções**: pode chamar `getDisplayMedia` com user gesture (ex.: clique) e depois passar o `MediaStream` para um offscreen document ou manter o Room no popup (menos estável se o popup fechar).

Recomendação: usar **offscreen document** para criar o Room e publicar; o popup ou content script envia mensagens para “iniciar/parar publicação” e passa o `callId` (que vira `roomName`).

## 4. Obter token (sempre no backend)

A extensão deve obter o token do seu backend (dashboard), nunca gerar JWT no client:

```typescript
// extension/offscreen/livekit-publisher.ts (exemplo)

const DASHBOARD_ORIGIN = 'https://your-dashboard-domain.com'; // ou process.env.NEXT_PUBLIC_APP_URL

async function getPublisherToken(
  roomName: string,
  identity: string,
  authToken: string // e.g. Supabase session.access_token
): Promise<string> {
  const res = await fetch(`${DASHBOARD_ORIGIN}/api/livekit/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      roomName,
      identity,
      role: 'publisher',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'Failed to get token');
  }
  const data = await res.json();
  return (data as { token: string }).token;
}
```

Se o dashboard usar cookies de sessão em vez de Bearer, use `credentials: 'include'` e omita `Authorization` (e garanta que o domínio da extensão tenha acesso ao cookie, ou use uma página do dashboard em iframe para fazer o request — depende da sua arquitetura de auth).

## 5. Conectar e publicar com `livekit-client`

Padrão recomendado (Room com adaptiveStream e dynacast para baixa latência):

```typescript
import { Room, createLocalVideoTrack, createLocalAudioTrack, Track } from 'livekit-client';

const LIVEKIT_URL = 'wss://your-project.livekit.cloud'; // ou process.env.NEXT_PUBLIC_LIVEKIT_URL

let room: Room | null = null;

export async function startPublishing(
  stream: MediaStream,
  roomName: string,
  identity: string,
  token: string
): Promise<void> {
  if (room) {
    await room.disconnect();
    room = null;
  }

  room = new Room({
    adaptiveStream: true,
    dynacast: true,
    stopLocalTrackOnUnpublish: true,
  });

  room.on('disconnected', () => {
    console.log('[LIVEKIT_PUBLISHER] Disconnected');
  });
  room.on('reconnecting', () => {
    console.log('[LIVEKIT_PUBLISHER] Reconnecting...');
  });
  room.on('reconnected', () => {
    console.log('[LIVEKIT_PUBLISHER] Reconnected');
  });

  await room.connect(LIVEKIT_URL, token);

  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();

  if (videoTracks.length > 0) {
    const videoTrack = await createLocalVideoTrack(videoTracks[0], {});
    await room.localParticipant.publishTrack(videoTrack, {
      name: 'screen',
      source: Track.Source.ScreenShare,
    });
  }
  if (audioTracks.length > 0) {
    const audioTrack = await createLocalAudioTrack(audioTracks[0], {});
    await room.localParticipant.publishTrack(audioTrack, {
      name: 'microphone',
      source: Track.Source.Microphone,
    });
  }

  console.log('[LIVEKIT_PUBLISHER] Publishing to room=', roomName);
}
```

- `roomName` e `identity` já estão embutidos no `token` gerado pelo backend.
- Para “tela” do Meet use `Track.Source.ScreenShare`; se no futuro publicar câmera, use `Track.Source.Camera`.

## 6. Reconexão e republish

Se a conexão cair:

1. Ouvir `RoomEvent.Disconnected` (e opcionalmente `Reconnecting` / `Reconnected`).
2. Obter um **novo token** do backend (mesmo `roomName` e `identity`).
3. Chamar `room.connect(LIVEKIT_URL, newToken)` (ou criar um novo `Room`, conectar e publicar de novo os tracks locais).

Não reutilize o mesmo token após expiração; sempre busque um novo no servidor.

## 7. Fluxo resumido na extensão

1. Usuário inicia a “live” no Meet (ex.: botão na UI da extensão).
2. Content script ou popup pede ao offscreen document para iniciar a captura.
3. Offscreen document chama `getDisplayMedia({ video: true, audio: true })` (ou apenas vídeo, conforme necessidade).
4. Extensão obtém `callId` (da sua lógica de negócio) e define `roomName = callId`.
5. Extensão obtém token publisher via `POST /api/livekit/token` (com auth do usuário).
6. Offscreen document cria `Room`, conecta com `room.connect(LIVEKIT_URL, token)` e publica os tracks do `MediaStream` (createLocalVideoTrack / createLocalAudioTrack + publishTrack).
7. Ao encerrar a chamada ou parar a live, desconectar o room e parar os tracks: `room.disconnect()`, e parar as tracks do stream.

## 8. Considerações de segurança

- **Nunca** coloque `LIVEKIT_API_KEY` ou `LIVEKIT_API_SECRET` na extensão. Só no backend (Next.js).
- Use sempre HTTPS/WSS em produção.
- Valide no backend que o usuário autenticado tem permissão para publicar naquele `roomName` (ex.: é o vendedor da chamada correspondente ao `callId`).

## 9. Referências

- [LiveKit – Connect](https://docs.livekit.io/home/client/connect/)
- [LiveKit – Publish tracks](https://docs.livekit.io/home/client/tracks/publish/)
- [LiveKit – Tokens](https://docs.livekit.io/frontends/authentication/tokens/)
- [livekit-client npm](https://www.npmjs.com/package/livekit-client)
