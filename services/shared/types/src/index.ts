// Shared types for all microservices

export interface Call {
    id: string;
    user_id: string;
    organization_id: string;
    script_id: string;
    platform: string;
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
    started_at: string;
    ended_at?: string;
}

export interface Script {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
}

export interface Objection {
    id: string;
    script_id: string;
    trigger: string;
    response: string;
    category?: string;
    success_rate?: number;
}

export interface Profile {
    id: string;
    organization_id: string;
    email?: string;
    full_name?: string;
}

// WebSocket Events
export interface WSEvent<T = any> {
    type: string;
    payload?: T;
}

export interface CallStartPayload {
    scriptId: string;
    platform: string;
}

export interface AudioSegmentPayload {
    audio: string; // base64
    size: number;
    role: 'lead' | 'seller';
}

export interface MediaStreamPayload {
    chunk: string; // base64
    size: number;
    timestamp: number;
}

export interface TranscriptChunkPayload {
    text: string;
    isFinal: boolean;
    speaker: string;
    role: 'lead' | 'seller';
}

export interface CoachMessagePayload {
    message: string;
    type?: string;
    metadata?: any;
}

export interface WhisperPayload {
    content: string;
    urgency: 'normal' | 'high' | 'urgent';
    source: 'manager' | 'ai';
    timestamp: number;
}

// Redis Messages
export interface RedisTranscriptMessage {
    callId: string;
    text: string;
    speaker: string;
    role: 'lead' | 'seller';
    timestamp: number;
}

export interface RedisCoachingMessage {
    callId: string;
    message: string;
    type: string;
    metadata?: any;
}

// API Request/Response Types
export interface CreateCallRequest {
    userId: string;
    organizationId: string;
    scriptId: string;
    platform: string;
}

export interface CreateCallResponse {
    call: Call;
}

export interface EndCallRequest {
    callId: string;
}

export interface GetScriptObjectionsResponse {
    objections: Objection[];
}

export interface RecordSuccessRequest {
    objectionId: string;
    callId: string;
    converted: boolean;
}
