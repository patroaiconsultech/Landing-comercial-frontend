"""R3 scoped UX contracts; browser assertions in separate evidence runner."""
from pathlib import Path
from html.parser import HTMLParser
import re
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/"index.html").read_text(encoding="utf-8")
def test_mobile_selector_and_reduced_motion():
    css=HTML.split('<style id="signature-r3-style">',1)[1].split("</style>",1)[0]
    assert "flex-wrap:nowrap" in css and "white-space:nowrap" in css
    assert "min-height:44px" in css and "prefers-reduced-motion:reduce" in css
    assert 'header .locale-button:focus-visible' in css
def test_readonly_shortcut_and_translations():
    assert 'href="#signature-solutions" data-sig3="explore"' in HTML
    js=HTML.split('<script id="signature-r3-experience">',1)[1].split("</script>",1)[0]
    assert all(value in js for value in ("Explorar todas as soluções","Explore all solutions","Explorar todas las soluciones"))
    assert "textContent" in js and not any(value in js for value in ("fetch(","innerHTML","localStorage","submit(",".click("))
def test_original_agent_and_founder_present():
    assert 'id="pa-consent"' in HTML and 'id="pa-send"' in HTML
    assert 'Daniel Graebin' in HTML and 'Daniel Gomes' not in HTML
    assert 'content="noindex, nofollow" name="robots"' in HTML
