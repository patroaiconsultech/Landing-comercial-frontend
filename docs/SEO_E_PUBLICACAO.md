# SEO, conteúdo e publicação — PatrioAI / Landing comercial

## Estado da entrega
- `PROPOSAL_ONLY`, sem Git push/deploy. O HTML continua com `robots=noindex,nofollow`.
- A página exibe textos indexáveis (HTML sem depender de APIs para apresentação), headings semânticos, títulos/descrições, Open Graph, Twitter e dados estruturados `Organization` / catálogo de serviços.
- Novo conteúdo-chave: Business Plan, estudo de viabilidade econômico-financeira, consultoria estratégica, auditoria, venture builder, desenvolvimento de plataforma IA, consultores e auditores associados e FAQ.
- Imagem editorial WebP (ilustrativa), com `alt`, `width` / `height`, `decoding=async`, `loading=lazy`.
- MP4 e MP3 retirados do `index.html` e servidos como arquivos de mídia independentes/cacheáveis; a página inicial fica significativamente menor.
- **Nenhum dado estatístico, certificação, depoimento ou resultado financeiro foi inventado**.

## Checklist obrigatório antes de publicar
1. Confirmar nome comercial definitivo da marca: nos ZIPs a grafia é `PatroAI`, enquanto o briefing utiliza `PatrioAI`. Padronizar somente após decisão oficial.
2. Confirmar domínio canônico HTTPS da landing, idioma principal e URLs públicas reais. Só então configurar `rel=canonical`, `og:url`, `og:image` com URL absoluta, OpenGraph e sitemap.xml.
3. Revisar endereço, founder e descrição organizacional no JSON-LD preexistente; validar elementos e vínculos com equipe legal/marketing.
4. Em **ambiente público autorizado**, remover `noindex,nofollow` do HTML e verificar que nenhum `X-Robots-Tag` bloqueia indexação. Staging deve continuar `noindex`.
5. Validar e publicar `robots.txt`, `sitemap.xml` com URLs reais, integração Search Console, medição consentida e monitoramento de indexação sem coleta indevida de dados.
6. Repassar copy, promessas comerciais, CV dos associados, termos para investidores e eventuais restrições regulatórias por revisão jurídica.
7. Testar Web Vitals (LCP/CLS/INP) em mobile e desktop **no domínio real** e revisar cache/compressão (Brotli/gzip/Cache-Control); não declarar scores sem dados.
8. Validar funcionamento e segurança do chat público no mesmo domínio, sem convidar visitantes a inserir dados confidenciais.
9. Confirmar propriedade/licenciamento da mídia de abertura e áudio existentes; imagem editorial adicional é conceitual.
10. Aprovação AO-01 + gate humano para merge e deploy, monitoramento pós-publicação e rollback.

## Palavras-chave e intenção de busca (sem keyword stuffing)
- Estratégia / descoberta: business plan, elaboração de plano de negócios, estudo de viabilidade econômico-financeira, consultoria estratégica, planejamento empresarial.
- Tecnologia / decisão: plataforma de IA empresarial, agentes especializados, orquestração multiagente, desenvolvimento de software com IA, privacidade de dados empresariais.
- Negócio / parceria: venture builder, criação e desenvolvimento de startups, holding tecnológica, governança de investidores.
- Especialistas: consultores associados, auditoria empresarial, auditoria de IA, equipe multidisciplinar de consultoria.
- Estruturar artigos/estudos públicos somente após obter casos, metodologias e referências verificáveis, com consentimento para publicação.

## Princípios de informação
- Não comparar IA própria com "IAs tradicionais" usando alegações técnicas absolutas sem benchmark.
- Banco próprio não prova processamento local: confirmar fluxos externos, controles tenant, logs, retenção e contratos.
- O Business Plan aumenta disciplina de execução, mas não é garantia de sucesso, investimento ou retorno.
- Módulo de governança exibido é **demonstração conceitual**, não acesso real de investidores.

## Build público opcional (somente após aprovação explícita)
O pacote de origem permanece `noindex` por segurança. Para gerar um candidato público
indexável em diretório separado **depois que o domínio HTTPS real for confirmado
e houver aprovação humana**:

```sh
python scripts/build_public_seo.py --site-url https://DOMINIO-OFICIAL-APROVADO --approve-public --output /caminho/dist-seo
```

O script rejeita staging, localhost, URLs com credenciais e pastas de destino não vazias.
Gera canonical, Open Graph absoluto, imagem social, `robots.txt` e `sitemap.xml`.
Esse comando **não faz deploy** e não substitui revisão jurídica, auditoria AO-01 ou configuração de Nginx/Railway.

## Testes locais
```sh
node tests/test_venture_seo.cjs
```
Depois verificar visual/teclado em navegador e executar a suíte de regressão aplicável.
