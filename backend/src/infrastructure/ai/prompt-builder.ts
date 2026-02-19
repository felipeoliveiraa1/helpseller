import { CallSession } from "../websocket/server";
import { TriggerResult } from "./trigger-detector";

interface Script {
  name: string;
  coach_personality: string;
  coach_tone: string;
  intervention_level: string;
  steps: Array<{
    step_order: number;
    name: string;
    description: string;
    key_questions: string[];
    transition_criteria: string;
    estimated_duration: number;
  }>;
}

export class PromptBuilder {
  build(session: CallSession, trigger: TriggerResult, script: Script) {
    // Safe defaults for script properties if missing
    const personality = script.coach_personality || "Strategic and Direct";
    const tone = script.coach_tone || "Professional";
    const intervention = script.intervention_level || "Medium";

    const system = `
Você é um Mentor de Vendas especialista na metodologia SPIN SELLING.

## SUA PERSONALIDADE
${personality}
Tom: ${tone}
Nível de intervenção: ${intervention}

## METODOLOGIA SPIN SELLING (OBRIGATÓRIO)
Analise a fase atual e sugira o PRÓXIMO PASSO com uma pergunta assertiva:
- S (Situação): Coletar fatos (Use pouco).
- P (Problema): Descubra dores e insatisfações.
- I (Implicação): Mostre as consequências graves (aumente a dor).
- N (Necessidade): Faça o cliente dizer como a solução ajudaria.

## REGRAS ABSOLUTAS
1. Identifique a fase atual (S, P, I ou N).
2. Sugira APENAS O PRÓXIMO PASSO (ex: "Pergunte sobre o impacto financeiro disso").
3. EXTREMAMENTE CURTO: Máximo 2 frases. Direto ao ponto.
4. Se o vendedor estiver falando de solução cedo demais, CORRIJA e mande voltar para Problema/Implicação.
5. Responda em português brasileiro.

## SCRIPT DE VENDAS: ${script.name}

### ETAPAS:
${script.steps.map(s => `
**Etapa ${s.step_order}: ${s.name}**
Objetivo: ${s.description}
Perguntas-chave: ${s.key_questions.join(', ')}
Transição: ${s.transition_criteria}
Tempo: ${s.estimated_duration}s
`).join('\n')}

## FORMATO DE RESPOSTA
Responda APENAS em JSON válido, sem markdown:
{
  "currentStep": number,
  "coaching": {
    "type": "tip" | "alert" | "reinforcement" | "objection" | "buying_signal",
    "urgency": "low" | "medium" | "high",
    "content": "conselho máx 280 chars"
  },
  "nextStep": {
    "action": "próximo passo sugerido",
    "question": "pergunta sugerida" | null
  },
  "leadProfile": {
    "type": "emotional" | "rational" | "skeptical" | "anxious" | "enthusiastic",
    "concerns": ["preocupações"],
    "interests": ["interesses"],
    "buyingSignals": ["sinais"]
  },
  "stageChanged": boolean,
  "spinStage": "Situation" | "Problem" | "Implication" | "Need-Payoff" | "Unknown",
  "shouldSkipResponse": boolean
}
`;

    const recentTranscript = session.transcript.slice(-50).map((t: { timestamp: number; text: string; role?: string }) =>
      `[${new Date(t.timestamp).toISOString().split('T')[1].split('.')[0]}] ${t.role === 'seller' ? 'VENDEDOR' : 'LEAD'}: ${t.text}`
    ).join('\n');

    const user = `
## TRANSCRIÇÃO (últimos turnos)
${recentTranscript}

## ESTADO ATUAL
- Etapa atual: ${session.currentStep}
- Perfil do lead: ${JSON.stringify(session.leadProfile || {})}
- Último coaching: "${session.lastCoaching || ''}"
- Trigger: ${trigger.reason}

Analise e dê coaching. Se não há nada útil, retorne shouldSkipResponse: true.
`;

    return { system, user };
  }
}
