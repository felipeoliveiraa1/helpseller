import { OpenAIClient } from "./openai-client.js";

// ─── Interfaces ───────────────────────────────────────────────

export interface SpinAnalysis {
    phase: 'S' | 'P' | 'I' | 'N';
    objection: string | null;
    tip: string;
}

// ─── SPIN Selling System Prompt ───────────────────────────────

const SPIN_SYSTEM_PROMPT = `
Você é um Mentor de Vendas SPIN Selling em tempo real.

## SUA MISSÃO
Analise o bloco de transcrição recebido e retorne um JSON com:
1. A fase SPIN atual da conversa.
2. Se o lead apresentou alguma objeção (mesmo implícita).
3. Uma dica curta com a pergunta assertiva para o próximo passo.

## METODOLOGIA SPIN
- S (Situação): Coleta de fatos sobre o contexto do cliente.
- P (Problema): Descoberta de dores, insatisfações, dificuldades.
- I (Implicação): Consequências graves do problema (ampliar a dor).
- N (Necessidade-Solução): Fazer o cliente verbalizar como a solução ajudaria.

## DETECÇÃO DE OBJEÇÕES
Verifique se o lead expressou qualquer resistência, mesmo que sutil:
- Autoridade: "vou falar com meu sócio", "preciso consultar meu chefe"
- Preço: "está caro", "não temos orçamento para isso agora"
- Urgência: "vamos deixar para o mês que vem", "não é prioridade"
- Confiança: "já tivemos experiências ruins", "não sei se funciona"
- Necessidade: "não vejo como isso se aplica", "estamos bem assim"

Se houver objeção, descreva-a em 1 frase. Se não houver, retorne null.

## REGRAS
1. A "tip" deve ser UMA pergunta assertiva de no máximo 2 frases em português brasileiro.
2. Se o vendedor estiver na fase errada (ex: oferecendo solução antes de explorar Implicação), CORRIJA.
3. Responda APENAS em JSON válido, sem markdown.

## FORMATO DE RESPOSTA
{
  "phase": "S" | "P" | "I" | "N",
  "objection": "descrição curta da objeção ou null",
  "tip": "pergunta sugerida para o próximo passo"
}
`;

// ─── Coach Engine ─────────────────────────────────────────────

export class CoachEngine {
    constructor(private openaiClient: OpenAIClient) { }

    /**
     * Analisa os últimos 60s de transcrição e retorna fase SPIN + objeção + dica.
     * @param transcript60s Texto com os últimos 60 segundos de transcrição formatada.
     */
    async analyzeTranscription(transcript60s: string): Promise<SpinAnalysis | null> {
        if (!transcript60s || transcript60s.trim().length < 10) return null;

        const userPrompt = `
Transcrição dos últimos 60 segundos:
${transcript60s}

Analise e retorne o JSON.
`;

        try {
            const result = await this.openaiClient.completeJson<SpinAnalysis>(
                SPIN_SYSTEM_PROMPT,
                userPrompt
            );

            // Validate shape
            if (result && result.phase && result.tip) {
                return {
                    phase: result.phase,
                    objection: result.objection || null,
                    tip: result.tip,
                };
            }

            return null;
        } catch (error) {
            console.error("CoachEngine.analyzeTranscription Error", error);
            return null;
        }
    }
}
