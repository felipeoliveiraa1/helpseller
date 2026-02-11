from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
import redis.asyncio as redis
import os
import json
import base64
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Closeia AI Service")

# OpenAI Client
openai.api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI()

# Redis Client
redis_client = redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"),
    decode_responses=False  # Binary mode for audio
)

# ==========================================
# Models
# ==========================================

class TranscribeRequest(BaseModel):
    audio: str  # base64 encoded audio
    role: str  # 'lead' or 'seller'

class CoachRequest(BaseModel):
    transcript: list[dict]  # conversation history
    script_id: str
    objections: list[dict]  # available objections

# ==========================================
# Health Check
# ==========================================

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-service"}

# ==========================================
# Transcription
# ==========================================

@app.post("/transcribe")
async def transcribe(request: TranscribeRequest):
    """
    Transcribe audio using OpenAI Whisper
    """
    try:
        # Decode base64 audio
        audio_data = base64.b64decode(request.audio)
        
        # Create temp file (Whisper API requires file)
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name
        
        # Transcribe with Whisper
        with open(tmp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="pt"  # Portuguese
            )
        
        # Cleanup
        os.unlink(tmp_path)
        
        return {
            "text": transcript.text,
            "role": request.role
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# Coaching
# ==========================================

@app.post("/coach")
async def coach(request: CoachRequest):
    """
    Generate coaching tip using GPT-4
    """
    try:
        # Build context
        conversation = "\n".join([
            f"{msg['speaker']}: {msg['text']}" 
            for msg in request.transcript[-10:]  # Last 10 messages
        ])
        
        objections_context = "\n".join([
            f"- {obj['trigger']}: {obj['response']}"
            for obj in request.objections[:5]  # Top 5
        ])
        
        # Generate coaching
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": f"""Você é um coach de vendas experiente. 
                    
Objeções disponíveis:
{objections_context}

Analise a conversa e forneça dicas concisas e acionáveis."""
                },
                {
                    "role": "user",
                    "content": f"Conversa recente:\n{conversation}\n\nQual dica devo dar ao vendedor?"
                }
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        coaching_message = response.choices[0].message.content
        
        return {
            "message": coaching_message,
            "type": "coaching"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# Redis Queue Consumer (Background)
# ==========================================

import asyncio

async def consume_audio_queue():
    """
    Consume audio segments from Redis queue and process
    """
    pubsub = redis_client.pubsub()
    await pubsub.psubscribe("audio:process:*")
    
    print("🎧 Listening for audio processing requests...")
    
    async for message in pubsub.listen():
        if message["type"] == "pmessage":
            try:
                channel = message["channel"].decode()
                call_id = channel.split(":")[-1]
                data = json.loads(message["data"])
                
                # Transcribe
                audio_base64 = data["audio"]
                role = data["role"]
                
                # Call transcribe endpoint
                result = await transcribe(TranscribeRequest(
                    audio=audio_base64,
                    role=role
                ))
                
                # Publish result
                await redis_client.publish(
                    f"transcript:result:{call_id}",
                    json.dumps({
                        "text": result["text"],
                        "role": result["role"],
                        "timestamp": data.get("timestamp", 0)
                    })
                )
                
                print(f"✅ Transcribed for call {call_id}: {result['text'][:50]}...")
                
            except Exception as e:
                print(f"❌ Error processing audio: {e}")

@app.on_event("startup")
async def startup():
    """
    Start background queue consumer
    """
    asyncio.create_task(consume_audio_queue())
    print("🚀 AI Service started")

# ==========================================
# Run
# ==========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3003)
