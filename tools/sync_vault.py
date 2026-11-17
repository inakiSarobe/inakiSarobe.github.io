#!/usr/bin/env python
"""
sync_vault.py: conecta el vault de Obsidian con el portfolio (Anexo B).

Lee las notas de las carpetas publicables del vault y genera:
  vault/vault.js     -> window.VAULT = {...}  (notas, propiedades, tags, enlaces)
  vault/assets/*     -> imágenes embebidas con ![[...]]

Reglas de publicación (pensadas para no romper las reglas de HTB ni filtrar nada privado):
  * Solo se leen las carpetas de INCLUDE (Plantillas, Diario, Inbox, etc. quedan afuera).
  * `publicar: false` en el frontmatter excluye la nota por completo.
  * Máquinas de HackTheBox (tipo: maquina + plataforma: HackTheBox) se publican EMBARGADAS
    (solo metadatos, sin cuerpo ni imágenes) hasta que les pongas `retirada: true`.
  * Toda mención a una máquina embargada en otras notas ([[Nombre]] o el nombre en texto)
    se reemplaza por una barra de censura.
  * Se eliminan comentarios de Obsidian (%% ... %%) y la propiedad `ip`.

Uso:
  python tools/sync_vault.py                      # usa la ruta por defecto
  python tools/sync_vault.py --vault "D:/OtraRuta/Vault"
Solo usa la librería estándar de Python.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_VAULT = Path(r"C:\Programacion\Cybersecurity\Cybersecurity")
INCLUDE = ["01 Conceptos", "02 Herramientas", "03 Máquinas y CTF", "04 Vulnerabilidades", "05 Cursos"]
STRIP_PROPS = {"ip", "publicar", "kanban-plugin"}
IMG_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"}
EMBARGO_HTML = '<span class="embargo" title="Máquina activa de HTB: embargada hasta su retiro">████████</span>'
# Red de seguridad manual: imágenes (nombre en minúscula) que NO se publican (se reemplazan
# por un aviso). La censura de la barra del prompt se hace sola con tools/censurar_capturas.py
# al publicar; esta lista queda por si alguna vez querés forzar que una captura no salga.
REDACT_PENDING = set()
REDACT_HTML = '<div class="redact-pending">🔒 Captura pendiente de censura — se publica cuando la tape</div>'

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "vault"
ASSETS = OUT_DIR / "assets"


def stamp_cache_version(build: str) -> bool:
    """Reescribe ?v=... en los assets locales (.js/.css) de index.html para
    bustear la caché del navegador en cada publicación. Deja intacto el CDN
    (marked), que no lleva ?v=."""
    idx = ROOT / "index.html"
    if not idx.exists():
        return False
    html = idx.read_text(encoding="utf-8")
    new = re.sub(r'(\.(?:js|css))\?v=[0-9A-Za-z_.]+(")', rf"\1?v={build}\2", html)
    if new != html:
        idx.write_text(new, encoding="utf-8")
        return True
    return False


# ---------------------------------------------------------------- frontmatter
def _scalar(v: str):
    v = v.strip()
    if v == "" or v.lower() in {"null", "~"}:
        return None
    if (v[0] == v[-1]) and v[0] in "\"'" and len(v) >= 2:
        return v[1:-1]
    if v.startswith("[") and v.endswith("]"):
        return [x.strip().strip("\"'") for x in v[1:-1].split(",") if x.strip()]
    if v.lower() in {"true", "false"}:
        return v.lower() == "true"
    return v


def parse_note(text: str) -> tuple[dict, str]:
    """Separa el frontmatter YAML (subconjunto simple) del cuerpo."""
    if not text.startswith("---"):
        return {}, text
    m = re.match(r"^---\s*\n(.*?)\n---\s*(?:\n|$)", text, re.S)
    if not m:
        return {}, text
    props: dict = {}
    key = None
    for line in m.group(1).splitlines():
        if not line.strip():
            continue
        item = re.match(r"^\s+-\s*(.*)$", line)
        if item and key:
            if not isinstance(props.get(key), list):
                props[key] = []
            val = _scalar(item.group(1))
            if val is not None:
                props[key].append(val)
            continue
        kv = re.match(r"^([^:#][^:]*):\s*(.*)$", line)
        if kv:
            key = kv.group(1).strip()
            props[key] = _scalar(kv.group(2))
    return props, text[m.end():]


# ---------------------------------------------------------------- helpers
WIKILINK = re.compile(r"(?<!!)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]")
EMBED = re.compile(r"!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]")
FENCE = re.compile(r"(```.*?```)", re.S)
INLINE_TAG = re.compile(r"(?:^|(?<=[\s(]))#([^\W\d][\w/-]*)", re.U)


def outside_code(body: str, fn):
    """Aplica fn solo a los tramos que no son bloques de código."""
    parts = FENCE.split(body)
    return "".join(p if i % 2 else fn(p) for i, p in enumerate(parts))


def is_true(v) -> bool:
    return v is True or str(v).strip().lower() in {"true", "si", "sí", "yes", "1"}


def is_embargoed(props: dict) -> bool:
    tipo = str(props.get("tipo") or "").lower().replace("á", "a")
    plat = str(props.get("plataforma") or "").lower().replace(" ", "")
    if tipo == "maquina" and ("hackthebox" in plat or plat == "htb"):
        return not is_true(props.get("retirada"))
    return False


def as_list(v) -> list:
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


# ---------------------------------------------------------------- main
def main() -> int:
    ap = argparse.ArgumentParser(description="Sincroniza el vault de Obsidian con el portfolio.")
    ap.add_argument("--vault", type=Path, default=DEFAULT_VAULT)
    args = ap.parse_args()
    vault: Path = args.vault
    if not vault.is_dir():
        print(f"[!] No encuentro el vault en {vault}", file=sys.stderr)
        return 1

    # índice de archivos del vault por nombre (para resolver ![[imagen.webp]])
    files_by_name = {}
    for f in vault.rglob("*"):
        if f.is_file() and ".obsidian" not in f.parts and ".git" not in f.parts:
            files_by_name.setdefault(f.name.lower(), f)

    raw = []
    for folder in INCLUDE:
        base = vault / folder
        if not base.is_dir():
            continue
        for md in sorted(base.rglob("*.md")):
            props, body = parse_note(md.read_text(encoding="utf-8"))
            if props.get("publicar") is not None and not is_true(props.get("publicar")):
                print(f"    - excluida (publicar: false): {md.stem}")
                continue
            raw.append((md, props, body))

    published_names = {md.stem.lower() for md, _, _ in raw}
    all_stems = {f.stem.lower() for f in vault.rglob("*.md") if ".obsidian" not in f.parts}
    embargoed = {md.stem for md, props, _ in raw if is_embargoed(props)}
    emb_lower = {e.lower() for e in embargoed}
    emb_text_re = re.compile(r"\b(" + "|".join(re.escape(e) for e in embargoed) + r")\b", re.I) if embargoed else None

    # Conexiones de cada máquina embargada con notas publicadas (en cualquier dirección).
    # Solo se publica CUÁNTAS hay, no cuáles: el grafo la muestra conectada a nodos tachados
    # sin revelar la solución. Al marcarla `retirada: true` aparecen los enlaces reales.
    def raw_targets(text: str) -> set:
        return {m.group(1).strip().lower() for m in WIKILINK.finditer(FENCE.sub("", text))}

    targets_by_note = {md.stem.lower(): raw_targets(body) for md, _, body in raw}
    hidden_links = {}
    for e in embargoed:
        el = e.lower()
        out = {t for t in targets_by_note.get(el, set()) if t in published_names and t not in emb_lower}
        back = {n for n, ts in targets_by_note.items() if el in ts and n not in emb_lower}
        hidden_links[e] = len(out | back)

    if ASSETS.exists():
        shutil.rmtree(ASSETS)
    ASSETS.mkdir(parents=True, exist_ok=True)

    notes, copied = [], set()
    for md, props, body in raw:
        rel = md.relative_to(vault).as_posix()
        name = md.stem
        emb = name in embargoed
        clean_props = {k: v for k, v in props.items() if k not in STRIP_PROPS}

        if emb:
            keep = {k: clean_props.get(k) for k in ("tipo", "plataforma", "dificultad", "so", "estado", "inicio") if clean_props.get(k)}
            notes.append({
                "id": name, "title": name, "path": rel, "folder": md.parent.relative_to(vault).as_posix(),
                "props": keep, "tags": [str(t) for t in as_list(props.get("tags"))], "links": [],
                "embargo": True, "body": "", "hiddenLinks": hidden_links.get(name, 0),
                "mtime": datetime.fromtimestamp(md.stat().st_mtime, timezone.utc).isoformat(),
            })
            print(f"    # embargada (máquina activa de HTB): {name}  ({hidden_links.get(name, 0)} conexiones tachadas)")
            continue

        def transform(chunk: str) -> str:
            chunk = re.sub(r"%%.*?%%", "", chunk, flags=re.S)

            def embed(m):
                target = m.group(1).strip()
                if any(e in target.lower() for e in emb_lower):
                    return EMBARGO_HTML
                name_l = Path(target).name.lower()
                if name_l in REDACT_PENDING:
                    return REDACT_HTML
                src = files_by_name.get(name_l)
                if src and src.suffix.lower() in IMG_EXT:
                    shutil.copy2(src, ASSETS / src.name)
                    copied.add(src.name)
                    return f"![[{src.name}]]"
                return m.group(0)

            chunk = EMBED.sub(embed, chunk)

            def wl(m):
                target = m.group(1).strip().lower()
                if target in emb_lower:
                    return EMBARGO_HTML
                if target in all_stems and target not in published_names:
                    return m.group(2) or m.group(1)  # nota privada: queda como texto, sin enlace
                return m.group(0)

            chunk = WIKILINK.sub(wl, chunk)
            if emb_text_re:
                # censurar menciones en texto plano, sin tocar el HTML de censura ya insertado
                pieces = re.split(r"(<span class=\"embargo\".*?</span>)", chunk)
                chunk = "".join(p if p.startswith('<span class="embargo"') else emb_text_re.sub(EMBARGO_HTML, p) for p in pieces)
            return chunk

        body = outside_code(body, transform).strip() + "\n"

        links, seen = [], set()
        for m in WIKILINK.finditer(outside_code(body, lambda s: s)):
            t = m.group(1).strip()
            if t.lower() not in seen and t.lower() != name.lower():
                seen.add(t.lower())
                links.append(t)
        tags = [str(t) for t in as_list(props.get("tags"))]
        stripped = FENCE.sub("", body)
        for t in INLINE_TAG.findall(stripped):
            if t not in tags:
                tags.append(t)

        notes.append({
            "id": name, "title": name, "path": rel, "folder": md.parent.relative_to(vault).as_posix(),
            "props": clean_props, "tags": tags, "links": links, "embargo": False, "body": body,
            "mtime": datetime.fromtimestamp(md.stat().st_mtime, timezone.utc).isoformat(),
        })
        print(f"    + publicada: {name}  ({len(links)} enlaces, {len(tags)} tags)")

    data = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "vaultName": vault.name,
        "notes": sorted(notes, key=lambda n: n["mtime"], reverse=True),
        "assets": sorted(copied),
    }
    OUT_DIR.mkdir(exist_ok=True)
    js = "/* Generado por tools/sync_vault.py — no editar a mano */\nwindow.VAULT = " + \
        json.dumps(data, ensure_ascii=False, indent=1, default=str) + ";\n"
    (OUT_DIR / "vault.js").write_text(js, encoding="utf-8")
    print(f"[ok] {len(notes)} notas ({len(embargoed)} embargadas), {len(copied)} imágenes -> {OUT_DIR / 'vault.js'}")
    build = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    if stamp_cache_version(build):
        print(f"[ok] index.html versionado para caché -> ?v={build}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
