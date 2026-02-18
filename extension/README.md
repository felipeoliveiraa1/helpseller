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
- `npm run package` — faz o build e gera **`extension-dist.zip`** para distribuir (ver abaixo).

## Entregar a extensão sem expor o código-fonte

Para entregar um **único arquivo** para outras pessoas (sem que vejam o código do projeto):

1. Configure o **`.env`** na pasta `extension` com as URLs de produção e Supabase (o `.env` não entra no zip e não vai para o repositório).
2. Rode:
   ```bash
   npm install
   npm run package
   ```
   (Na primeira vez use `npm install` para instalar dependências, incluindo a do script de zip.)
3. O arquivo **`extension-dist.zip`** será criado na pasta `extension/`. Esse zip contém **apenas** o resultado do build: JavaScript minificado, `manifest.json` e assets. **Não** contém código-fonte, `.env` ou `node_modules`.
4. Entregue **só o `extension-dist.zip`**. Quem receber pode:
   - descompactar e em `chrome://extensions` usar "Carregar sem compactação" apontando para a pasta descompactada, ou
   - enviar o zip para publicação na Chrome Web Store.

O build de produção está configurado **sem source maps** e com minificação, para que o código não fique legível no zip.

### .crx é mais seguro?

O formato **.crx** (extensão empacotada e assinada) existe, mas o **Chrome não permite mais instalar .crx por duplo-clique ou arrastando** no Windows e no Mac — só pela Chrome Web Store ou carregando uma pasta “sem compactação”. Ou seja: gerar um .crx não simplifica a instalação para quem recebe; em muitos casos o usuário nem consegue instalar o .crx direto.

A opção **mais segura e de “um arquivo só”** na prática é:

- **Publicar na Chrome Web Store**: você envia o **zip** uma vez (o mesmo `extension-dist.zip`). Os usuários recebem **um link** e instalam com um clique. A Chrome verifica o pacote e ninguém precisa abrir modo desenvolvedor nem descompactar pasta. É o fluxo recomendado para distribuir para muitas pessoas.

Para equipe interna ou testes, o zip + “descompactar e carregar sem compactação” continua sendo o caminho suportado pelo Chrome fora da loja.
