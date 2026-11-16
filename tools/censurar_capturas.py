#!/usr/bin/env python
"""
censurar_capturas.py: tapa automáticamente la barra de estado del prompt
(powerlevel10k) en capturas de terminal, para que no se publique la IP
pública/privada ni otros datos de esa franja.

Es determinista (sin IA) e idempotente: detecta la barra por su firma
visual (una banda fina y densa de color con al menos una tira sólida larga)
y pinta un rectángulo negro sobre la parte derecha de esa banda (donde va la
IP). Si una imagen no tiene esa barra, no la toca. Si ya está tapada, no hace
nada (la banda negra deja de ser "color").

Uso:
  python tools/censurar_capturas.py <carpeta-o-imagen> [<otra> ...]

Se usa como primer paso de publicar.ps1: primero tapa, después sincroniza y
sube. Solo usa Pillow + la librería estándar.
"""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("[!] Falta Pillow. Instalá con:  python -m pip install Pillow", file=sys.stderr)
    sys.exit(1)

IMG_EXT = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}

# --- parámetros de detección (calibrados con capturas reales) ---
SAT_DIFF = 40      # (max-min) de RGB para considerar un píxel "de color"
SAT_MAX = 120      # brillo mínimo del canal más alto
ROW_MIN = 60       # píxeles de color por fila para que la fila sea "densa"
RUN_MIN = 90       # tira sólida de color más larga en la banda (clave vs. texto)
BAND_MIN = 12      # alto mínimo de la banda (descarta líneas finas / salida de ls)
BAND_MAX = 45      # alto máximo (descarta bloques altos, p.ej. una selección)
BAR_X = 0.35       # desde qué fracción del ancho se tapa (la IP va a la derecha)
PAD = 2            # píxeles de margen arriba/abajo de la banda


def find_bars(im: "Image.Image"):
    """Devuelve la lista de bandas (y0, y1) que son barras de estado."""
    w, h = im.size
    px = im.load()
    dense, maxrun = [], []
    for y in range(h):
        count = run = mx = 0
        for x in range(w):
            r, g, b = px[x, y][:3]
            if (max(r, g, b) - min(r, g, b)) > SAT_DIFF and max(r, g, b) > SAT_MAX:
                count += 1
                run += 1
                if run > mx:
                    mx = run
            else:
                run = 0
        dense.append(count >= ROW_MIN)
        maxrun.append(mx)

    # agrupar filas densas contiguas (tolerando huecos de hasta 3 px)
    bands = []
    for y in range(h):
        if dense[y]:
            if bands and y - bands[-1][1] <= 3:
                bands[-1][1] = y
            else:
                bands.append([y, y])

    out = []
    for a, b in bands:
        height = b - a + 1
        if BAND_MIN <= height <= BAND_MAX and max(maxrun[a:b + 1]) >= RUN_MIN:
            out.append((a, b))
    return out


def censor_image(path: Path) -> int:
    try:
        im = Image.open(path)
    except Exception as e:
        print(f"    ! no pude abrir {path.name}: {e}")
        return 0
    im = im.convert("RGB")
    bars = find_bars(im)
    if not bars:
        return 0
    w, h = im.size
    x0 = int(w * BAR_X)
    from PIL import ImageDraw
    d = ImageDraw.Draw(im)
    for (a, b) in bars:
        d.rectangle([x0, max(0, a - PAD), w, min(h - 1, b + PAD)], fill=(0, 0, 0))
    # guardar en el mismo formato
    fmt = (path.suffix.lower().lstrip(".") or "png")
    if fmt == "jpg":
        fmt = "jpeg"
    save_kw = {"quality": 92} if fmt in ("jpeg", "webp") else {}
    im.save(path, **save_kw)
    print(f"    * tapada {path.name}: {len(bars)} barra(s)")
    return len(bars)


def iter_images(targets):
    for t in targets:
        p = Path(t)
        if p.is_dir():
            for f in sorted(p.rglob("*")):
                if f.is_file() and f.suffix.lower() in IMG_EXT:
                    yield f
        elif p.is_file() and p.suffix.lower() in IMG_EXT:
            yield p


def main(argv) -> int:
    if not argv:
        print(__doc__.strip())
        return 2
    total_imgs = total_bars = 0
    for f in iter_images(argv):
        total_imgs += 1
        total_bars += censor_image(f)
    print(f"[censura] {total_imgs} imágenes revisadas, {total_bars} barra(s) tapada(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
