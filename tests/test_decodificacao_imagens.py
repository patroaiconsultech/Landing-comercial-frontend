"""Validação real de mídia local (Pillow>=10): estrutura + decodificação completa.

Execução isolada: python -m pytest -q tests/test_decodificacao_imagens.py
Não altera mídia, HTML, backend, schema nem configurações de produção.
"""
from pathlib import Path

import pytest

try:
    from PIL import Image, ImageFile, UnidentifiedImageError
except ImportError as exc:
    raise RuntimeError(
        "Este teste de qualidade exige Pillow (ex.: python -m pip install 'Pillow>=10,<13')."
    ) from exc

ROOT = Path(__file__).resolve().parents[1]
ImageFile.LOAD_TRUNCATED_IMAGES = False

ASSETS = (
    ("patroai-hero-humano-ia.jpg", "JPEG"),
    ("retrato-fundador-patroai.jpg", "JPEG"),
    ("hero-executivo-patroai.jpg", "JPEG"),  # preservado para rollback
    ("patroai-inteligencia-negocios.webp", "WEBP"),
)


def decode_entire_asset(path: Path, expected_format: str) -> tuple[int, int]:
    # verify() valida a estrutura; load() decodifica todos os pixels.
    with Image.open(path) as probe:
        assert probe.format == expected_format
        probe.verify()
    with Image.open(path) as decoded:
        assert decoded.format == expected_format
        decoded.load()
        assert decoded.width >= 100 and decoded.height >= 100
        return decoded.size


@pytest.mark.parametrize(("filename", "expected_format"), ASSETS)
def test_local_image_fully_decodes(filename: str, expected_format: str) -> None:
    assert (ROOT / filename).is_file(), f"Imagem ausente: {filename}"
    decode_entire_asset(ROOT / filename, expected_format)


def test_rejects_jpeg_markers_without_image_data(tmp_path: Path) -> None:
    fake = tmp_path / "fake.jpg"
    fake.write_bytes(b"\xff\xd8" + (b"\0" * 20_000) + b"\xff\xd9")
    with pytest.raises((UnidentifiedImageError, OSError)):
        decode_entire_asset(fake, "JPEG")


def test_rejects_truncated_real_jpeg(tmp_path: Path) -> None:
    original = (ROOT / "patroai-hero-humano-ia.jpg").read_bytes()
    truncated = tmp_path / "truncated.jpg"
    truncated.write_bytes(original[: len(original) // 2])
    with pytest.raises((UnidentifiedImageError, OSError)):
        decode_entire_asset(truncated, "JPEG")
