# Extension (Call Coach)

## Como carregar no Chrome (evitar erros e “chamadas ao vivo” não criarem)

**Use sempre build de produção para testar.** Se usar `npm run dev` ou carregar pela pasta errada, aparecem erros e as **chamadas ao vivo** podem parar de ser criadas.

1. **Pare** o `npm run dev` se estiver rodando.
2. Na pasta da extensão: `npm run build`
3. Abra `chrome://extensions`
4. **Remova** a extensão atual (se já estiver carregada).
5. Ative "Modo do desenvolvedor"
6. Clique em "Carregar sem compactação"
7. Selecione **apenas** a pasta **`dist`** (ex.: `.../CLOSEIA/extension/dist`), **nunca** a pasta `extension` (raiz).
8. Abra o popup da extensão e **faça login de novo** (após recarregar a extensão a sessão é perdida).

Assim o popup e o content script usam o JS compilado, o WebSocket do backend conecta e as chamadas ao vivo voltam a ser criadas.

## Erros comuns e solução

| Erro | Causa | Solução |
|------|--------|--------|
| `[vite] failed to connect to websocket (Error: Extension context invalidated.)` | Content script com HMR (modo dev) na página do Meet; extensão foi recarregada. | Pare o `npm run dev`, rode `npm run build`, remova a extensão e carregue de novo pela pasta **dist**. |
| `Failed to fetch dynamically imported module: .../src/popup/index.tsx` | Extensão carregada com output do **dev** ou pela pasta errada. | Mesmo procedimento acima: build + carregar pela **dist**. |
| `Failed to restore session: Auth session missing!` / `No session found` | Sessão perdida (ex.: extensão recarregada). | Abra o popup e **faça login novamente**. |
| Chamadas ao vivo não criam | WS do backend não conecta (token/sessão) ou extensão em modo dev. | Use **só** `npm run build` + pasta **dist** e faça login no popup. |

## Scripts

- `npm run build` — gera a pasta `dist` (use este para testar no Chrome).
- `npm run dev` — watch; **não** use com a extensão carregada no Chrome (gera os erros acima e quebra chamadas ao vivo).
