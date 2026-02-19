import { CallSession } from "../websocket/server.js";
import { OpenAIClient } from "./openai-client";

export class PostCallAnalyzer {
    constructor(private openaiClient: OpenAIClient) { }

    async generate(session: CallSession, scriptName: string, steps: string[]) {
        const systemPrompt = `Você é um analista especialista em vendas consultivas com profundo conhecimento em SPIN Selling (Neil Rackham). Analise a transcrição completa da call aplicando a metodologia SPIN e gere um relatório JSON:

{
  "spin_analysis": {
    "situation_questions": {
      "score": number (0-100),
      "examples": ["perguntas de situação identificadas"],
      "missing": ["perguntas de situação que deveriam ter sido feitas"],
      "assessment": "avaliação sobre uso das perguntas de situação"
    },
    "problem_questions": {
      "score": number (0-100),
      "examples": ["perguntas de problema identificadas"],
      "missing": ["perguntas de problema que deveriam ter sido feitas"],
      "assessment": "avaliação sobre exploração de dores e dificuldades"
    },
    "implication_questions": {
      "score": number (0-100),
      "examples": ["perguntas de implicação identificadas"],
      "missing": ["perguntas de implicação que deveriam ter sido feitas"],
      "assessment": "avaliação sobre desenvolvimento das consequências dos problemas"
    },
    "need_payoff_questions": {
      "score": number (0-100),
      "examples": ["perguntas de necessidade/solução identificadas"],
      "missing": ["perguntas de necessidade que deveriam ter sido feitas"],
      "assessment": "avaliação sobre como o vendedor conectou solução às necessidades"
    }
  },
  "spin_overall_score": number (0-100),
  "spin_stage_reached": "SITUATION" | "PROBLEM" | "IMPLICATION" | "NEED_PAYOFF" | "NONE",
  "explicit_needs_identified": ["necessidades explícitas declaradas pelo prospect"],
  "implicit_needs_detected": ["necessidades implícitas percebidas mas não exploradas"],
  "benefits_vs_features": {
    "benefits_presented": ["benefícios conectados às necessidades do cliente"],
    "features_only": ["características apresentadas sem conexão com necessidades"],
    "assessment": "avaliação se o vendedor apresentou benefícios ou apenas features"
  },
  "objections_faced": [
    {
      "objection": "texto da objeção",
      "spin_root_cause": "causa raiz no contexto SPIN (necessidade não desenvolvida, implicação não explorada, etc.)",
      "handled": boolean,
      "response": "como o vendedor respondeu",
      "recommended_response": "como deveria ter respondido segundo SPIN"
    }
  ],
  "premature_pitch": boolean,
  "premature_pitch_details": "se houve apresentação prematura de solução antes de desenvolver necessidades",
  "buying_signals": ["sinais de compra detectados"],
  "lead_sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED",
  "result": "CONVERTED" | "FOLLOW_UP" | "LOST" | "UNKNOWN",
  "next_steps": ["ação 1 baseada em SPIN", "ação 2"],
  "strengths": ["pontos fortes do vendedor sob ótica SPIN"],
  "improvements": ["pontos a melhorar sob ótica SPIN"],
  "ai_notes": "resumo com recomendações para próxima interação: quais perguntas SPIN fazer, quais implicações desenvolver, quais necessidades explorar"
}`;

        const transcriptText = (session.transcript || [])
            .map((t: any) => `[${(t.speaker || 'UNKNOWN').toUpperCase()}] ${t.text || ''}`)
            .join('\n');
        if (!transcriptText || transcriptText.trim().length < 50) {
            return { result: 'UNKNOWN', lead_sentiment: 'NEUTRAL', ai_notes: 'Transcrição insuficiente para análise.' };
        }

        const userPrompt = `Script: ${scriptName}
Etapas: ${steps.join(' → ')}

Transcrição completa:
${transcriptText}`;

        const raw = await this.openaiClient.analyzePostCall(systemPrompt, userPrompt);
        try {
            const data = JSON.parse(raw);
            // Compatibility mapping for existing database schema
            return {
                ...data,
                script_adherence_score: data.spin_overall_score || data.script_adherence_score || 0
            };
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
