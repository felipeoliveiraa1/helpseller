import { CallSession } from "../websocket/server.js";
import { OpenAIClient } from "./openai-client";

export class PostCallAnalyzer {
    constructor(private openaiClient: OpenAIClient) { }

    async generate(session: CallSession, scriptName: string, steps: string[]) {
        const systemPrompt = `Você é um analista de vendas. Analise a transcrição completa da call e gere um relatório JSON com:
{
  "script_adherence_score": number (0-100),
  "strengths": ["pontos fortes do vendedor"],
  "improvements": ["pontos a melhorar"],
  "objections_faced": [{ "objection": "texto", "handled": boolean, "response": "como respondeu" }],
  "buying_signals": ["sinais detectados"],
  "lead_sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED",
  "result": "CONVERTED" | "FOLLOW_UP" | "LOST" | "UNKNOWN",
  "next_steps": ["ação 1", "ação 2"],
  "ai_notes": "resumo livre com recomendações para a próxima interação"
}`;

        const transcriptText = session.transcript.map((t: any) => `[${t.speaker.toUpperCase()}] ${t.text}`).join('\n');

        const userPrompt = `Script: ${scriptName}
Etapas: ${steps.join(' → ')}

Transcrição completa:
${transcriptText}`;

        const raw = await this.openaiClient.analyzePostCall(systemPrompt, userPrompt);
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('Failed to parse post-call analysis', e);
            return {};
        }
    }

    /**
     * Correlates objection texts from analysis with actual objection IDs from the database
     * This is needed to track which specific objections led to conversions
     * 
     * @param analysisResult - The result from generate()
     * @param objectionMatcher - Matcher instance to correlate text to IDs
     * @param availableObjections - All objections for the script
     * @returns Array of objection IDs that were detected
     */
    extractObjectionIds(
        analysisResult: any,
        objectionMatcher: any,
        availableObjections: any[]
    ): string[] {
        if (!analysisResult?.objections_faced || analysisResult.objections_faced.length === 0) {
            return [];
        }

        const detectedIds: string[] = [];

        for (const objFaced of analysisResult.objections_faced) {
            const objectionText = objFaced.objection;
            if (!objectionText) continue;

            // Use the matcher to find which objection this text corresponds to
            const match = objectionMatcher.match(objectionText, availableObjections, false);

            if (match && match.objectionId) {
                detectedIds.push(match.objectionId);
            }
        }

        return detectedIds;
    }
}
