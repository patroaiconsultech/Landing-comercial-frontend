# Landing comercial PatrioAI / PatroAI — candidato DG-01

**Gate:** `PROPOSAL_ONLY`, sem branch/commit/push/deploy.

Origem: ZIP `Landing-comercial-frontend-main (8).zip`, fornecido pelo operador.
Este projeto comercial **não é** o repositório oficial EFATÀ 777. Nenhum código do staging EFATÀ foi modificado.

## Entrega da landing
- Homepage comercial com pitch de holding tecnológica, Venture Studio, Business Plan,
  estudo de viabilidade econômico-financeira, consultoria, engenharia e governança.
- Jornada do negócio, cenários ilustrativos e painel conceitual com abas (sem acesso
  real a projetos, dados ou investidores).
- Equipe de consultores e auditores associados com alocação conforme projeto.
- Argumentação de tecnologia proprietária multiagente, confidencialidade por projeto
  e limites claros de promessas.
- FAQ, conteúdo semanticamente estruturado, metadados SEO, Open Graph, Twitter
  e dados estruturados de organização/serviços.
- Mídia MP4/MP3 desmembrada do HTML; nova imagem WebP editorial conceitual.
- Layout responsivo e traduções PT, EN e ES das novas seções.

## Execução
O frontend é estático e pode ser servido pelo Nginx usando `Dockerfile` e
`default.conf.template`, com variável de backend a configurar no deploy.
Sem backend acessível, o assistente comercial e endpoints não estarão disponíveis.

O chat público mantém as rotas relativas originais:
`GET /v1/public/chat/status`, `POST /v1/public/chat`.
O painel de governança exibido é **demonstração**, não ambiente real para investidores.

## SEO
Em revisão e staging, a landing permanece `noindex, nofollow` para evitar
indexação prematura de conteúdo/propostas. Consulte `docs/SEO_E_PUBLICACAO.md`
para liberar SEO público **somente após** domínio e publicação autorizados.
`python scripts/build_public_seo.py` é opcional e exige flags explícitas.

## Testes
```
node tests/test_venture_seo.cjs
pytest -q tests/test_public_seo_build.py
node tests/test_hero_executivo_assets.cjs
node tests/test_retrato_institucional.cjs
node tests/test_r3a_docker_assets.cjs
```
Demais testes originais e gates administrativos são independentes. Validar com
AO-01 antes de merge, migração, conexão runtime ou deploy.

## Correção R2 — foto local, prévia e rodapé (2026-11-11)
- Caminhos dos assets modificados para relativos ao HTML, preservando Nginx.
- `ABRIR_PREVIA_AUTONOMA.html` funciona sem extrair o ZIP; incorpora fotos, vídeo, áudio e scripts locais.
- `index.html` é otimizado e deve ser aberto após **Extrair tudo**.
- Removida a faixa amarela de alerta jurídico no rodapé; **LGPD segue pendente**.
- `Organization.legalName` e `taxID`/rodapé: dados empresariais do contrato social registrado em 2025.
- Não houve alteração de acesso, API, direitos de investidores ou gate de SEO.
- Consultar `LEIA_PRIMEIRO_PREVIA.txt` e handoff AO-01 para testes, riscos e rollback.

## Reconciliação DG-01 — 2026-11-11

- Baseline de comparação: ZIP original reenviado `Landing-comercial-frontend-main (8)(1).zip`,
  confirmado idêntico ao primeiro ZIP usado nesta conversa pelo SHA-256.
- Este candidato **não contém** a experiência cinematográfica R4/R5: a animação foi adiada.
  Conserva apenas a abertura original com escolha de som, música original contínua,
  landing comercial e imagem estática nova no hero.
- Novo hero: `patroai-hero-humano-ia.jpg`, retratando colaboração de liderança humana e
  agente de IA ilustrativo; imagem aprovada para esta prévia.
- O arquivo original `hero-executivo-patroai.jpg` foi preservado para rollback.
- Não substitui o retrato da seção Institucional.
- A indexação segue `noindex, nofollow`; `scripts/build_public_seo.py` requer gate explícito.
- Testes adicionais: `node --test tests/test_hero_humano_ia.cjs` e a suíte focada comercial.
- Dados pessoais, permissões, migrations, endpoints, relatórios financeiros e portal real
  de investidores não foram alterados.
- Estado: `SOURCE_CANDIDATE` / `AO01_REVIEW_REQUIRED`; deploy e indexação: `NO-GO`.
- Diferenciar ZIP fornecido pelo operador de artefato comprovadamente ativo no Railway.
