# Microservices Architecture - Complete Guide

## Quick Start

```bash
cd services
cp .env.example .env
# Edit .env with your credentials

# Start all services
docker-compose up

# Or start individually
cd core-api && npm run dev
cd ai-service && poetry run uvicorn app.main:app --reload
cd streaming && npm run dev
cd gateway && npm run dev
```

## Architecture

```
Extension → Gateway (:3001) → Redis → AI Service (:3003)
                ↓                ↓
         Streaming (:3002)   Core API (:3004)
```

## Services

### Gateway (:3001)
- **Role**: WebSocket + Auth orchestrator
- **Routes**: `/ws/call`, `/ws/manager`
- **Dependencies**: Redis, Supabase, Core API

### Streaming (:3002)
- **Role**: Binary media relay
- **Optimization**: Zero-copy, <50ms latency
- **Dependencies**: Redis only

### AI Service (:3003)
- **Role**: Whisper + GPT-4
- **Tech**: Python FastAPI
- **Dependencies**: Redis, OpenAI

### Core API (:3004)
- **Role**: REST + Database
- **Endpoints**: `/api/calls`, `/api/scripts`, `/api/objections`
- **Dependencies**: Redis, Supabase

## Message Flow

1. **Audio Transcription**:
   ```
   Extension → Gateway → Redis(audio:process) → AI Service
   AI Service → Redis(transcript:result) → Gateway → Extension
   ```

2. **Video Streaming**:
   ```
   Extension → Gateway → Redis(media_raw) → Streaming → Manager
   ```

3. **Manager Whisper**:
   ```
   Manager → Gateway → Redis(commands) → Gateway → Extension
   ```

## Binary Optimization

Streaming Service uses pure binary WebSocket messages (NO JSON, NO Base64):
- 40% bandwidth reduction
- <50ms relay latency
- Zero-copy buffer passing

## Performance Targets

- Gateway latency: <100ms
- AI transcription: <2s
- Video streaming: <200ms end-to-end
- Concurrent calls: 100+

## Monitoring

Health checks:
- http://localhost:3001/health (Gateway)
- http://localhost:3002/health (Streaming)  
- http://localhost:3003/health (AI)
- http://localhost:3004/health (Core API)
