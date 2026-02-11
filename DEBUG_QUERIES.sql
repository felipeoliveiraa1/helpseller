-- Verificar calls ativas no banco
SELECT 
    c.id,
    c.user_id,
    c.status,
    c.platform,
    c.started_at,
    p.name as seller_name,
    p.email as seller_email
FROM calls c
LEFT JOIN profiles p ON p.id = c.user_id
WHERE c.status = 'ACTIVE'
ORDER BY c.started_at DESC;

-- Verificar TODAS as calls recentes (últimas 10)
SELECT 
    id,
    user_id,
    status,
    platform,
    started_at,
    ended_at
FROM calls
ORDER BY started_at DESC
LIMIT 10;

-- Verificar se há profiles
SELECT id, name, email FROM profiles LIMIT 5;
