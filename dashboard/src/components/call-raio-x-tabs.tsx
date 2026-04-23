'use client';

import { useState } from 'react';
import {
    Calendar,
    Clock,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    User,
    Lock,
    MessageSquare,
    DollarSign,
    TrendingDown,
    Search,
    Settings,
    Target,
    Heart,
    Trophy,
    Rocket,
    BarChart3,
    Star,
    AlertTriangle,
    Ghost,
    Lightbulb,
    Brain,
    Award,
    Users,
    Zap,
    Gift,
    Scale,
    Ban,
    XCircle,
    Copy,
    Anchor,
} from 'lucide-react';

const NEON_PINK = '#ff007a';
const CARD_BG = '#1e1e1e';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const SECTION_HEADER_BG = 'rgba(30,30,30,0.9)';
const SECTION_BODY_BG = 'rgba(26,26,26,0.6)';

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
    aderencia_etapas?: {
        nome?: string;
        status?: 'CUMPRIDA' | 'PARCIAL' | 'NAO_CUMPRIDA' | 'NAO_APLICAVEL' | string;
        peso?: number;
        evidencia?: string;
        justificativa?: string;
    }[];
    aderencia_justificativa_geral?: string;
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
        FRIO: 'rgba(59,130,246,0.2)',
        MORNO: 'rgba(245,158,11,0.2)',
        QUENTE: 'rgba(249,115,22,0.2)',
        FECHANDO: 'rgba(34,197,94,0.2)',
        POSITIVE: 'rgba(34,197,94,0.2)',
        NEUTRAL: 'rgba(148,163,184,0.2)',
        NEGATIVE: 'rgba(239,68,68,0.2)',
        Baixa: 'rgba(239,68,68,0.2)',
        'Média': 'rgba(245,158,11,0.2)',
        Alta: 'rgba(34,197,94,0.2)',
        Resistente: 'rgba(239,68,68,0.2)',
        Ambivalente: 'rgba(245,158,11,0.2)',
        Aberto: 'rgba(34,197,94,0.2)',
        'Em negociação': 'rgba(245,158,11,0.2)',
        'Venda realizada': 'rgba(34,197,94,0.2)',
        'Venda perdida': 'rgba(239,68,68,0.2)',
        'A definir': 'rgba(148,163,184,0.2)',
        FOLLOW_UP: 'rgba(245,158,11,0.2)',
        CONVERTED: 'rgba(34,197,94,0.2)',
        LOST: 'rgba(239,68,68,0.2)',
        UNKNOWN: 'rgba(148,163,184,0.2)',
    };
    const bg = styles[value] || 'rgba(255,255,255,0.06)';
    return (
        <span className="inline-block px-2 py-0.5 rounded border text-xs font-mono font-bold" style={{ backgroundColor: bg, borderColor: CARD_BORDER, color: 'rgb(226,232,240)' }}>
            {value}
        </span>
    );
}

function Card({ title, icon, children, accentColor }: { title: string; icon: React.ReactNode; children: React.ReactNode; accentColor?: string }) {
    const borderStyle = accentColor ? { borderColor: accentColor } : { borderColor: CARD_BORDER };
    return (
        <div className="rounded-xl p-5 space-y-3 border" style={{ backgroundColor: CARD_BG, ...borderStyle }}>
            <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <span className="flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4" style={{ color: accentColor || 'currentColor' }}>{icon}</span>
                {title}
            </h3>
            {children}
        </div>
    );
}

function TagList({ items, color = "text-gray-300" }: { items?: string[]; color?: string }) {
    if (!items?.length) return <p className="text-xs text-gray-500 italic">Não identificado</p>;
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((t, i) => (
                <span key={i} className={`text-xs rounded px-2 py-0.5 ${color}`} style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>{t}</span>
            ))}
        </div>
    );
}

function BulletList({ items, colorClass = "text-gray-400" }: { items?: string[]; colorClass?: string }) {
    if (!items?.length) return <p className="text-xs text-gray-500 italic">Não identificado</p>;
    return (
        <ul className="space-y-1">
            {items.map((item, i) => (
                <li key={i} className={`flex gap-2 text-xs ${colorClass}`}>
                    <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-500" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-lg p-3 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">{label}</p>
            <p className="text-base font-bold text-white mt-0.5">{value}</p>
            {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
        </div>
    );
}

function ProgressBar({ value }: { value: number }) {
    const barColor = value < 30 ? '#ef4444' : value < 60 ? '#f59e0b' : value < 80 ? NEON_PINK : '#22c55e';
    return (
        <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: barColor }} />
        </div>
    );
}

function Section({ title, id, icon, children }: { title: string; id: string; icon: React.ReactNode; children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <div id={id} className="rounded-xl overflow-hidden border" style={{ borderColor: CARD_BORDER }}>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-3 transition-colors text-left hover:opacity-90"
                style={{ backgroundColor: SECTION_HEADER_BG }}
            >
                <span className="text-sm font-bold text-gray-200 flex items-center gap-2">
                    <span className="flex items-center [&>svg]:w-4 [&>svg]:h-4" style={{ color: NEON_PINK }}>{icon}</span>
                    {title}
                </span>
                <span className="text-gray-400">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
            </button>
            {open && <div className="p-5 space-y-4" style={{ backgroundColor: SECTION_BODY_BG }}>{children}</div>}
        </div>
    );
}

// ─── Seções do relatório ──────────────────────────────────────

function HeaderSection({ d }: { d: FlatAnalysis }) {
    return (
        <div className="rounded-xl p-6 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Lead</p>
                    <h1 className="text-2xl font-extrabold text-white">{d.lead_nome || '—'}</h1>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400 items-center">
                        {d.lead_data_call && (
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" style={{ color: NEON_PINK }} />
                                {formatDate(d.lead_data_call)}
                            </span>
                        )}
                        {d.lead_duracao_segundos != null && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" style={{ color: NEON_PINK }} />
                                {formatDuration(d.lead_duracao_segundos)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {d.resultado && <Badge value={d.resultado} />}
                </div>
            </div>

            {d.aderencia_percentual != null && (
                <div className="mt-5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Aderência</p>
                        <p className="text-sm font-bold text-white">{d.aderencia_percentual}%</p>
                    </div>
                    <ProgressBar value={d.aderencia_percentual} />
                    {d.termometro_justificativa && <p className="text-xs text-gray-400 mt-2 italic">{d.termometro_justificativa}</p>}
                </div>
            )}
        </div>
    );
}

function PontosOuro({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="Pontos de Ouro" id="pontos" icon={<Sparkles className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Acertos" icon={<CheckCircle2 className="w-4 h-4" />} accentColor="rgba(34,197,94,0.5)">
                    <BulletList items={d.pontos_acertos} colorClass="text-green-300" />
                </Card>
                <Card title="Melhorias" icon={<AlertCircle className="w-4 h-4" />} accentColor="rgba(245,158,11,0.5)">
                    <BulletList items={d.pontos_melhorias} colorClass="text-amber-300" />
                </Card>
            </div>
        </Section>
    );
}

function AderenciaBreakdown({ d }: { d: FlatAnalysis }) {
    const etapas = d.aderencia_etapas;
    if (!etapas || etapas.length === 0) return null;

    const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
        CUMPRIDA: { label: 'Cumprida', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        PARCIAL: { label: 'Parcial', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <AlertCircle className="w-3.5 h-3.5" /> },
        NAO_CUMPRIDA: { label: 'Não cumprida', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: <XCircle className="w-3.5 h-3.5" /> },
        NAO_APLICAVEL: { label: 'N/A', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: <Ban className="w-3.5 h-3.5" /> },
    };

    return (
        <Section title="Aderência ao Script (detalhada)" id="aderencia" icon={<BarChart3 className="w-4 h-4" />}>
            {d.aderencia_justificativa_geral && (
                <p className="text-xs text-gray-400 italic mb-2">{d.aderencia_justificativa_geral}</p>
            )}
            <div className="space-y-2">
                {etapas.map((etapa, i) => {
                    const status = String(etapa.status || '').toUpperCase();
                    const meta = STATUS_META[status] ?? { label: status || '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: <Ghost className="w-3.5 h-3.5" /> };
                    const peso = etapa.peso === 2 ? 2 : 1;
                    return (
                        <div key={i} className="rounded-lg p-3 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                            <div className="flex items-start justify-between gap-3 mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[10px] text-gray-500 font-mono shrink-0">#{i + 1}</span>
                                    <span className="text-sm font-semibold text-white truncate">{etapa.nome || `Etapa ${i + 1}`}</span>
                                    {peso === 2 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0" style={{ backgroundColor: 'rgba(255,0,122,0.12)', color: NEON_PINK }}>
                                            crítica
                                        </span>
                                    )}
                                </div>
                                <span
                                    className="text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 shrink-0"
                                    style={{ backgroundColor: meta.bg, color: meta.color }}
                                >
                                    {meta.icon}
                                    {meta.label}
                                </span>
                            </div>
                            {etapa.evidencia && etapa.evidencia !== '—' && (
                                <p className="text-xs text-gray-300 italic border-l-2 pl-2 mt-1" style={{ borderColor: meta.color }}>
                                    “{etapa.evidencia}”
                                </p>
                            )}
                            {etapa.justificativa && (
                                <p className="text-[11px] text-gray-500 mt-1">{etapa.justificativa}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}

function PerfilPsicologico({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="Perfil Psicológico e Comportamental" id="perfil" icon={<User className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Stat label="Estado Emocional" value={d.perfil_estado_emocional || "—"} />
                <Stat label="Estilo de Decisão" value={d.perfil_estilo_decisao || "—"} />
                <div className="rounded-lg p-3 border space-y-2" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Consciência / Abertura</p>
                    <div className="flex flex-wrap gap-2">
                        {d.perfil_consciencia_problema && <Badge value={d.perfil_consciencia_problema} />}
                        {d.perfil_abertura_mudanca && <Badge value={d.perfil_abertura_mudanca} />}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Crenças Limitantes" icon={<Lock className="w-4 h-4" />}>
                    <BulletList items={d.perfil_crencas_limitantes} colorClass="text-red-300" />
                </Card>
                <Card title="Vocabulário Relevante" icon={<MessageSquare className="w-4 h-4" />}>
                    <TagList items={d.perfil_vocabulario_relevante} />
                </Card>
            </div>
        </Section>
    );
}

function ImpactoFinanceiro({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="Impacto Financeiro da Dor" id="financeiro" icon={<DollarSign className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Stat label="Perda Mensal Estimada" value={d.financeiro_perda_mensal || "—"} />
                <Stat label="Perda Anual Estimada" value={d.financeiro_perda_anual || "—"} />
            </div>
            <Card title="Custos de Oportunidade" icon={<TrendingDown className="w-4 h-4" />}>
                <BulletList items={d.financeiro_custos_oportunidade} colorClass="text-amber-300" />
            </Card>
            <Card title="Cenário se Nada For Feito (6–12 meses)" icon={<Clock className="w-4 h-4" />} accentColor="rgba(239,68,68,0.5)">
                <p className="text-xs text-red-300">{d.financeiro_cenario_sem_acao || "—"}</p>
            </Card>
        </Section>
    );
}

function Dores({ d }: { d: FlatAnalysis }) {
    const cards = [
        { label: "Operacionais", items: d.dores_operacionais, icon: <Settings className="w-4 h-4" />, colorClass: "text-blue-300" },
        { label: "Estratégicas", items: d.dores_estrategicas, icon: <Target className="w-4 h-4" />, colorClass: "text-purple-300" },
        { label: "Financeiras", items: d.dores_financeiras, icon: <DollarSign className="w-4 h-4" />, colorClass: "text-amber-300" },
        { label: "Emocionais (subtexto)", items: d.dores_emocionais, icon: <Heart className="w-4 h-4" />, colorClass: "text-pink-300" },
    ] as const;
    return (
        <Section title="Problemas e Dores" id="dores" icon={<Search className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map(({ label, items, icon, colorClass }) => (
                    <Card key={label} title={label} icon={icon}>
                        <BulletList items={items} colorClass={colorClass} />
                    </Card>
                ))}
            </div>
            <Card title="Top 3 por Impacto" icon={<Trophy className="w-4 h-4" />} accentColor="rgba(249,115,22,0.5)">
                {d.dores_top3?.map((dor, i) => (
                    <div key={i} className="flex items-start gap-3 py-1.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <span className="text-lg font-black leading-none" style={{ color: NEON_PINK }}>{i + 1}</span>
                        <p className="text-xs text-gray-300">{dor}</p>
                    </div>
                )) || <p className="text-xs text-gray-500 italic">Não identificado</p>}
            </Card>
        </Section>
    );
}

function Oportunidades({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="Oportunidades" id="oportunidades" icon={<Rocket className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Ganhos Tangíveis" icon={<BarChart3 className="w-4 h-4" />} accentColor="rgba(34,197,94,0.5)">
                    <BulletList items={d.oportunidades_tangiveis} colorClass="text-green-300" />
                </Card>
                <Card title="Ganhos Intangíveis" icon={<Sparkles className="w-4 h-4" />} accentColor="rgba(6,182,212,0.5)">
                    <BulletList items={d.oportunidades_intangiveis} colorClass="text-cyan-300" />
                </Card>
                <Card title="Diferenciais Relevantes" icon={<Star className="w-4 h-4" />}>
                    <BulletList items={d.oportunidades_diferenciais} colorClass="text-yellow-300" />
                </Card>
                <Card title="Alinhamento a Prioridades" icon={<Target className="w-4 h-4" />}>
                    <BulletList items={d.oportunidades_alinhamento} colorClass="text-purple-300" />
                </Card>
            </div>
        </Section>
    );
}

function Objecoes({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="Objeções e Resistências" id="objecoes" icon={<AlertTriangle className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Verbalizadas" icon={<MessageSquare className="w-4 h-4" />} accentColor="rgba(239,68,68,0.5)">
                    <BulletList items={d.objecoes_verbalizadas} colorClass="text-red-300" />
                </Card>
                <Card title="Implícitas" icon={<Ghost className="w-4 h-4" />} accentColor="rgba(249,115,22,0.5)">
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
                    <div key={label} className="rounded-lg p-3 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">{label}</p>
                        <p className={`text-xs ${color}`}>{val || "—"}</p>
                    </div>
                ))}
            </div>
            {d.objecoes_neutralizacoes && d.objecoes_neutralizacoes.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5" style={{ color: NEON_PINK }} />
                        Neutralizações Cirúrgicas
                    </p>
                    <div className="space-y-2">
                        {d.objecoes_neutralizacoes.map((n, i) => (
                            <div key={i} className="rounded-lg p-4 space-y-1 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                                <p className="text-xs font-bold text-red-400">Objeção: {n.objecao}</p>
                                <p className="text-xs text-gray-300">Estratégia: {n.estrategia}</p>
                                <p className="text-xs rounded px-3 py-1.5 text-green-300 italic" style={{ backgroundColor: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>&ldquo;{n.frase_modelo}&rdquo;</p>
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
        { label: "Autoridade", val: d.gatilho_autoridade, icon: <Award className="w-3.5 h-3.5" />, accentColor: 'rgba(234,179,8,0.5)', text: "text-yellow-300" },
        { label: "Prova Social", val: d.gatilho_prova_social, icon: <Users className="w-3.5 h-3.5" />, accentColor: 'rgba(59,130,246,0.5)', text: "text-blue-300" },
        { label: "Urgência", val: d.gatilho_urgencia, icon: <Zap className="w-3.5 h-3.5" />, accentColor: 'rgba(239,68,68,0.5)', text: "text-red-300" },
        { label: "Reciprocidade", val: d.gatilho_reciprocidade, icon: <Gift className="w-3.5 h-3.5" />, accentColor: 'rgba(34,197,94,0.5)', text: "text-green-300" },
        { label: "Dor vs. Prazer", val: d.gatilho_dor_vs_prazer, icon: <Scale className="w-3.5 h-3.5" />, accentColor: 'rgba(168,85,247,0.5)', text: "text-purple-300" },
    ];
    return (
        <Section title="Gatilhos Mentais a Ativar" id="gatilhos" icon={<Brain className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map(({ label, val, icon, accentColor, text }) => (
                    <div key={label} className="rounded-lg p-3 border" style={{ backgroundColor: CARD_BG, borderColor: accentColor }}>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1 flex items-center gap-1.5">
                            <span style={{ color: accentColor }}>{icon}</span> {label}
                        </p>
                        <p className={`text-xs ${text}`}>{val || "—"}</p>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function NaoDizer({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="O que NÃO dizer/fazer" id="naodizer" icon={<Ban className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Termos-Problema" icon={<XCircle className="w-4 h-4" />} accentColor="rgba(239,68,68,0.5)">
                    <TagList items={d.nao_dizer_termos} color="text-red-300" />
                </Card>
                <Card title="Erros Fatais" icon={<XCircle className="w-4 h-4" />} accentColor="rgba(239,68,68,0.5)">
                    <BulletList items={d.nao_dizer_erros_fatais} colorClass="text-red-400" />
                </Card>
                <Card title="Sensibilidades" icon={<AlertTriangle className="w-4 h-4" />} accentColor="rgba(245,158,11,0.5)">
                    <BulletList items={d.nao_dizer_sensibilidades} colorClass="text-amber-300" />
                </Card>
            </div>
        </Section>
    );
}



function Linguagem({ d }: { d: FlatAnalysis }) {
    return (
        <Section title="Linguagem, Framing & Frases-Chave" id="linguagem" icon={<MessageSquare className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Mirroring" icon={<Copy className="w-4 h-4" />}>
                    <TagList items={d.linguagem_mirroring} />
                </Card>
                <Card title="Usar" icon={<CheckCircle2 className="w-4 h-4" />} accentColor="rgba(34,197,94,0.5)">
                    <TagList items={d.linguagem_palavras_usar} color="text-green-300" />
                </Card>
                <Card title="Evitar" icon={<Ban className="w-4 h-4" />} accentColor="rgba(239,68,68,0.5)">
                    <TagList items={d.linguagem_palavras_evitar} color="text-red-300" />
                </Card>
            </div>
            <Card title="Ancoragens Recomendadas" icon={<Anchor className="w-4 h-4" />}>
                <BulletList items={d.linguagem_ancoragens} colorClass="text-cyan-300" />
            </Card>
            {d.linguagem_frases_modelo && d.linguagem_frases_modelo.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" style={{ color: NEON_PINK }} />
                        Frases-Modelo Prontas
                    </p>
                    <div className="space-y-2">
                        {d.linguagem_frases_modelo.map((frase, i) => (
                            <div key={i} className="rounded-lg px-4 py-3 flex gap-3 items-start border" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: CARD_BORDER }}>
                                <span className="text-gray-500 font-mono text-xs shrink-0">{i + 1}.</span>
                                <p className="text-sm text-gray-200 italic">&ldquo;{frase}&rdquo;</p>
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
            <AderenciaBreakdown d={d} />
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
