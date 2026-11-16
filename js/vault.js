/* Anexo B — grafo + lector de notas del vault de Obsidian.
 * Los datos vienen de vault/vault.js, que genera tools/sync_vault.py. */
(function () {
  "use strict";
  const V = window.VAULT;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reader = $("#reader");
  const canvas = $("#graph");
  if (!V || !V.notes || !V.notes.length) {
    $("#vault-stats").textContent = "vault sin sincronizar: ejecutá tools/sync_vault.py";
    return;
  }

  /* ---------- Tipos de nodo ---------- */
  const TYPES = {
    maquina: { c: "#9fef00", label: "máquina" },
    vulnerabilidad: { c: "#ff3b6b", label: "vulnerabilidad" },
    concepto: { c: "#4cc9f0", label: "concepto" },
    herramienta: { c: "#ffd23f", label: "herramienta" },
    curso: { c: "#b39dff", label: "curso" },
    nota: { c: "#dbe3dd", label: "nota" },
    tag: { c: "#8a7be0", label: "#tag" },
    mitre: { c: "#ff8a3d", label: "ATT&CK" },
    cwe: { c: "#e0b84c", label: "CWE" },
    ghost: { c: "#55605a", label: "sin crear" },
    redacted: { c: "#ff3b6b", label: "conexión embargada" }
  };
  const noteType = (n) => {
    const t = String(n.props.tipo || "").toLowerCase().replace("á", "a");
    if (TYPES[t]) return t;
    if (/m[aá]quinas/i.test(n.folder)) return "maquina";
    if (/vulnerab/i.test(n.folder)) return "vulnerabilidad";
    if (/concepto/i.test(n.folder)) return "concepto";
    if (/herramienta/i.test(n.folder)) return "herramienta";
    if (/curso/i.test(n.folder)) return "curso";
    return "nota";
  };

  /* ---------- Construcción del grafo ---------- */
  const byName = new Map(V.notes.map((n) => [n.id.toLowerCase(), n]));
  // Backlinks: para cada nota, qué otras notas la enlazan (wikilinks entrantes).
  const backlinks = new Map();
  V.notes.forEach((n) => (n.links || []).forEach((t) => {
    const k = t.toLowerCase();
    (backlinks.get(k) || backlinks.set(k, []).get(k)).push(n.id);
  }));
  const nodes = [], edges = [], index = new Map();
  const addNode = (id, label, type, note) => {
    if (index.has(id)) return index.get(id);
    const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 120;
    const n = { id, label, type, note, x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0, deg: 0 };
    index.set(id, n); nodes.push(n); return n;
  };
  const link = (a, b) => { if (a === b) return; if (edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))) return; edges.push({ a, b }); a.deg++; b.deg++; };
  V.notes.forEach((n) => addNode("n:" + n.id.toLowerCase(), n.title, noteType(n), n));
  V.notes.forEach((n) => {
    const src = index.get("n:" + n.id.toLowerCase());
    (n.links || []).forEach((t) => {
      const tgt = byName.get(t.toLowerCase());
      link(src, tgt ? index.get("n:" + t.toLowerCase()) : addNode("g:" + t.toLowerCase(), t, "ghost"));
    });
    (n.tags || []).forEach((t) => link(src, addNode("t:" + t.toLowerCase(), "#" + t, "tag")));
    const mitre = n.props.mitre; (Array.isArray(mitre) ? mitre : mitre ? [mitre] : []).forEach((m) => link(src, addNode("m:" + m, "ATT&CK " + m, "mitre")));
    const cwe = n.props.cwe; (Array.isArray(cwe) ? cwe : cwe ? [cwe] : []).forEach((c) => link(src, addNode("c:" + c, String(c), "cwe")));
  });
  // Máquinas embargadas: se ven conectadas a nodos tachados (el sync solo publica cuántos hay, no cuáles).
  V.notes.filter((n) => n.embargo && n.hiddenLinks > 0).forEach((n) => {
    const src = index.get("n:" + n.id.toLowerCase());
    for (let i = 0; i < n.hiddenLinks; i++) {
      const x = addNode(`x:${n.id.toLowerCase()}:${i}`, "████████", "redacted");
      x.owner = n.id;
      link(src, x);
    }
  });

  const nLinks = V.notes.reduce((s, n) => s + (n.links || []).length + (n.hiddenLinks || 0), 0);
  const gen = new Date(V.generated);
  $("#vault-stats").textContent = `${V.notes.length} notas · ${nLinks} enlaces · ${nodes.length} nodos · sync ${gen.toLocaleDateString("es-AR")}`;
  const used = [...new Set(nodes.map((n) => n.type))];
  $("#vault-legend").innerHTML = used.map((t) => `<span><i style="background:${TYPES[t].c}"></i>${TYPES[t].label}</span>`).join("") +
    (V.notes.some((n) => n.embargo) ? `<span><i style="background:#ff3b6b;outline:2px solid #000;outline-offset:-5px"></i>embargada</span>` : "");

  /* ---------- Simulación de fuerzas ---------- */
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1, scale = 1, alpha = 1, hover = null, selected = null, drag = null, moved = false;
  const radius = (n) => (n.note ? 7 + Math.min(n.deg, 8) * 1.1 : n.type === "ghost" ? 4.5 : 4.5 + Math.min(n.deg, 5) * 0.6);
  function resize() {
    const r = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    scale = Math.min(W, H) / 430;
    alpha = Math.max(alpha, 0.3);
  }
  function step() {
    const k = alpha;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy || 0.01;
        const f = (a.note && b.note ? 2600 : 1300) / d2;
        const d = Math.sqrt(d2); dx /= d; dy /= d;
        a.vx -= dx * f * k; a.vy -= dy * f * k; b.vx += dx * f * k; b.vy += dy * f * k;
      }
    }
    edges.forEach(({ a, b }) => {
      const L = a.note && b.note ? 120 : 70;
      let dx = b.x - a.x, dy = b.y - a.y; const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - L) * 0.02 * k; dx /= d; dy /= d;
      a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
    });
    const lx = (W / 2 - 24) / scale, ly = (H / 2 - 28) / scale;
    nodes.forEach((n) => {
      n.vx -= n.x * 0.006 * k; n.vy -= n.y * 0.006 * k;
      if (n === drag) { n.vx = n.vy = 0; return; }
      n.vx *= 0.82; n.vy *= 0.82;
      n.x += n.vx; n.y += n.vy;
      if (lx > 0 && ly > 0) { n.x = Math.max(-lx, Math.min(lx, n.x)); n.y = Math.max(-ly, Math.min(ly, n.y)); }
    });
    alpha = Math.max(0.02, alpha * 0.992);
  }
  const toScreen = (n) => [W / 2 + n.x * scale, H / 2 + n.y * scale];
  const neighbors = (n) => new Set(edges.flatMap((e) => (e.a === n ? [e.b] : e.b === n ? [e.a] : [])));
  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const focus = hover || selected;
    const nb = focus ? neighbors(focus) : null;
    edges.forEach(({ a, b }) => {
      const on = focus && (a === focus || b === focus);
      ctx.strokeStyle = on ? "rgba(179,157,255,.85)" : focus ? "rgba(120,140,130,.12)" : "rgba(120,140,130,.32)";
      ctx.lineWidth = on ? 1.6 : 1;
      const [x1, y1] = toScreen(a), [x2, y2] = toScreen(b);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    nodes.forEach((n) => {
      const [x, y] = toScreen(n);
      const r = radius(n);
      const dim = focus && n !== focus && !nb.has(n);
      const col = n.note && n.note.embargo ? "#ff3b6b" : TYPES[n.type].c;
      ctx.globalAlpha = dim ? 0.22 : 1;
      if (n === selected) { ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      if (n.type === "ghost") { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke(); }
      else { ctx.fillStyle = col; ctx.fill(); }
      if ((n.note && n.note.embargo) || n.type === "redacted") { ctx.fillStyle = "#000"; ctx.fillRect(x - r * 0.7, y - 1.5, r * 1.4, 3); }
      const showLabel = n.note || n === hover || (nb && nb.has(n)) || n.type === "mitre" || n.type === "cwe" || n.type === "redacted";
      if (showLabel) {
        ctx.font = `${n.note ? 600 : 500} ${n.note ? 12 : 11}px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = n.note ? "#e9efe9" : "#9aa79f";
        ctx.fillText(n.label, x, y + r + 14);
      }
      ctx.globalAlpha = 1;
    });
  }
  function loop() { if (alpha > 0.021 || drag) step(); draw(); requestAnimationFrame(loop); }

  function pick(ev) {
    const r = canvas.getBoundingClientRect();
    const mx = ev.clientX - r.left, my = ev.clientY - r.top;
    let best = null, bd = 1e9;
    nodes.forEach((n) => { const [x, y] = toScreen(n); const d = Math.hypot(x - mx, y - my); if (d < radius(n) + 8 && d < bd) { bd = d; best = n; } });
    return { n: best, mx, my };
  }
  canvas.addEventListener("pointerdown", (e) => {
    const { n } = pick(e); if (!n) return;
    drag = n; moved = false; canvas.setPointerCapture(e.pointerId); canvas.classList.add("dragging");
  });
  canvas.addEventListener("pointermove", (e) => {
    const { n, mx, my } = pick(e);
    if (drag) {
      drag.x = (mx - W / 2) / scale; drag.y = (my - H / 2) / scale; moved = true; alpha = Math.max(alpha, 0.35);
    } else { hover = n; canvas.style.cursor = n ? "pointer" : "grab"; }
  });
  const endDrag = () => {
    if (drag && !moved) { if (drag.note) openNote(drag.note.id, true); else if (drag.owner) openNote(drag.owner, true); else { selected = drag; } }
    drag = null; canvas.classList.remove("dragging");
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => { hover = null; });

  /* ---------- Render de Markdown estilo Obsidian ---------- */
  const IMG = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
  function preprocess(md) {
    const parts = md.split(/(```[\s\S]*?```)/g);
    return parts.map((chunk, i) => {
      if (i % 2) return chunk; // bloque de código: no tocar
      let s = chunk;
      s = s.replace(/%%[\s\S]*?%%/g, "");
      // flashcards  pregunta::respuesta
      s = s.replace(/(?:^[^\n`|]+?:{2,3}[^\n]+$\n?)+/gm, (block) => {
        const cards = block.trim().split("\n").map((l) => l.split(/:{2,3}/));
        return `\n<div class="fc-grid">${cards.map(([q, a]) => `<div class="fc" tabindex="0"><div class="fc__in"><div class="fc__q">${esc(q.trim())}</div><div class="fc__a">${esc((a || "").trim())}</div></div></div>`).join("")}</div>\n<p class="fc-hint">↻ flashcards de repaso espaciado · clic para dar vuelta</p>\n`;
      });
      s = s.replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (_, t) => IMG.test(t) ? `<img src="vault/assets/${encodeURIComponent(t.trim())}" alt="${esc(t)}" loading="lazy">` : wikilink(t));
      s = s.replace(/\[\[([^\]|#]+)(#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, t, h, a) => wikilink(t, a));
      s = s.replace(/==([^=\n]+)==/g, "<mark>$1</mark>");
      s = s.replace(/(^|[\s(])#([\p{L}\d_][\p{L}\d_/-]*)/gmu,(_, pre, tag) => `${pre}<span class="chip">#${esc(tag)}</span>`);
      return s;
    }).join("");
  }
  function wikilink(target, alias) {
    const t = target.trim();
    const n = byName.get(t.toLowerCase());
    const text = esc((alias || t).trim());
    return n ? `<a class="wl" data-note="${esc(n.id)}" href="#nota/${encodeURIComponent(n.id)}">${text}</a>` : `<span class="ghost" title="Nota todavía no creada">${text}</span>`;
  }
  function postprocess(root) {
    root.querySelectorAll("blockquote").forEach((bq) => {
      const p = bq.querySelector("p");
      const m = p && p.innerHTML.match(/^\s*\[!(\w+)\][+-]?\s*([^\n<]*)/);
      if (!m) return;
      const type = m[1].toLowerCase();
      p.innerHTML = p.innerHTML.replace(m[0], "").replace(/^\s*(<br>)?\s*/, "");
      const div = document.createElement("div");
      div.className = `callout callout--${type}`;
      div.innerHTML = `<div class="callout__title">${esc(m[2] || type[0].toUpperCase() + type.slice(1))}</div>${bq.innerHTML}`;
      bq.replaceWith(div);
    });
    root.querySelectorAll("li, pre, p").forEach((el) => { if (!el.textContent.trim() && !el.querySelector("img,div")) el.remove(); });
    root.querySelectorAll("table").forEach((t) => {
      const allEmpty = [...t.querySelectorAll("tbody td")].every((td) => !td.textContent.trim());
      if (allEmpty && t.querySelector("tbody")) t.querySelector("tbody").remove();
    });
    root.querySelectorAll(".fc").forEach((fc) => {
      const flip = () => fc.classList.toggle("flip");
      fc.addEventListener("click", flip);
      fc.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    });
  }
  function propsTable(n) {
    const rows = Object.entries(n.props).filter(([k, v]) => v !== null && v !== "" && !(Array.isArray(v) && !v.length) && k !== "kanban-plugin");
    if (!rows.length) return "";
    return `<table class="props">${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${Array.isArray(v) ? v.map((x) => `<span class="chip">${esc(x)}</span>`).join("") : esc(v)}</td></tr>`).join("")}</table>`;
  }
  function openNote(id, fromGraph) {
    const n = byName.get(String(id).toLowerCase());
    if (!n) return;
    selected = index.get("n:" + n.id.toLowerCase());
    alpha = Math.max(alpha, 0.08);
    let html = `<div class="note-head"><h1>${esc(n.title)}</h1><span class="note-path">${esc(n.path)}</span></div>${propsTable(n)}`;
    if (n.embargo) {
      html += `<div class="embargo-card"><b>WRITEUP EMBARGADO</b><p>Es una máquina activa de HackTheBox. Las reglas de la plataforma prohíben publicar soluciones de máquinas activas, así que el contenido completo se publica cuando la máquina se retire. Mientras tanto queda en el vault privado.</p><p class="muted mono">██████████ ████ ███████████ ██████ ███ ████████</p></div>`;
    } else if (window.marked) {
      html += window.marked.parse(preprocess(n.body), { gfm: true });
    } else {
      html += `<pre>${esc(n.body)}</pre>`;
    }
    const bl = [...new Set(backlinks.get(n.id.toLowerCase()) || [])].filter((id) => id.toLowerCase() !== n.id.toLowerCase());
    if (bl.length) {
      html += `<div class="backlinks"><h4>Enlazan a esta nota <span>${bl.length}</span></h4><div class="backlinks__items">` +
        bl.map((id) => { const m = byName.get(id.toLowerCase()); return m ? `<a class="wl bl-chip" data-note="${esc(m.id)}" href="#nota/${encodeURIComponent(m.id)}">${esc(m.title)}</a>` : ""; }).join("") +
        `</div></div>`;
    }
    reader.innerHTML = html;
    postprocess(reader);
    reader.scrollTop = 0;
    document.querySelectorAll(".vault__list button").forEach((b) => b.classList.toggle("on", b.dataset.id === n.id));
    if (!fromGraph && history.replaceState) history.replaceState(null, "", "#nota/" + encodeURIComponent(n.id));
  }
  reader.addEventListener("click", (e) => {
    const a = e.target.closest("a.wl");
    if (a) { e.preventDefault(); openNote(a.dataset.note); return; }
    const img = e.target.closest("img");
    if (img) { e.preventDefault(); openLightbox(img); }
  });

  /* ---------- Visor de imágenes (lightbox) ---------- */
  const lb = document.createElement("div");
  lb.className = "lightbox"; lb.hidden = true;
  lb.innerHTML = '<button class="lb__btn lb__prev" aria-label="Anterior">‹</button>' +
    '<figure class="lb__fig"><img alt=""><figcaption class="lb__cap"></figcaption></figure>' +
    '<button class="lb__btn lb__next" aria-label="Siguiente">›</button>' +
    '<button class="lb__btn lb__close" aria-label="Cerrar">✕</button>';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector("img"), lbCap = lb.querySelector(".lb__cap");
  const lbPrev = lb.querySelector(".lb__prev"), lbNext = lb.querySelector(".lb__next");
  let lbList = [], lbIdx = 0;
  function lbShow(i) {
    if (!lbList.length) return;
    lbIdx = (i + lbList.length) % lbList.length;
    const s = lbList[lbIdx];
    lbImg.src = s.currentSrc || s.src; lbImg.alt = s.alt || "";
    lbCap.textContent = (lbImg.alt ? lbImg.alt + " · " : "") + (lbIdx + 1) + " / " + lbList.length;
    lbImg.classList.remove("zoom"); lb.classList.remove("zoomed");
    const multi = lbList.length > 1;
    lbPrev.style.display = lbNext.style.display = multi ? "" : "none";
  }
  function openLightbox(img) {
    lbList = [...reader.querySelectorAll("img")];
    lbShow(Math.max(0, lbList.indexOf(img)));
    lb.hidden = false; document.body.classList.add("lb-open");
  }
  function closeLightbox() { lb.hidden = true; document.body.classList.remove("lb-open"); lbImg.src = ""; }
  lb.addEventListener("click", (e) => {
    if (e.target.closest(".lb__close")) return closeLightbox();
    if (e.target.closest(".lb__prev")) return lbShow(lbIdx - 1);
    if (e.target.closest(".lb__next")) return lbShow(lbIdx + 1);
    if (e.target === lbImg) { const z = lbImg.classList.toggle("zoom"); lb.classList.toggle("zoomed", z); return; }
    closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") lbShow(lbIdx - 1);
    else if (e.key === "ArrowRight") lbShow(lbIdx + 1);
  });

  /* ---------- Lista de notas por categoría + buscador ---------- */
  const listEl = $("#vault-list"), qInput = $("#vault-q"), countEl = $("#vault-count");
  const catKey = (n) => (String(n.folder || "").split("/")[0] || "zzz Otros");
  const catLabel = (k) => k.replace(/^\d+\s+/, "") || "Otros";
  const noteBtn = (n) => `<button type="button" data-id="${esc(n.id)}"><i style="background:${n.embargo ? "#ff3b6b" : TYPES[noteType(n)].c}"></i>${esc(n.title)}</button>`;
  const haystack = (n) => `${n.title} ${n.body || ""} ${(n.tags || []).join(" ")} ${Object.values(n.props || {}).join(" ")}`.toLowerCase();

  function renderList(q) {
    q = (q || "").trim().toLowerCase();
    const shown = q ? V.notes.filter((n) => haystack(n).includes(q)) : V.notes.slice();
    const groups = new Map();
    shown.forEach((n) => { const k = catKey(n); (groups.get(k) || groups.set(k, []).get(k)).push(n); });
    const keys = [...groups.keys()].sort();
    listEl.innerHTML = keys.length ? keys.map((k) => {
      const notes = groups.get(k).sort((a, b) => a.title.localeCompare(b.title, "es"));
      return `<div class="vcat"><div class="vcat__head">${esc(catLabel(k))}<span>${notes.length}</span></div>
        <div class="vcat__items">${notes.map(noteBtn).join("")}</div></div>`;
    }).join("") : `<p class="vcat__empty mono">Sin resultados para “${esc(q)}”.</p>`;
    const cur = selected && selected.note ? selected.note.id : null;
    if (cur) listEl.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.id === cur));
    countEl.textContent = q ? `${shown.length}/${V.notes.length}` : `${V.notes.length} nota${V.notes.length === 1 ? "" : "s"}`;
  }

  renderList("");
  if (qInput) qInput.addEventListener("input", () => renderList(qInput.value));
  listEl.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) openNote(b.dataset.id); });

  /* ---------- Arranque ---------- */
  function boot() {
    resize();
    new ResizeObserver(resize).observe(canvas);
    for (let i = 0; i < 260; i++) step(); // pre-asentar el grafo
    alpha = 0.25;
    loop();
    const fromHash = decodeURIComponent((location.hash.match(/^#nota\/(.+)$/) || [])[1] || "");
    const first = fromHash && byName.get(fromHash.toLowerCase())
      ? fromHash
      : [...V.notes].filter((n) => !n.embargo).sort((a, b) => b.body.length - a.body.length)[0]?.id || V.notes[0].id;
    const go = () => { openNote(first, true); if (fromHash) document.getElementById("annex-b").scrollIntoView(); };
    if (window.marked) go(); else window.addEventListener("load", go, { once: true });
  }
  window.addEventListener("hashchange", () => {
    const m = location.hash.match(/^#nota\/(.+)$/);
    if (m) { openNote(decodeURIComponent(m[1]), true); document.getElementById("annex-b").scrollIntoView(); }
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
