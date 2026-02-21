'use client';

import { useState } from 'react';

// ─── Helpers ────────────────────────────────────────────────
function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec.toString().padStart(2, '0')}s`;
}

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return iso; }
}

// ─── Tipo flat do raw_analysis ────────────────────────────────
export interface FlatAnalysis {
    lead_nome?: string;
    lead_duracao_segundos?: number;
    lead_data_call?: string;
    resultado?: string;
    sentimento?: string;
    aderencia_percentual?: number;
    termometro_classificacao?: string;
    termometro_justificativa?: string;
    pontos_acertos?: string[];
    pontos_melhorias?: string[];
    perfil_estado_emocional?: string;
    perfil_estilo_decisao?: string;
    perfil_crencas_limitantes?: string[];
    perfil_consciencia_problema?: string;
    perfil_abertura_mudanca?: string;
    perfil_vocabulario_relevante?: string[];
    financeiro_perda_mensal?: string;
    financeiro_perda_anual?: string;
    financeiro_custos_oportunidade?: string[];
    financeiro_cenario_sem_acao?: string;
    dores_operacionais?: string[];
    dores_estrategicas?: string[];
    dores_financeiras?: string[];
    dores_emocionais?: string[];
    dores_top3?: string[];
    oportunidades_tangiveis?: string[];
    oportunidades_intangiveis?: string[];
    oportunidades_diferenciais?: string[];
    oportunidades_alinhamento?: string[];
    objecoes_verbalizadas?: string[];
    objecoes_implicitas?: string[];
    objecoes_angulo_financeiro?: string;
    objecoes_angulo_tecnico?: string;
    objecoes_angulo_politico?: string;
    objecoes_angulo_emocional?: string;
    objecoes_neutralizacoes?: { objecao?: string; estrategia?: string; frase_modelo?: string }[];
    gatilho_autoridade?: string;
    gatilho_prova_social?: string;
    gatilho_urgencia?: string;
    gatilho_reciprocidade?: string;
    gatilho_dor_vs_prazer?: string;
    nao_dizer_termos?: string[];
    nao_dizer_erros_fatais?: string[];
    nao_dizer_sensibilidades?: string[];

    linguagem_mirroring?: string[];
    linguagem_palavras_usar?: string[];
    linguagem_palavras_evitar?: string[];
    linguagem_ancoragens?: string[];
    linguagem_frases_modelo?: string[];
    resumo_ia?: string;
    [key: string]: unknown;
}

// ─── Sub-componentes ─────────────────────────────────────────

function Badge({ value }: { value: string }) {
    const styles: Record<string, string> = {
        FRIO: "bg-blue-500/20 text-blue-300 border-blue-500/40",
        MORNO: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        QUENTE: "bg-orange-500/20 text-orange-300 border-orange-500/40",
        FECHANDO: "bg-green-500/20 text-green-300 border-green-500/40",
        POSITIVE: "bg-green-500/20 text-green-300 border-green-500/40",
        NEUTRAL: "bg-slate-500/20 text-slate-300 border-slate-500/40",
        NEGATIVE: "bg-red-500/20 text-red-300 border-red-500/40",
        Baixa: "bg-red-500/20 text-red-300 border-red-500/40",
        "Média": "bg-amber-500/20 text-amber-300 border-amber-500/40",
        Alta: "bg-green-500/20 text-green-300 border-green-500/40",
        Resistente: "bg-red-500/20 text-red-300 border-red-500/40",
        Ambivalente: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        Aberto: "bg-green-500/20 text-green-300 border-green-500/40",
    };
    const cls = styles[value] || "bg-slate-500/20 text-slate-300 border-slate-500/40";
    return (
        <span className={`inline-block px-2 py-0.5 rounded border text-xs font-mono font-bold ${cls}`}>
            {value}
        </span>
    );
}

function Card({ title, icon, children, accent = "border-slate-700" }: { title: string; icon: string; children: React.ReactNode; accent?: string }) {
    return (
        <div className={`bg-slate-800/60 border ${accent} rounded-xl p-5 space-y-3`}>
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <span className="text-base">{icon}</span>
                {title}
            </h3>
            {children}
        </div>
    );
}

function TagList({ items, color = "text-slate-300" }: { items?: string[]; color?: string }) {
    if (!items?.length) return <p className="text-xs text-slate-500 italic">Não identificado</p>;
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((t, i) => (
                <span key={i} className={`text-xs bg-slate-700/50 border border-slate-600/50 rounded px-2 py-0.5 ${color}`}>{t}</span>
            ))}
        </div>
    );
}

function BulletList({ items, icon = "▸", colorClass = "text-slate-400" }: { items?: string[]; icon?: string; colorClass?: string }) {
    if (!items?.length) return <p className="text-xs text-slate-500 italic">Não identificado</p>;
    return (
        <ul className="space-y-1">
            {items.map((item, i) => (
                <li key={i} className={`flex gap-2 text-xs ${colorClass}`}>
                    <span className="text-slate-500 mt-0.5 shrink-0">{icon}</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">{label}</p>
            <p className="text-base font-bold text-white mt-0.5">{value}</p>
            {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
    );
}

function ProgressBar({ value }: { value: number }) {
    const color = value < 30 ? "bg-red-500" : value < 60 ? "bg-amber-500" : value < 80 ? "bg-orange-500" : "bg-green-500";
    return (
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
        </div>
    );
}

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <div id={id} className="border border-slate-700/50 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-3 bg-slate-800/80 hover:bg-slate-700/60 transition-colors text-left"
            >
                <span className="text-sm font-bold text-slate-200">{title}</span>
                <span className="text-slate-400 text-sm">{open ? "▲" : "▼"}</span>
            </button>
            {open && <div className="p-5 bg-slate-900/40 space-y-4">{children}</div>}
        </div>
    );
}

// ─── Seções do relatório ──────────────────────────────────────

function HeaderSection({ d }: { d: FlatAnalysis }) {
    return (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Lead</p>
                    <h1 className="text-2xl font-extrabold text-white">{d.lead_nome || '—'}</h1>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                        {d.lead_data_call && <span>📅 {formatDate(d.lead_data_call)}</span>}
                        {d.lead_duracao_segundos != null && <span>⏱ {formatDuration(d.lead_duracao_segundos)}</span>}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {d.resultado && <Badge value={d.resultado} />}
                    {d.sentimento && d.sentimento !== 'NEUTRAL' && <Badge value={d.sentimento} />}
                    {d.termometro_classificacao && d.termometro_classificacao !== 'MORNO' && <Badge value={d.termometro_classificacao} />}
                </div>
            </div>

            {d.aderencia_percentual != null && (
                <div className="mt-5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Aderência</p>
                        <p className="text-sm font-bold text-white">{d.aderencia_percentual}%</p>
                    </div>
                    <ProgressBar value={d.aderencia_percentual} />
                    {d.termometro_justificativa && <p className="text-xs text-slate-400 mt-2 italic">{d.termometro_justificativa}</p>}
                </div>
            )}
        </div>
    );
}

function PontosOuro({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="✨ Pontos de Ouro" id="pontos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Acertos" icon="✅" accent="border-green-700/40">
                    <BulletList items={d.pontos_acertos} icon="✓" colorClass="text-green-300" />
                </Card>
                <Card title="Melhorias" icon="⚠️" accent="border-amber-700/40">
                    <BulletList items={d.pontos_melhorias} icon="!" colorClass="text-amber-300" />
                </Card>
            </div>
        </Section>
    );
}

function PerfilPsicologico({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="👤 Perfil Psicológico e Comportamental" id="perfil">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Stat label="Estado Emocional" value={d.perfil_estado_emocional || "—"} />
                <Stat label="Estilo de Decisão" value={d.perfil_estilo_decisao || "—"} />
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Consciência / Abertura</p>
                    <div className="flex flex-wrap gap-2">
                        {d.perfil_consciencia_problema && <Badge value={d.perfil_consciencia_problema} />}
                        {d.perfil_abertura_mudanca && <Badge value={d.perfil_abertura_mudanca} />}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Crenças Limitantes" icon="🔒">
                    <BulletList items={d.perfil_crencas_limitantes} icon="▸" colorClass="text-red-300" />
                </Card>
                <Card title="Vocabulário Relevante" icon="🗣️">
                    <TagList items={d.perfil_vocabulario_relevante} />
                </Card>
            </div>
        </Section>
    );
}

function ImpactoFinanceiro({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="💸 Impacto Financeiro da Dor" id="financeiro">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Stat label="Perda Mensal Estimada" value={d.financeiro_perda_mensal || "—"} />
                <Stat label="Perda Anual Estimada" value={d.financeiro_perda_anual || "—"} />
            </div>
            <Card title="Custos de Oportunidade" icon="📉">
                <BulletList items={d.financeiro_custos_oportunidade} colorClass="text-amber-300" />
            </Card>
            <Card title="Cenário se Nada For Feito (6–12 meses)" icon="⏳" accent="border-red-700/40">
                <p className="text-xs text-red-300">{d.financeiro_cenario_sem_acao || "—"}</p>
            </Card>
        </Section>
    );
}

function Dores({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="🔍 Problemas e Dores" id="dores">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                    { label: "Operacionais", items: d.dores_operacionais, icon: "⚙️", color: "text-blue-300" },
                    { label: "Estratégicas", items: d.dores_estrategicas, icon: "🎯", color: "text-purple-300" },
                    { label: "Financeiras", items: d.dores_financeiras, icon: "💰", color: "text-amber-300" },
                    { label: "Emocionais (subtexto)", items: d.dores_emocionais, icon: "😰", color: "text-pink-300" },
                ] as const).map(({ label, items, icon, color }) => (
                    <Card key={label} title={label} icon={icon}>
                        <BulletList items={items} colorClass={color} />
                    </Card>
                ))}
            </div>
            <Card title="Top 3 por Impacto" icon="🏆" accent="border-orange-700/40">
                {d.dores_top3?.map((dor, i) => (
                    <div key={i} className="flex items-start gap-3 py-1.5 border-b border-slate-700/30 last:border-0">
                        <span className="text-lg font-black text-orange-400 leading-none">{i + 1}</span>
                        <p className="text-xs text-slate-300">{dor}</p>
                    </div>
                )) || <p className="text-xs text-slate-500 italic">Não identificado</p>}
            </Card>
        </Section>
    );
}

function Oportunidades({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="🚀 Oportunidades" id="oportunidades">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Ganhos Tangíveis" icon="📊" accent="border-green-700/40">
                    <BulletList items={d.oportunidades_tangiveis} colorClass="text-green-300" />
                </Card>
                <Card title="Ganhos Intangíveis" icon="✨" accent="border-cyan-700/40">
                    <BulletList items={d.oportunidades_intangiveis} colorClass="text-cyan-300" />
                </Card>
                <Card title="Diferenciais Relevantes" icon="⭐">
                    <BulletList items={d.oportunidades_diferenciais} colorClass="text-yellow-300" />
                </Card>
                <Card title="Alinhamento a Prioridades" icon="🎯">
                    <BulletList items={d.oportunidades_alinhamento} colorClass="text-purple-300" />
                </Card>
            </div>
        </Section>
    );
}

function Objecoes({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="⚠️ Objeções e Resistências" id="objecoes">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Verbalizadas" icon="🗣️" accent="border-red-700/40">
                    <BulletList items={d.objecoes_verbalizadas} colorClass="text-red-300" />
                </Card>
                <Card title="Implícitas" icon="👻" accent="border-orange-700/40">
                    <BulletList items={d.objecoes_implicitas} colorClass="text-orange-300" />
                </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {([
                    { label: "Ângulo Financeiro", val: d.objecoes_angulo_financeiro, color: "text-amber-300" },
                    { label: "Ângulo Técnico", val: d.objecoes_angulo_tecnico, color: "text-blue-300" },
                    { label: "Ângulo Político", val: d.objecoes_angulo_politico, color: "text-purple-300" },
                    { label: "Ângulo Emocional", val: d.objecoes_angulo_emocional, color: "text-pink-300" },
                ] as const).map(({ label, val, color }) => (
                    <div key={label} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-1">{label}</p>
                        <p className={`text-xs ${color}`}>{val || "—"}</p>
                    </div>
                ))}
            </div>
            {d.objecoes_neutralizacoes && d.objecoes_neutralizacoes.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-slate-400 mb-2">💡 Neutralizações Cirúrgicas</p>
                    <div className="space-y-2">
                        {d.objecoes_neutralizacoes.map((n, i) => (
                            <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-4 space-y-1">
                                <p className="text-xs font-bold text-red-400">Objeção: {n.objecao}</p>
                                <p className="text-xs text-slate-300">Estratégia: {n.estrategia}</p>
                                <p className="text-xs bg-green-900/30 border border-green-700/30 rounded px-3 py-1.5 text-green-300 italic">&ldquo;{n.frase_modelo}&rdquo;</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Section>
    );
}

function Gatilhos({ d }: { d: FlatAnalysis }) {
    const items = [
        { label: "Autoridade", val: d.gatilho_autoridade, icon: "🏅", border: "border-yellow-700/40", text: "text-yellow-300" },
        { label: "Prova Social", val: d.gatilho_prova_social, icon: "👥", border: "border-blue-700/40", text: "text-blue-300" },
        { label: "Urgência", val: d.gatilho_urgencia, icon: "⚡", border: "border-red-700/40", text: "text-red-300" },
        { label: "Reciprocidade", val: d.gatilho_reciprocidade, icon: "🎁", border: "border-green-700/40", text: "text-green-300" },
        { label: "Dor vs. Prazer", val: d.gatilho_dor_vs_prazer, icon: "⚖️", border: "border-purple-700/40", text: "text-purple-300" },
    ];
    return (
        <Section title="🧠 Gatilhos Mentais a Ativar" id="gatilhos">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map(({ label, val, icon, border, text }) => (
                    <div key={label} className={`bg-slate-900/60 rounded-lg p-3 border ${border}`}>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-1">{icon} {label}</p>
                        <p className={`text-xs ${text}`}>{val || "—"}</p>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function NaoDizer({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="🚫 O que NÃO dizer/fazer" id="naodizer">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Termos-Problema" icon="❌" accent="border-red-700/40">
                    <TagList items={d.nao_dizer_termos} color="text-red-300" />
                </Card>
                <Card title="Erros Fatais" icon="💀" accent="border-red-700/40">
                    <BulletList items={d.nao_dizer_erros_fatais} icon="✗" colorClass="text-red-400" />
                </Card>
                <Card title="Sensibilidades" icon="⚠️" accent="border-amber-700/40">
                    <BulletList items={d.nao_dizer_sensibilidades} icon="!" colorClass="text-amber-300" />
                </Card>
            </div>
        </Section>
    );
}



function Linguagem({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="🗣️ Linguagem, Framing & Frases-Chave" id="linguagem">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Mirroring" icon="🪞">
                    <TagList items={d.linguagem_mirroring} />
                </Card>
                <Card title="Usar" icon="✅" accent="border-green-700/40">
                    <TagList items={d.linguagem_palavras_usar} color="text-green-300" />
                </Card>
                <Card title="Evitar" icon="🚫" accent="border-red-700/40">
                    <TagList items={d.linguagem_palavras_evitar} color="text-red-300" />
                </Card>
            </div>
            <Card title="Ancoragens Recomendadas" icon="⚓">
                <BulletList items={d.linguagem_ancoragens} colorClass="text-cyan-300" />
            </Card>
            {d.linguagem_frases_modelo && d.linguagem_frases_modelo.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-slate-400 mb-3">💬 Frases-Modelo Prontas</p>
                    <div className="space-y-2">
                        {d.linguagem_frases_modelo.map((frase, i) => (
                            <div key={i} className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-4 py-3 flex gap-3 items-start">
                                <span className="text-slate-500 font-mono text-xs shrink-0">{i + 1}.</span>
                                <p className="text-sm text-slate-200 italic">&ldquo;{frase}&rdquo;</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Section>
    );
}

// ─── Componente Principal ────────────────────────────────────
export function CallRaioXTabs({ data }: { data: FlatAnalysis }) {
    const d = data;
    if (!d) return null;

    return (
        <div className="space-y-4">
            <HeaderSection d={d} />
            <PontosOuro d={d} />
            <PerfilPsicologico d={d} />
            <ImpactoFinanceiro d={d} />
            <Dores d={d} />
            <Oportunidades d={d} />
            <Objecoes d={d} />
            <Gatilhos d={d} />
            <NaoDizer d={d} />
            <Linguagem d={d} />
        </div>
    );
}
