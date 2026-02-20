import { OpenAIClient } from "./openai-client.js";

// ─── Interfaces ───────────────────────────────────────────────

export interface SpinAnalysis {
    phase: 'S' | 'P' | 'I' | 'N';
    objection: string | null;
    tip: string;
    /** Pergunta que o vendedor deve FAZER ao lead. */
    suggested_question: string | null;
    /** Resposta pronta que o vendedor deve DIZER ao cliente quando ele pergunta, objeta ou levanta dúvida. */
    suggested_response: string | null;
}

// ─── SPIN Selling System Prompt ───────────────────────────────

const SPIN_SYSTEM_PROMPT = `
Você é um Coach de Vendas SPIN em tempo real. Duas funções principais:
1) Sugerir PERGUNTAS que o vendedor deve fazer ao lead (SPIN).
2) Sugerir a RESPOSTA exata que o vendedor deve dar quando o lead pergunta, objeta ou levanta dúvida — preciso e rápido.

## RESPOSTA AO CLIENTE (suggested_response) — PRIORIDADE ALTA
Sempre que o LEAD fizer uma pergunta, levantar objeção (preço, tempo, "me manda material", desconfiança) ou dúvida, preencha "suggested_response" com a frase PRONTA que o vendedor deve dizer ao cliente — 1 ou 2 frases curtas. Exemplos:
- "Quanto custa?" → suggested_response com enquadramento (valor, investimento, próximo passo).
- "Preciso pensar." / "Vou falar com meu sócio." → suggested_response que mantém compromisso sem pressionar.
- "Me manda um e-mail." → suggested_response que pede 1 coisa concreta antes (ex: "Te mando em 2 min. Só confirma: o problema hoje é X ou Y?").
- "Não tenho tempo." → suggested_response com 1 minuto ou agendamento.
- Qualquer pergunta objetiva do lead → suggested_response clara que vira para a dor/necessidade.
Se o lead NÃO perguntou e NÃO objetou, use suggested_response: null.

## PERGUNTA SUGERIDA (suggested_question)
Pergunta que o vendedor deve FAZER ao lead (próximo passo SPIN). NÃO repita as "Perguntas já enviadas". Se não houver pergunta nova útil, use null.

## IDENTIFICAÇÃO
- "VENDEDOR" ou "Você" = coachee. Analise performance, corrija.
- "LEAD" = cliente. Quando ELE pergunta ou objeta → suggested_response obrigatório.

## ESTILO
- CURTO. Máximo 4 linhas no tip. suggested_response: 1–2 frases.
- PRECISO. Resposta ao cliente usável na hora.

## SPIN
S (Situação) → P (Problema/dor) → I (Implicação) → N (Necessidade). Lead pergunta/objeta → suggested_response; hora de explorar → suggested_question.

## JSON OBRIGATÓRIO (retorne APENAS este objeto)
{
  "phase": "S" | "P" | "I" | "N",
  "objection": "tipo da objeção (ex: Preço, Tempo) ou null",
  "tip": "feedback curto do coach (correção + estratégia). Perguntas em **negrito**. Use \\n para quebra.",
  "suggested_question": "pergunta nova para o vendedor fazer ao lead" | null,
  "suggested_response": "resposta pronta para o vendedor DIZER ao cliente (quando lead perguntou/objeta)" | null
}
Regras: suggested_response quando lead perguntou ou objetou; senão null. suggested_question não repetir as já enviadas. Português brasileiro.
`;

// ─── Coach Engine ─────────────────────────────────────────────

export class CoachEngine {
    constructor(private openaiClient: OpenAIClient) { }

    /**
     * Analisa todo o histórico de transcrição e retorna fase SPIN + objeção + dica.
     * @param fullTranscript Texto com todo o histórico da conversa formatada.
     * @param options.sentQuestions Perguntas já enviadas ao vendedor (não repetir).
     */
    async analyzeTranscription(
        fullTranscript: string,
        options?: { sentQuestions?: string[] }
    ): Promise<SpinAnalysis | null> {
        if (!fullTranscript || fullTranscript.trim().length < 10) return null;

        const sentQuestions = options?.sentQuestions ?? [];
        const sentBlock =
            sentQuestions.length > 0
                ? `
## PERGUNTAS JÁ ENVIADAS AO VENDEDOR (NÃO REPITA NENHUMA DESTAS)
${sentQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
`
                : '';

        const userPrompt = `
Transcrição completa da conversa até agora:
${fullTranscript}
${sentBlock}

Analise e retorne o JSON. Se o lead fez pergunta ou objeção, preencha suggested_response (resposta pronta para o vendedor dizer). Sugira uma pergunta NOVA em suggested_question (não repita as listadas).
`;

        try {
            const result = await this.openaiClient.completeJson<SpinAnalysis & { suggested_question?: string | null; suggested_response?: string | null }>(
                SPIN_SYSTEM_PROMPT,
                userPrompt
            );

            // Validate shape
            if (result && result.phase && result.tip) {
                return {
                    phase: result.phase,
                    objection: result.objection || null,
                    tip: result.tip,
                    suggested_question: result.suggested_question ?? null,
                    suggested_response: result.suggested_response ?? null,
                };
            }

            return null;
        } catch (error) {
            console.error("CoachEngine.analyzeTranscription Error", error);
            return null;
        }
    }
}