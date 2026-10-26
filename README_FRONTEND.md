# PatroAI — FRONTEND (candidato, sem deploy)

Conteudo: landing visual + chat incorporado. A versao de index.html foi preservada
BYTE A BYTE em relacao ao pacote PatroAI_Agente_AO01_Reprodutivel.zip.

- index.html: pagina comercial completa; CSS e JavaScript do widget JA estao
  embutidos neste arquivo. Nao precisa editar nem importar agent-widget.js.
- agent-widget.js: copia de referencia da logica do widget; NAO e requisitado
  pela landing atual.
- .gitignore: arquivo de exclusao de arquivos locais.

IMPORTANTE SOBRE O CHAT
O script inline do index.html usa URLs RELATIVAS:
  GET /v1/public/chat/status
  POST /v1/public/chat
Assim, se este frontend for publicado sozinho como site estatico, o chat
NAO respondera: precisara do backend servindo a mesma origem, ou de uma
adaptacao separada, autorizada e testada para duas origens.

Para reproduzir o funcionamento atual em ambiente LOCAL, extraia os dois
ZIPs na MESMA pasta, sem sobrescrever index.html (so frontend o inclui).
Instale dependencias e execute app.py conforme README_BACKEND.md.
Isso nao significa que houve deploy ou resposta real de OpenAI.

Nao publicar sem avaliacao de privacidade, acessibilidade, desempenho,
abuso/custos, revisao humana e autorizacao expressa de deploy.

Status: PROPOSAL_ONLY / GITHUB_PUSH=NO_GO / RAILWAY_DEPLOY=NO_GO
