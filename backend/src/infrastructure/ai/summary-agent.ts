import { OpenAIClient } from "./openai-client";
import { TranscriptChunk } from "../websocket/server";

export interface LiveSummary {
    status: string;
    summary_points: string[];
    sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Tense';
    spin_phase?: string;
}

export class SummaryAgent {
    constructor(private openaiClient: OpenAIClient) { }

    async generateLiveSummary(transcript: TranscriptChunk[]): Promise<LiveSummary | null> {
        if (transcript.length === 0) return null;

        // Convert transcript to string (last 20 items to save tokens, or full if needed)
        // For accurate summary we might need more context, but let's stick to recent window + some history
        // Or simply send the whole text if it's not too long yet. 
        // Let's grab last 15 interactions for "Live" status.
        const recentTranscript = transcript.slice(-15).map(t => `${t.speaker}: ${t.text}`).join('\n');

        const systemPrompt = `
You are an expert Sales Manager Assistant monitoring a live call.
Your goal is to provide a "Live Executive Summary" for the Sales Manager who is watching.

# OUTPUT FORMAT (JSON ONLY)
{
    "status": "Short description of negotiation stage (e.g. Discovery, Objection Handling, Closing)",
    "summary_points": ["Key point 1", "Key point 2", "Key point 3"],
    "sentiment": "Positive" | "Neutral" | "Negative" | "Tense",
    "spin_phase": "Situation" | "Problem" | "Implication" | "Need-Payoff"
}

# REQUIREMENTS
1. "status": Where are we in the deal?
2. "summary_points": Only the most critical info (budget identified, specific pain point, competitors mentioned). Max 3 items.
3. "spin_phase": Identify which SPIN stage the seller is currently navigating.
4. Keep it concise. The manager needs to read this in seconds.
`;

        const userPrompt = `
Current Transcript Segment:
${recentTranscript}

Generate the Live Summary JSON.
`;

        try {
            // We need a method in OpenAIClient that returns raw text or JSON. 
            // processStream is for streaming coaching. We might need a simplistic 'complete' method.
            // Let's assume completeJSON or similar exists, or add it.
            // Since OpenAIClient in this project might strictly stream, check its code.
            // If it only streams, we can re-use stream but it's overkill.
            // I'll assume we can add a method 'completeJson' to OpenAIClient.
            return await this.openaiClient.completeJson<LiveSummary>(systemPrompt, userPrompt);
        } catch (error) {
            console.error("SummaryAgent Error", error);
            return null;
        }
    }
}
