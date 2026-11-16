from importlib.machinery import SourceFileLoader
from pathlib import Path
from tempfile import TemporaryDirectory
import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "build_public_seo.py"
from importlib.util import spec_from_file_location, module_from_spec
spec = spec_from_file_location("build_public_seo", SCRIPT)
seo = module_from_spec(spec)
spec.loader.exec_module(seo)


def test_build_seo_gate_and_metadata():
    with TemporaryDirectory() as d:
        out = Path(d) / "built"
        with pytest.raises(ValueError):
            seo.build("https://example.org", out, False)
        for url in ["http://example.org", "https://staging.example.org",
                    "https://localhost", "https://user:pass@example.org"]:
            with pytest.raises(ValueError):
                seo.validate_site_url(url)
        seo.build("https://example.org", out, True)
        html = (out / "index.html").read_text(encoding="utf-8")
        assert '<link rel="canonical" href="https://example.org/"/>' in html
        assert 'content="index, follow, max-image-preview:large"' in html
        assert 'https://example.org/patroai-inteligencia-negocios.webp' in html
        assert 'https://example.org/sitemap.xml' in (out / "robots.txt").read_text()
        assert "https://example.org/" in (out / "sitemap.xml").read_text()
        assert (out / "patroai-intro.mp4").exists()
        assert (out / "patroai-ambiente.mp3").exists()
        assert (
            out / "patroai-hero-humano-ia.jpg"
        ).read_bytes() == (
            seo.ROOT / "patroai-hero-humano-ia.jpg"
        ).read_bytes()
