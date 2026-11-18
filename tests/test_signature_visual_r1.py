"""Signature R1 – offline visual regression contracts."""
import hashlib
import re
from pathlib import Path
from PIL import Image
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
ASSETS=tuple(f"signature-{x}.webp" for x in ("ceo","cto","business","agents","venture","governance","command"))
def test_signature_assets():
    docker=(ROOT/'Dockerfile').read_text()
    seo=(ROOT/'scripts/build_public_seo.py').read_text()
    manifest={line.split(maxsplit=1)[1]:line.split()[0] for line in (ROOT/'SHA256SUMS.txt').read_text().splitlines() if line.strip()}
    for asset in ASSETS:
        p=ROOT/asset
        with Image.open(p) as im:
            assert im.format=="WEBP"
            im.load()
        assert f'src="{asset}"' in HTML
        assert f'COPY {asset} /usr/share/nginx/html/{asset}' in docker
        assert f'"{asset}"' in seo
        assert manifest[asset]==hashlib.sha256(p.read_bytes()).hexdigest()
def test_signature_i18n_and_links():
    assert HTML.count('class="signature-card"')==6
    keys=set(re.findall(r'data-p22="(signature[^"]+)"',HTML))
    assert len(keys)==22
    for key in keys:
        assert len(re.findall(r'"'+re.escape(key)+r'"\s*:',HTML))==3
    targets=re.findall(r'class="signature-card" href="#([^"]+)"',HTML)
    assert len(targets)==6
    assert all(re.search(r'id="'+re.escape(t)+r'"',HTML) for t in targets)
def test_signature_agent_reuses_guarded_widget():
    section=HTML.split('<script id="signature-agent-bridge">',1)[1].split('</script>',1)[0]
    assert "open.click()" in section
    assert "fetch(" not in section and "localStorage" not in section
    assert 'id="pa-consent"' in HTML and 'id="pa-send"' in HTML
    assert 'content="noindex, nofollow" name="robots"' in HTML
    assert 'retrato-fundador-patroai.jpg' in HTML
    assert 'Daniel Graebin' in HTML
    assert 'Daniel Gomes' not in HTML
