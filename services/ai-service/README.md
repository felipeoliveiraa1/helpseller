# AI Service

FastAPI service for Whisper transcription and GPT-4 coaching.

## Features

- **Whisper Transcription**: Process audio segments
- **GPT-4 Coaching**: Generate contextual tips
- **Redis Queue Consumer**: Async processing

## Endpoints

- `POST /transcribe` - Transcribe audio
- `POST /coach` - Generate coaching
- `GET /health` - Health check

## Development

```bash
poetry install
poetry run uvicorn app.main:app --reload --port 3003
```
