#!/usr/bin/env python3
"""Build a static, indexable landing only after human domain/publication approval.
Never changes the source preview (noindex). Offline, stdlib-only.
"""
from __future__ import annotations
import argparse
import json
import re
import shutil
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
ASSETS = [
    "hero-executivo-patroai.jpg",
    "patroai-hero-humano-ia.jpg",
    "retrato-fundador-patroai.jpg",
    "patroai-inteligencia-negocios.webp",
    "patroai-intro.mp4",
    "patroai-ambiente.mp3",
    "handoff-ui.js",
    "diagnosis-ui.js",
    "dashboard.html",
    "dashboard.js",
    "dashboard.css",
]
PROHIBITED_HOST_PARTS = ("localhost", "127.0.0.1", "staging", "preview", ".local")


def validate_site_url(raw: str) -> str:
    parsed = urlsplit(raw)
    if (parsed.scheme != "https" or not parsed.hostname or parsed.port not in (None, 443)
        or parsed.username or parsed.password or parsed.query or parsed.fragment
        or parsed.path not in ("", "/")):
        raise ValueError("Informe a URL pública HTTPS canônica, na raiz, sem query/credenciais.")
    hostname = parsed.hostname.lower()
    if "." not in hostname or any(x in hostname for x in PROHIBITED_HOST_PARTS):
        raise ValueError("Domínio local, staging ou preview não pode ser indexado.")
    return "https://" + hostname


def build(site_url: str, output: Path, approved: bool) -> None:
    if not approved:
        raise ValueError("Publicação não autorizada: requer --approve-public.")
    base = validate_site_url(site_url)
    output = output.resolve()
    if ROOT == output or ROOT in output.parents:
        raise ValueError("Não gerar saída dentro da pasta-fonte.")
    if output.exists() and any(output.iterdir()):
        raise ValueError("Diretório de saída não está vazio; proteja os artefatos existentes.")
    output.mkdir(parents=True, exist_ok=True)
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    match = re.search(r'<meta content="noindex, nofollow" name="robots"/>', html)
    if not match:
        raise RuntimeError("Gate SEO não localizado; revisão manual obrigatória.")
    html = html[:match.start()] + '<meta name="robots" content="index, follow, max-image-preview:large"/>' + html[match.end():]
    canonical = (f'<link rel="canonical" href="{base}/"/>\n'
                 f'<meta property="og:url" content="{base}/"/>\n'
                 f'<meta property="og:image" content="{base}/patroai-inteligencia-negocios.webp"/>\n'
                 f'<meta name="twitter:image" content="{base}/patroai-inteligencia-negocios.webp"/>\n')
    html = html.replace("</head>", canonical + "</head>", 1)
    # Identity urls are only added to JSON-LD after the domain is approved.
    script_rx = re.compile(r'(<script type="application/ld\+json">)([\s\S]*?)(</script>)')
    def organization_url(m: re.Match) -> str:
        obj = json.loads(m.group(2))
        if obj.get("@type") == "Organization":
            obj["url"] = base + "/"
        return m.group(1) + "\n" + json.dumps(obj, ensure_ascii=False, indent=2) + "\n" + m.group(3)
    html = script_rx.sub(organization_url, html)
    (output / "index.html").write_text(html, encoding="utf-8")
    for file in ASSETS:
        shutil.copy2(ROOT / file, output / file)
    (output / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {base}/sitemap.xml\n")
    (output / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'  <url><loc>{base}/</loc></url>\n</urlset>\n'
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site-url", required=True, help="Domínio canônico aprovado, ex.: https://EXEMPLO")
    parser.add_argument("--approve-public", action="store_true", help="Gate humano explícito.")
    parser.add_argument("--output", type=Path, default=ROOT.parent / "patroai-public-build")
    args = parser.parse_args()
    build(args.site_url, args.output, args.approve_public)


if __name__ == "__main__":
    main()
