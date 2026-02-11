# 🐛 DEBUG: Calls não aparecem no Dashboard

## Problema
Dashboard não mostra calls ativas na página `/calls`

## Checklist de Debug

### 1. Verificar se call está sendo criada
```sql
-- No Supabase SQL Editor
SELECT * FROM calls WHERE status = 'ACTIVE' ORDER BY started_at DESC;
```

### 2. Verificar console do Dashboard
- F12 → Console
- Procurar por erros na query Supabase
- Ver se `fetchActiveCalls` está rodando

### 3. Verificar console da Extension
- F12 na aba onde está a extension
- Ver se WebSocket conectou: `"WebSocket connected"`
- Ver se enviou `call:start`

### 4. Verificar logs do Backend
No terminal do backend, procurar:
```
🔌 Seller WS connection
✅ User authenticated: [user-id]
📞 Call created: [call-id]
```

### 5. Verificar schema do profiles
```sql
-- Problema CONHECIDO: profiles pode estar como "full_name" ou "name"
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles';
```

## Soluções Rápidas

### Se calls não estão sendo criadas:
1. Extension não está conectada ao backend
2. Token de auth inválido
3. Script não foi selecionado

### Se calls existem mas não aparecem:
1. Query do dashboard está errada (problema com profiles)
2. Usuário não tem permissão
3. CORS bloqueando

### Teste Manual Rápido
```javascript
// Console do Dashboard (F12)
const { data, error } = await supabase
    .from('calls')
    .select('*')
    .eq('status', 'ACTIVE');
console.log('Calls:', data, 'Error:', error);
```

## Fix Provável

O problema é que `profiles` tem `name` mas a query usa `full_name`:

```typescript
// Em calls/page.tsx, trocar:
profiles (
    full_name,  // ❌
    email
)

// Por:
profiles (
    name,  // ✅
    email
)
```
