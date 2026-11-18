"""Signature Cinematic R2 — asset, navigation and safety contracts."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import re
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/"index.html").read_text(encoding="utf-8")
KEYS=("ceo","cto","business","agents","venture","governance")
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def test_responsive_images_and_build_inclusion():
    docker=(ROOT/"Dockerfile").read_text()
    seo=(ROOT/"scripts/build_public_seo.py").read_text()
    manifest={line.split(maxsplit=1)[1].strip():line.split()[0] for line in (ROOT/"SHA256SUMS.txt").read_text().splitlines()}
    for key in KEYS:
        for width,suffix in [(640,"-640"),(1280,"")]:
            asset=f"signature-{key}{suffix}.webp"
            p=ROOT/asset
            with Image.open(p) as image:
                assert image.format=="WEBP"
                image.load()
                assert image.size==(width,width*9//16)
            assert p.stat().st_size < 300_000
            assert f"COPY {asset} /usr/share/nginx/html/{asset}" in docker
            assert f'"{asset}"' in seo
            assert digest(p)==manifest[asset]
        assert f'srcset="signature-{key}-640.webp 640w, signature-{key}.webp 1280w"' in HTML
    assert len({digest(ROOT/f"signature-{key}.webp") for key in KEYS})==6

def test_six_panels_and_three_languages():
    assert re.findall(r'data-signature-service="(\d)"',HTML)==list("012345")
    section=HTML.split('<script id="signature-r2-experience">',1)[1].split("</script>",1)[0]
    content=json.loads(re.search(r"const content=(\{[^\n]+\});",section).group(1))
    assert set(content)=={"pt","en","es"}
    for locale, data in content.items():
        assert len(data["items"])==6
        assert len(data["items"][0][2])==5
        for item in data["items"]:
            assert len(item)==4 and all(item) and len(item[3])<1200
    assert '<dialog id="signature-detail" aria-labelledby="signature-detail-title">' in HTML
    assert "modal.showModal()" in section and "modal.close()" in section
    assert "opener.focus()" in section
    assert "textContent" in section and "innerHTML" not in section

def test_agent_guard_and_preserved_search_gate():
    section=HTML.split('<script id="signature-r2-experience">',1)[1].split("</script>",1)[0]
    assert "if(!input.value.trim())" in section
    assert "if(panel.hidden)open.click()" in section
    assert "send.click" not in section and "submit(" not in section
    assert "fetch(" not in section and "localStorage" not in section
    assert "pa-consent" not in section
    assert 'content="noindex, nofollow" name="robots"' in HTML
    assert 'Daniel Graebin' in HTML
    assert 'Daniel Gomes' not in HTML
    assert 'id="pa-consent"' in HTML
