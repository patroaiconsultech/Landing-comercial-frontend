"""R3.1 visual-only scope: new atmosphere + existing services preserved."""
from pathlib import Path
from PIL import Image
from hashlib import sha256
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/"index.html").read_text(encoding="utf-8")
def test_atmosphere_asset_and_build_wiring():
    n="signature-hero-atmosphere.webp"
    with Image.open(ROOT/n) as im:
        assert im.format=="WEBP"
        assert im.size==(1600,900)
        im.load()
    assert (ROOT/n).stat().st_size<250_000
    assert 'url("'+n+'")' in HTML
    assert f'COPY {n} /usr/share/nginx/html/{n}' in (ROOT/"Dockerfile").read_text()
    assert f'"{n}"' in (ROOT/"scripts/build_public_seo.py").read_text()
    hashes={line.split(maxsplit=1)[1]:line.split()[0] for line in (ROOT/"SHA256SUMS.txt").read_text().splitlines()}
    assert hashes[n]==sha256((ROOT/n).read_bytes()).hexdigest()
def test_preserved_human_hero_and_mobile_fallback():
    css=HTML.split('<style id="signature-r31-style">',1)[1].split("</style>",1)[0]
    assert '@media(max-width:820px)' in css and '#inicio::before{background:none}' in css
    assert 'prefers-reduced-motion:reduce' in css
    assert 'class="hero-executivo" src="patroai-hero-humano-ia.jpg"' in HTML
    assert 'id="pa-consent"' in HTML and 'id="pa-send"' in HTML
    assert 'content="noindex, nofollow" name="robots"' in HTML
