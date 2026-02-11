-- ========================================
-- SOLUÇÃO FINAL: Permitir organization_id NULL temporariamente
-- ========================================

-- Opção A: Se você tem acesso ao Supabase Dashboard
-- Vá em Database > Tables > scripts
-- Edite a coluna organization_id e marque "Allow nullable"

-- Opção B: Execute este SQL para remover constraint temporariamente
ALTER TABLE scripts ALTER COLUMN organization_id DROP NOT NULL;

-- Depois crie o script:
INSERT INTO scripts (
    id,
    name,
    description,
    coach_personality,
    coach_tone,
    intervention_level,
    is_active
)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Script Padrão',
    'Script padrão para chamadas de vendas',
    'Coach profissional e consultivo',
    'CONSULTIVE',
    'MEDIUM',
    true
)
ON CONFLICT (id) DO NOTHING
RETURNING id, name;

-- Verificar:
SELECT id, name FROM scripts WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
