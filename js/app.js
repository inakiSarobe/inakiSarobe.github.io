/* Iñaki Sarobe — portfolio (SPA). Sidebar + rutas + vistas. Sin frameworks. */
(function () {
  "use strict";
  const P = window.PROFILE || {};
  const V = window.VAULT || { notes: [] };
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => String(s).toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-.]/g, "");
  const view = $("#view");

  /* ============ secciones ============ */
  const SECTIONS = [
    { id: "inicio", label: "Inicio", icon: "◆" },
    { id: "capacidades", label: "Capacidades", icon: "★" },
    { id: "htb", label: "CTFs", icon: "▲" },
    { id: "vuln", label: "Vulnerabilidades", icon: "⚑" },
    { id: "proyectos", label: "Proyectos", icon: "◇" },
    { id: "notas", label: "Notas", icon: "#" },
    { id: "contacto", label: "Contacto", icon: "@" }
  ];

  /* ============ datos derivados ============ */
  const noteList = (V.notes || []);
  const byId = new Map(noteList.map((n) => [n.id.toLowerCase(), n]));
  const noteType = (n) => {
    const t = String(n.props && n.props.tipo || "").toLowerCase().replace("á", "a");
    if (t) return t;
    const f = String(n.folder || "").toLowerCase();
    if (/m[aá]quina/.test(f)) return "maquina";
    if (/vulnerab/.test(f)) return "vulnerabilidad";
    if (/concepto/.test(f)) return "concepto";
    if (/herramienta/.test(f)) return "herramienta";
    if (/curso/.test(f)) return "curso";
    return "nota";
  };
  const vulnNotes = () => noteList.filter((n) => noteType(n) === "vulnerabilidad");
  const machineNames = new Set((P.htb && P.htb.machines || []).map((m) => slug(m.name)));

  // Resolver un wikilink [[nombre]] a una ruta interna
  function routeForName(name) {
    const n = byId.get(String(name).toLowerCase());
    if (n) {
      const t = noteType(n);
      if (t === "maquina") return "#/htb/" + slug(n.id);
      if (t === "vulnerabilidad") return "#/vuln/" + slug(n.id);
      return "#/notas/" + slug(n.id);
    }
    if (machineNames.has(slug(name))) return "#/htb/" + slug(name);
    return null;
  }

  /* ============ markdown (notas / writeups) ============ */
  const IMG = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
  function renderMd(md) {
    if (!md) return "";
    if (!window.marked) return `<pre>${esc(md)}</pre>`;
    const parts = String(md).split(/(```[\s\S]*?```)/g);
    let s = parts.map((chunk, i) => {
      if (i % 2) return chunk;
      let x = chunk.replace(/%%[\s\S]*?%%/g, "");
      x = x.replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (_, t) =>
        IMG.test(t) ? `<img src="vault/assets/${encodeURIComponent(t.trim())}" alt="${esc(t)}" loading="lazy">` : t.trim());
      // Tag de mazo de Obsidian (#flashcards/...) -> chip
      x = x.replace(/^#(flashcards[\w/\-]*)[ \t]*$/gim, (_, tag) =>
        `<p class="deck-tag">🂠 Mazo de repaso · <code>#${esc(tag)}</code></p>\n`);
      // Flashcards Obsidian "pregunta::respuesta" -> tarjetas que se dan vuelta
      x = x.replace(/(?:^|\n)((?:[^\n]*::[^\n]*(?:\n|$))+)/g, (block) => {
        const lines = block.trim().split(/\n/).filter((l) => l.includes("::"));
        if (!lines.length) return block;
        const cards = lines.map((l) => {
          const i = l.indexOf("::");
          const q = l.slice(0, i).trim(), a = l.slice(i + 2).trim();
          return `<button class="fc" type="button" aria-label="Mostrar respuesta"><span class="fc__q">${esc(q)}</span><span class="fc__a">${esc(a)}</span></button>`;
        }).join("");
        return `\n\n<div class="fc-grid">${cards}</div>\n\n`;
      });
      x = x.replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, t, a) => {
        const r = routeForName(t.trim()); const label = esc((a || t).trim());
        return r ? `<a href="${r}">${label}</a>` : `<span class="mutxt">${label}</span>`;
      });
      x = x.replace(/==([^=\n]+)==/g, "<mark>$1</mark>");
      return x;
    }).join("");
    let html = window.marked.parse(s, { gfm: true });
    html = html.replace(/<blockquote>\s*<p>\s*\[!(\w+)\]([-+]?)\s*/gi,
      (_, type) => `<blockquote class="callout callout--${type.toLowerCase()}"><p>`);
    return html;
  }
  function propsTable(n) {
    const keep = Object.entries(n.props || {}).filter(([k, v]) => v != null && v !== "" && !["tipo", "tags", "publicar"].includes(k));
    if (!keep.length) return "";
    return `<table class="props">${keep.map(([k, v]) =>
      `<tr><th>${esc(k)}</th><td>${esc(Array.isArray(v) ? v.join(", ") : v)}</td></tr>`).join("")}</table>`;
  }

  /* ============ sidebar ============ */
  function buildSidebar() {
    $("#side-role").textContent = P.headline || "";
    $("#side-nav").innerHTML = SECTIONS.map((s) =>
      `<a class="snav" data-sec="${s.id}" href="#/${s.id}"><i aria-hidden="true">${s.icon}</i>${esc(s.label)}</a>`).join("");
    const L = P.links || {};
    $("#side-foot").innerHTML = `
      <div class="side__links">
        ${L.cvEs ? `<a href="${L.cvEs}" download title="CV (ES)">CV ES</a>` : ""}
        ${L.cvEn ? `<a href="${L.cvEn}" download title="CV (EN)">CV EN</a>` : ""}
      </div>
      <div class="side__social">
        ${L.github ? `<a href="${L.github}" target="_blank" rel="noopener" title="GitHub">GitHub</a>` : ""}
        ${L.linkedin ? `<a href="${L.linkedin}" target="_blank" rel="noopener" title="LinkedIn">LinkedIn</a>` : ""}
        ${L.htb ? `<a href="${L.htb}" target="_blank" rel="noopener" title="HackTheBox">HTB</a>` : ""}
      </div>
      <a class="side__mail" href="mailto:${esc(P.email || "")}">${esc(P.email || "")}</a>`;
  }
  function setActive(sec) {
    document.querySelectorAll(".snav").forEach((a) => a.classList.toggle("on", a.dataset.sec === sec));
  }

  /* ============ vistas ============ */
  const Views = {};

  Views.inicio = () => {
    const L = P.links || {};
    const kpi = kpis();
    return `
    <section class="hero reveal in">
      <p class="hero__kicker">Portfolio · ${esc(P.location || "")}</p>
      <h1 class="hero__name">${esc(P.name || "")}</h1>
      <p class="hero__role">${esc(P.headline || "")}</p>
      <p class="hero__pitch">Estudiante de Ing. en Sistemas (UTN FRLP) e investigador en los laboratorios
        <b>LINES</b> y <b>LINSI</b>. Me dedico a la <b>seguridad ofensiva</b> —pentesting web, bug bounty y
        explotación— y a <b>automatizarla con agentes de IA</b>. Esto es lo que vengo haciendo; movete por la
        izquierda o apretá <b>Ctrl&nbsp;K</b> para ir directo a cualquier cosa.</p>
      <div class="hero__cta">
        ${L.cvEs ? `<a class="btn btn--go" href="${L.cvEs}" download>⤓ Descargar CV</a>` : ""}
        <a class="btn" href="#/contacto">✉ Contacto</a>
        ${L.github ? `<a class="btn btn--ghost" href="${L.github}" target="_blank" rel="noopener">GitHub ↗</a>` : ""}
        ${L.htb ? `<a class="btn btn--ghost" href="${L.htb}" target="_blank" rel="noopener">HackTheBox ↗</a>` : ""}
      </div>
    </section>

    <section class="kpis reveal in">${kpi.map((k) =>
      `<div class="kpi"><b>${esc(k[0])}</b><span>${esc(k[1])}</span></div>`).join("")}</section>

    ${P.now ? `<section class="now reveal in">
      <div class="now__head"><span class="now__dot"></span>${esc(P.now.label)}${P.now.updated ? ` <span class="now__date">· ${esc(P.now.updated)}</span>` : ""}</div>
      <ul class="now__list">${(P.now.items || []).map((it) => `<li>${it}</li>`).join("")}</ul>
    </section>` : ""}

    <h2 class="vtitle">Explorá</h2>
    <section class="tiles reveal in">
      ${tile("capacidades", "★", "Capacidades", "Lo que sé hacer, con evidencia")}
      ${tile("htb", "▲", "CTFs", `${(P.htb && P.htb.machines || []).length} máquinas resueltas · cómo las resolví`)}
      ${tile("vuln", "⚑", "Vulnerabilidades", `${vulnNotes().length} CVEs documentados`)}
      ${tile("proyectos", "◇", "Proyectos", `${(P.projects || []).length} proyectos propios`)}
      ${tile("notas", "#", "Notas", "Mis notas de estudio")}
      ${tile("contacto", "@", "Contacto", "Hablemos")}
    </section>`;
  };
  const tile = (sec, icon, title, sub) =>
    `<a class="tile" href="#/${sec}"><span class="tile__ico">${icon}</span><b>${esc(title)}</b><span>${esc(sub)}</span></a>`;

  function kpis() {
    const h = P.htb || {}; const sp = (h.startingPoint || []).reduce((n, t) => n + (t.boxes || []).filter((b) => b[1] > 0).length, 0);
    return [
      ["44", "vulnerabilidades halladas (LINSI)"],
      ["10", "reportes de bug bounty"],
      [String(sp + (h.machinesOwned || 0)), "máquinas de CTF resueltas"],
      [String(vulnNotes().length || 3), "CVEs documentados"]
    ];
  }

  Views.capacidades = () => `
    <h1 class="vhead">Capacidades <span class="vhead__sub">lo que sé hacer, con evidencia</span></h1>
    <div class="caps">${(P.findings || []).filter((f) => f.sev !== "info").map((f) => `
      <article class="cap reveal in">
        <h3>${esc(f.title)}</h3>
        <p class="cap__where">${esc(f.where)}</p>
        <p class="cap__desc">${f.desc}</p>
        <div class="cap__ev"><h4>Evidencia</h4><ul>${(f.evidence || []).map((e) => `<li>${e}</li>`).join("")}</ul></div>
        <p class="cap__impact">${f.impact}</p>
        <div class="tags">${(f.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      </article>`).join("")}</div>`;

  /* ---- HackTheBox ---- */
  // Puertos atacados en una máquina: notas tipo "puerto" que enlazan a la
  // máquina (o que su writeup enlaza), ordenadas por número de puerto.
  function machinePorts(m, note) {
    const want = slug(m.name); const out = new Map();
    noteList.forEach((n) => {
      if (!n.props || n.props.tipo !== "puerto") return;
      const linksMachine = (n.links || []).some((l) => slug(l) === want);
      const inWriteup = note && (note.links || []).some((l) => l.toLowerCase() === n.id.toLowerCase());
      if (linksMachine || inWriteup) out.set(n.id, n);
    });
    return [...out.values()].sort((a, b) => (parseInt(a.props.puerto) || 0) - (parseInt(b.props.puerto) || 0));
  }
  Views.htb = (id) => {
    const h = P.htb || {}; const machines = h.machines || [];
    if (id) {
      const m = machines.find((x) => slug(x.name) === id);
      if (!m) return notFound();
      const note = byId.get(m.name.toLowerCase());
      const owned = m.status === "owned";
      const ports = machinePorts(m, note);
      const portsHtml = ports.length
        ? `<div class="m-ports"><span class="m-ports__h">Puertos atacados</span><div class="ports">${ports.map((n) =>
            `<a class="port" href="#/notas/${slug(n.id)}"><b>${esc(n.props.puerto)}/${esc(n.props.protocolo || "tcp")}</b> ${esc(n.props.servicio || n.title)}</a>`).join("")}</div></div>`
        : "";
      const writeup = note && !note.embargo && note.body
        ? `<div class="md">${renderMd(note.body)}</div>`
        : (m.status === "active"
          ? `<div class="embargo-card"><b>RESOLUCIÓN EMBARGADA</b><p>Es una máquina activa de la plataforma (HackTheBox). Por sus reglas, publico la resolución completa cuando se retire.</p></div>`
          : "");
      return `
      <nav class="crumbs"><a href="#/htb">CTFs</a> / <span>${esc(m.name)}</span></nav>
      <h1 class="vhead">${esc(m.name)}</h1>
      <div class="m-meta"><span>${esc(m.os)}</span>·<span>${esc(m.diff)}</span>·<span>${esc(m.when)}</span>
        <span class="m-flags"><i class="${owned ? "ok" : ""}">user</i><i class="${owned ? "ok" : ""}">root</i></span></div>
      ${portsHtml}
      <ul class="chain big">${(m.chain || []).map(([k, v]) => `<li><b>${esc(k)}</b><span>${esc(v)}</span></li>`).join("")}</ul>
      ${m.report ? `<a class="btn btn--ghost" href="${m.report}" target="_blank" rel="noopener">Informe técnico (PDF) ↗</a>` : ""}
      ${writeup}`;
    }
    return `
    <h1 class="vhead">CTFs resueltos <span class="vhead__sub">HackTheBox · ${esc(P.handle || "")} · nivel ${h.level || ""}</span></h1>
    <p class="vlede">Máquinas de CTF que resolví (en la plataforma HackTheBox). Elegí una y mirá cómo la resolví, paso a paso, hasta tomar control total (root).</p>
    <div class="cards">${machines.map((m) => {
      const owned = m.status === "owned";
      return `<a class="card machine-card ${m.status}" href="#/htb/${slug(m.name)}">
        <div class="card__top"><b>${esc(m.name)}</b><span class="badge ${owned ? "ok" : "warn"}">${owned ? "pwned" : "activa"}</span></div>
        <div class="card__meta">${esc(m.os)} · ${esc(m.diff)} · ${esc(m.when)}</div>
        <div class="card__chain">${(m.chain || []).map(([k]) => `<span>${esc(k)}</span>`).join("<i>→</i>")}</div>
      </a>`;
    }).join("")}</div>
    ${startingPoint(h)}`;
  };
  function startingPoint(h) {
    if (!h.startingPoint) return "";
    return `<h2 class="vtitle">Retos introductorios <span class="mutxt mono">(Starting Point)</span></h2><div class="sp">${h.startingPoint.map((t) => {
      const done = (t.boxes || []).filter((b) => b[1] === 100).length;
      return `<div class="sp-tier"><b>${esc(t.tier)} <small>${done}/${t.boxes.length}</small></b>
        <div class="sp-boxes">${t.boxes.map(([n, p]) => `<span class="sp-box ${p === 100 ? "full" : p > 0 ? "half" : ""}" title="${esc(n)}: ${p}%">${esc(n)}</span>`).join("")}</div></div>`;
    }).join("")}</div>`;
  }

  /* ---- Vulnerabilidades ---- */
  Views.vuln = (id) => {
    const list = vulnNotes();
    if (id) {
      const n = list.find((x) => slug(x.id) === id) || byId.get(decodeURIComponent(id).toLowerCase());
      if (!n) return notFound();
      const rep = `https://github.com/${P.githubUser}/Informes-Tecnicos/blob/main/${encodeURIComponent(n.id)}/${encodeURIComponent(n.id)}.pdf`;
      return `
      <nav class="crumbs"><a href="#/vuln">Vulnerabilidades</a> / <span>${esc(n.title)}</span></nav>
      <h1 class="vhead">${esc(n.title)}</h1>
      ${propsTable(n)}
      <a class="btn btn--ghost" href="${rep}" target="_blank" rel="noopener">Informe completo (PDF) ↗</a>
      <div class="md">${renderMd(n.body)}</div>`;
    }
    return `
    <h1 class="vhead">Vulnerabilidades <span class="vhead__sub">CVEs que analicé y documenté</span></h1>
    <p class="vlede">Cada CVE que exploto en laboratorio termina en un informe: causa raíz, prueba de concepto, detección y mitigación.</p>
    <div class="cards">${list.map((n) => `
      <a class="card" href="#/vuln/${slug(n.id)}">
        <div class="card__top"><b>${esc(n.id)}</b>${n.props && n.props.severidad ? `<span class="badge">${esc(n.props.severidad)}</span>` : ""}</div>
        <div class="card__meta">${esc(firstLine(n.body) || (n.props && n.props.cwe) || "")}</div>
        <div class="card__tags">${(n.tags || []).slice(0, 4).map((t) => `<span class="tag">#${esc(t)}</span>`).join("")}</div>
      </a>`).join("") || `<p class="mutxt">Todavía no hay CVEs sincronizados.</p>`}</div>
    <p class="vfoot"><a href="${(P.links || {}).informes}" target="_blank" rel="noopener">Ver todos los informes en GitHub ↗</a></p>`;
  };
  const firstLine = (md) => {
    if (!md) return "";
    const m = String(md).replace(/^#.*$/gm, "").split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("|") && !l.startsWith(">"));
    return m ? m.replace(/[*_`\[\]]/g, "").slice(0, 120) : "";
  };

  /* ---- Proyectos ---- */
  Views.proyectos = (id) => {
    const projs = P.projects || [];
    if (id) {
      const p = projs.find((x) => slug(x.name) === id);
      if (!p) return notFound();
      return `
      <nav class="crumbs"><a href="#/proyectos">Proyectos</a> / <span>${esc(p.name)}</span></nav>
      <h1 class="vhead">${esc(p.name)}</h1>
      <p class="proj-kind">${esc(p.kind)} · <span class="mono">${esc(p.stack)}</span></p>
      <p class="proj-desc">${esc(p.desc)}</p>
      <div class="hero__cta">
        ${p.url ? `<a class="btn btn--ghost" href="${p.url}" target="_blank" rel="noopener">${p.url.includes("github.com") ? "Código" : "Demo en vivo"} ↗</a>` : ""}
        ${p.repo ? `<a class="btn btn--ghost" href="${p.repo}" target="_blank" rel="noopener">Repo ↗</a>` : ""}
      </div>`;
    }
    return `
    <h1 class="vhead">Proyectos <span class="vhead__sub">herramientas y sistemas propios</span></h1>
    <div class="cards">${projs.map((p) => `
      <a class="card" href="#/proyectos/${slug(p.name)}">
        <div class="card__top"><b>${esc(p.name)}</b></div>
        <span class="card__kind">${esc(p.kind)}</span>
        <div class="card__meta">${esc(p.desc).slice(0, 110)}…</div>
        <div class="card__stack mono">${esc(p.stack)}</div>
      </a>`).join("")}</div>
    <div id="repos-wrap"><h2 class="vtitle">Repositorios <span class="mutxt mono" id="repos-src">(en vivo desde GitHub)</span></h2><div class="repos" id="repos"></div></div>`;
  };

  /* ---- Notas ---- */
  Views.notas = (id) => {
    if (id) {
      const n = noteList.find((x) => slug(x.id) === id) || byId.get(decodeURIComponent(id).toLowerCase());
      if (!n) return notFound();
      return `<nav class="crumbs"><a href="#/notas">Notas</a> / <span>${esc(n.title)}</span></nav>
        <h1 class="vhead">${esc(n.title)}</h1>${propsTable(n)}<div class="md">${renderMd(n.body)}</div>`;
    }
    const groups = new Map();
    noteList.forEach((n) => { const k = (n.folder || "zzz").split("/")[0]; (groups.get(k) || groups.set(k, []).get(k)).push(n); });
    const keys = [...groups.keys()].sort();
    return `
    <h1 class="vhead">Notas <span class="vhead__sub">mis notas de estudio</span></h1>
    <p class="vlede">Documento cada máquina, CVE y concepto que estudio. Esto sale de mis notas reales de estudio (las armo con Obsidian).</p>
    <div class="vault"><div class="vault__graph">
      <div class="vault__toolbar"><span id="vstats" class="mono"></span><div class="legend" id="vlegend"></div></div>
      <canvas id="graph" aria-label="Grafo de notas. Clic en un nodo para abrir la nota."></canvas>
      <p class="vhint">Arrastrá los nodos · clic para abrir</p>
    </div></div>
    ${keys.map((k) => `<div class="ncat"><div class="ncat__h">${esc(k.replace(/^\d+\s+/, ""))}<span>${groups.get(k).length}</span></div>
      <div class="cards">${groups.get(k).sort((a, b) => a.title.localeCompare(b.title, "es")).map((n) => {
        const t = noteType(n); const r = t === "maquina" ? "#/htb/" + slug(n.id) : t === "vulnerabilidad" ? "#/vuln/" + slug(n.id) : "#/notas/" + slug(n.id);
        return `<a class="card card--sm" href="${r}"><b>${esc(n.title)}</b>${n.embargo ? `<span class="badge warn">embargada</span>` : ""}</a>`;
      }).join("")}</div></div>`).join("")}`;
  };

  Views.contacto = () => {
    const L = P.links || {};
    return `
    <h1 class="vhead">Contacto</h1>
    <p class="vlede">¿Buscás alguien de seguridad ofensiva / AppSec / automatización? Hablemos.</p>
    <div class="hero__cta">
      <a class="btn btn--go" href="mailto:${esc(P.email)}?subject=Vi%20tu%20portfolio">✉ ${esc(P.email)}</a>
      ${L.linkedin ? `<a class="btn btn--ghost" href="${L.linkedin}" target="_blank" rel="noopener">LinkedIn ↗</a>` : ""}
      ${L.github ? `<a class="btn btn--ghost" href="${L.github}" target="_blank" rel="noopener">GitHub ↗</a>` : ""}
      ${L.htb ? `<a class="btn btn--ghost" href="${L.htb}" target="_blank" rel="noopener">HackTheBox ↗</a>` : ""}
      ${L.cvEs ? `<a class="btn btn--ghost" href="${L.cvEs}" download>CV ES ⤓</a>` : ""}
      ${L.cvEn ? `<a class="btn btn--ghost" href="${L.cvEn}" download>CV EN ⤓</a>` : ""}
    </div>
    <p class="fineprint">¿Encontraste algo en este sitio? Hay un <a href=".well-known/security.txt">security.txt</a>.</p>`;
  };

  const notFound = () => `<h1 class="vhead">No encontrado</h1><p class="vlede">Esa página no existe. <a href="#/inicio">Volver al inicio</a>.</p>`;

  /* ============ GitHub en vivo (repos) ============ */
  const LANG = { Python: "#3572A5", HTML: "#e34c26", JavaScript: "#f1e05a", CSS: "#563d7c", C: "#555", "C++": "#f34b7d", Shell: "#89e051", PowerShell: "#012456" };
  async function cachedJSON(url, key, ttl = 3600e3) {
    try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < ttl) return c.d; } catch (_) {}
    const r = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (_) {}
    return d;
  }
  async function loadRepos() {
    const box = $("#repos"); if (!box) return;
    const fb = [
      { name: "Projects", language: "Python", html_url: `https://github.com/${P.githubUser}/Projects` },
      { name: "morocho", language: "HTML", html_url: `https://github.com/${P.githubUser}/morocho`, homepage: "https://inakisarobe.github.io/morocho/" },
      { name: "Informes-Tecnicos", language: null, html_url: `https://github.com/${P.githubUser}/Informes-Tecnicos` }
    ];
    let repos = fb, live = false;
    try { repos = (await cachedJSON(`https://api.github.com/users/${P.githubUser}/repos?per_page=100&sort=pushed`, "gh_repos")).filter((r) => !r.fork && !/\.github\.io$/i.test(r.name)); live = true; } catch (_) {}
    box.innerHTML = repos.map((r) => `
      <a class="repo" href="${r.html_url}" target="_blank" rel="noopener">
        <b>${esc(r.name)}</b>
        <p>${esc((P.repoNotes || {})[r.name] || r.description || "Sin descripción.")}</p>
        <div class="repo__meta">${r.language ? `<span><i class="lang-dot" style="background:${LANG[r.language] || "#888"}"></i>${esc(r.language)}</span>` : ""}<span>★ ${r.stargazers_count || 0}</span></div>
      </a>`).join("");
    const src = $("#repos-src"); if (src) src.textContent = live ? "(en vivo desde GitHub)" : "(copia local)";
  }

  /* ============ router ============ */
  function parse() {
    const h = (location.hash || "").replace(/^#\/?/, "");
    const parts = h.split("/").filter(Boolean).map(decodeURIComponent);
    const sec = parts[0] || "inicio";
    return { sec, id: parts[1] ? slug(parts[1]) : null, raw: parts[1] || null };
  }
  function render() {
    stopGraph();
    const { sec, raw } = parse();
    const fn = Views[sec];
    if (!fn) { view.innerHTML = notFound(); setActive(""); }
    else { view.innerHTML = fn(raw ? slug(raw) : null); setActive(sec); }
    document.title = (sec === "inicio" ? "Iñaki Sarobe" : SECTIONS.find((s) => s.id === sec)?.label + " · Iñaki Sarobe") || "Iñaki Sarobe";
    view.scrollTop = 0; window.scrollTo(0, 0);
    closeMenu();
    if (sec === "proyectos" && !raw) loadRepos();
    if (sec === "notas" && !raw) requestAnimationFrame(mountGraph);
    try { view.focus({ preventScroll: true }); } catch (_) {}
  }

  /* ============ menú móvil ============ */
  const side = $("#side"), scrim = $("#scrim");
  function openMenu() { side.classList.add("open"); scrim.hidden = false; $("#menu-btn").setAttribute("aria-expanded", "true"); }
  function closeMenu() { side.classList.remove("open"); scrim.hidden = true; $("#menu-btn").setAttribute("aria-expanded", "false"); }
  $("#menu-btn").addEventListener("click", () => side.classList.contains("open") ? closeMenu() : openMenu());
  scrim.addEventListener("click", closeMenu);

  /* ============ paleta de comandos (Ctrl K) ============ */
  const palette = $("#palette"), pInput = $("#palette-input"), pList = $("#palette-list");
  let pItems = [], pSel = 0;
  function cmdIndex() {
    const items = SECTIONS.map((s) => ({ label: s.label, hint: "sección", route: "#/" + s.id }));
    (P.htb && P.htb.machines || []).forEach((m) => items.push({ label: m.name, hint: "CTF", route: "#/htb/" + slug(m.name) }));
    vulnNotes().forEach((n) => items.push({ label: n.id, hint: "CVE", route: "#/vuln/" + slug(n.id) }));
    noteList.forEach((n) => { const t = noteType(n); if (t !== "maquina" && t !== "vulnerabilidad") items.push({ label: n.title, hint: "nota", route: "#/notas/" + slug(n.id) }); });
    (P.projects || []).forEach((p) => items.push({ label: p.name, hint: "proyecto", route: "#/proyectos/" + slug(p.name) }));
    items.push({ label: "Descargar CV", hint: "archivo", route: (P.links || {}).cvEs, dl: true });
    return items;
  }
  const ALL = cmdIndex();
  function openPalette() { palette.hidden = false; pInput.value = ""; filterP(""); pInput.focus(); }
  function closePalette() { palette.hidden = true; }
  function filterP(q) {
    q = q.toLowerCase().trim();
    pItems = (q ? ALL.filter((i) => i.label.toLowerCase().includes(q) || i.hint.includes(q)) : ALL).slice(0, 9);
    pSel = 0; drawP();
  }
  function drawP() {
    pList.innerHTML = pItems.map((i, k) => `<li class="${k === pSel ? "sel" : ""}" data-k="${k}"><span>${esc(i.label)}</span><em>${esc(i.hint)}</em></li>`).join("")
      || `<li class="mutxt">Sin resultados</li>`;
  }
  function goP(i) { if (!i) return; closePalette(); if (i.dl) { const a = document.createElement("a"); a.href = i.route; a.download = ""; a.click(); } else location.hash = i.route; }
  pInput && pInput.addEventListener("input", () => filterP(pInput.value));
  pInput && pInput.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { pSel = Math.min(pSel + 1, pItems.length - 1); drawP(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { pSel = Math.max(pSel - 1, 0); drawP(); e.preventDefault(); }
    else if (e.key === "Enter") { goP(pItems[pSel]); }
    else if (e.key === "Escape") { closePalette(); }
  });
  pList && pList.addEventListener("click", (e) => { const li = e.target.closest("li[data-k]"); if (li) goP(pItems[+li.dataset.k]); });
  palette && palette.addEventListener("click", (e) => { if (e.target === palette) closePalette(); });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette.hidden ? openPalette() : closePalette(); }
  });
  $("#cmd-btn") && $("#cmd-btn").addEventListener("click", openPalette);
  $("#cmd-btn-m") && $("#cmd-btn-m").addEventListener("click", openPalette);

  /* ============ grafo de Obsidian (vista Notas) ============ */
  const GTYPE = { maquina: "#9fef00", vulnerabilidad: "#ff3b6b", concepto: "#4cc9f0", herramienta: "#ffd23f", curso: "#b39dff", nota: "#dbe3dd", tag: "#8a7be0", mitre: "#ff8a3d", cwe: "#e0b84c", ghost: "#55605a", redacted: "#ff3b6b" };
  const GLBL = { maquina: "máquina", vulnerabilidad: "vulnerabilidad", concepto: "concepto", herramienta: "herramienta", curso: "curso", tag: "#tag", mitre: "ATT&CK", cwe: "CWE", nota: "nota", ghost: "sin crear", redacted: "embargada" };
  let rafId = null, graphRO = null;
  function stopGraph() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } if (graphRO) { graphRO.disconnect(); graphRO = null; } }
  function mountGraph() {
    const canvas = document.getElementById("graph"); if (!canvas || !noteList.length) return;
    const nodes = [], edges = [], index = new Map();
    const add = (id, label, type, note) => { if (index.has(id)) return index.get(id); const a = Math.random() * 6.2832, r = 60 + Math.random() * 120; const n = { id, label, type, note, x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0, deg: 0 }; index.set(id, n); nodes.push(n); return n; };
    const link = (a, b) => { if (!a || !b || a === b) return; if (edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))) return; edges.push({ a, b }); a.deg++; b.deg++; };
    noteList.forEach((n) => add("n:" + n.id.toLowerCase(), n.title, noteType(n), n));
    noteList.forEach((n) => {
      const src = index.get("n:" + n.id.toLowerCase());
      (n.links || []).forEach((t) => { const tgt = byId.get(t.toLowerCase()); link(src, tgt ? index.get("n:" + t.toLowerCase()) : add("g:" + t.toLowerCase(), t, "ghost")); });
      (n.tags || []).forEach((t) => link(src, add("t:" + t.toLowerCase(), "#" + t, "tag")));
      const mi = n.props && n.props.mitre; (Array.isArray(mi) ? mi : mi ? [mi] : []).forEach((m) => link(src, add("m:" + m, "ATT&CK " + m, "mitre")));
      const cw = n.props && n.props.cwe; (Array.isArray(cw) ? cw : cw ? [cw] : []).forEach((c) => link(src, add("c:" + c, String(c), "cwe")));
    });
    noteList.filter((n) => n.embargo && n.hiddenLinks > 0).forEach((n) => { const src = index.get("n:" + n.id.toLowerCase()); for (let i = 0; i < n.hiddenLinks; i++) { const x = add("x:" + n.id.toLowerCase() + ":" + i, "████", "redacted"); x.owner = n.id; link(src, x); } });

    const stats = document.getElementById("vstats"); if (stats) stats.textContent = `${noteList.length} notas · ${edges.length} enlaces · ${nodes.length} nodos`;
    const legend = document.getElementById("vlegend"); if (legend) { const used = [...new Set(nodes.map((n) => n.type))]; legend.innerHTML = used.map((t) => `<span><i style="background:${GTYPE[t]}"></i>${GLBL[t] || t}</span>`).join(""); }

    const ctx = canvas.getContext("2d"); let W = 0, H = 0, DPR = 1, hover = null, drag = null, moved = false, alpha = 1;
    const radius = (n) => (n.note ? 7 + Math.min(n.deg, 8) * 1.1 : n.type === "ghost" || n.type === "redacted" ? 4.5 : 4.5 + Math.min(n.deg, 5) * 0.6);
    function resize() { const r = canvas.getBoundingClientRect(); DPR = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    const toScreen = (n) => [n.x + W / 2, n.y + H / 2];
    function step() {
      for (let i = 0; i < nodes.length; i++) { const a = nodes[i]; for (let j = i + 1; j < nodes.length; j++) { const b = nodes[j]; let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy || 0.01; if (d2 < 40000) { const d = Math.sqrt(d2), f = 600 / d2; dx /= d; dy /= d; a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f; } } }
      edges.forEach(({ a, b }) => { let dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01; const f = (d - 72) * 0.01; dx /= d; dy /= d; a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f; });
      nodes.forEach((n) => { n.vx -= n.x * 0.0022; n.vy -= n.y * 0.0022; if (n === drag) return; n.x += (n.vx *= 0.82); n.y += (n.vy *= 0.82); });
      alpha *= 0.99;
    }
    const nb = new Set();
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const focus = drag || hover; nb.clear(); if (focus) edges.forEach((e) => { if (e.a === focus) nb.add(e.b); if (e.b === focus) nb.add(e.a); });
      edges.forEach(({ a, b }) => { const on = focus && (a === focus || b === focus); ctx.strokeStyle = on ? "rgba(159,239,0,.6)" : focus ? "rgba(120,140,130,.1)" : "rgba(120,140,130,.28)"; ctx.lineWidth = on ? 1.6 : 1; const [x1, y1] = toScreen(a), [x2, y2] = toScreen(b); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
      nodes.forEach((n) => {
        const [x, y] = toScreen(n), r = radius(n), dim = focus && n !== focus && !nb.has(n), col = GTYPE[n.type] || "#888";
        ctx.globalAlpha = dim ? 0.25 : 1; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832);
        if (n.type === "ghost") { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke(); } else { ctx.fillStyle = col; ctx.fill(); }
        if (n.type === "redacted") { ctx.fillStyle = "#000"; ctx.fillRect(x - r * 0.7, y - 1.5, r * 1.4, 3); }
        if (n.note || n === hover || nb.has(n) || n.type === "mitre" || n.type === "cwe" || n.type === "redacted") {
          ctx.font = `${n.note ? 600 : 500} ${n.note ? 12 : 11}px "IBM Plex Mono", monospace`; ctx.textAlign = "center"; ctx.fillStyle = n.note ? "#e9efe9" : "#9aa79f"; ctx.fillText(n.label, x, y + r + 13);
        }
        ctx.globalAlpha = 1;
      });
    }
    function loop() { if (alpha > 0.02 || drag) step(); draw(); rafId = requestAnimationFrame(loop); }
    function pick(ev) { const r = canvas.getBoundingClientRect(); const mx = ev.clientX - r.left, my = ev.clientY - r.top; let best = null, bd = 1e9; nodes.forEach((n) => { const [x, y] = toScreen(n); const d = Math.hypot(x - mx, y - my); if (d < radius(n) + 8 && d < bd) { bd = d; best = n; } }); return { n: best, mx, my }; }
    canvas.onpointerdown = (e) => { const { n } = pick(e); if (!n) return; drag = n; moved = false; canvas.setPointerCapture(e.pointerId); canvas.classList.add("dragging"); };
    canvas.onpointermove = (e) => { const { n, mx, my } = pick(e); if (drag) { drag.x = mx - W / 2; drag.y = my - H / 2; moved = true; alpha = Math.max(alpha, 0.4); } else { hover = n; canvas.style.cursor = n ? "pointer" : "grab"; } };
    const end = () => { if (drag && !moved) { const o = drag.owner || (drag.note && drag.note.id); const route = o && routeForName(o); if (route) location.hash = route; } drag = null; canvas.classList.remove("dragging"); };
    canvas.onpointerup = end; canvas.onpointercancel = end; canvas.onpointerleave = () => { hover = null; };
    resize(); for (let i = 0; i < 220; i++) step(); alpha = 0.26; loop();
    graphRO = new ResizeObserver(resize); graphRO.observe(canvas);
  }

  /* ============ lightbox (zoom de imágenes) ============ */
  let lb = null, lbImg, lbCap, lbList = [], lbIdx = 0;
  function ensureLb() {
    if (lb) return;
    lb = document.createElement("div"); lb.className = "lightbox"; lb.hidden = true;
    lb.innerHTML = '<button class="lb-btn lb-prev" aria-label="Anterior">‹</button><img alt=""><button class="lb-btn lb-next" aria-label="Siguiente">›</button><button class="lb-btn lb-close" aria-label="Cerrar">✕</button><div class="lb-cap"></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector("img"); lbCap = lb.querySelector(".lb-cap");
    lb.addEventListener("click", (e) => { if (e.target.closest(".lb-close")) return closeLb(); if (e.target.closest(".lb-prev")) return showLb(lbIdx - 1); if (e.target.closest(".lb-next")) return showLb(lbIdx + 1); if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", (e) => { if (lb.hidden) return; if (e.key === "Escape") closeLb(); else if (e.key === "ArrowLeft") showLb(lbIdx - 1); else if (e.key === "ArrowRight") showLb(lbIdx + 1); });
  }
  function showLb(i) { if (!lbList.length) return; lbIdx = (i + lbList.length) % lbList.length; const s = lbList[lbIdx]; lbImg.src = s.currentSrc || s.src; lbCap.textContent = (lbIdx + 1) + " / " + lbList.length; const multi = lbList.length > 1; lb.querySelector(".lb-prev").style.display = lb.querySelector(".lb-next").style.display = multi ? "" : "none"; }
  function closeLb() { if (lb) { lb.hidden = true; document.body.classList.remove("lb-open"); lbImg.src = ""; } }
  view.addEventListener("click", (e) => {
    const fc = e.target.closest(".fc"); if (fc) { fc.classList.toggle("on"); return; }
    const img = e.target.closest(".md img"); if (!img) return; ensureLb(); lbList = [...view.querySelectorAll(".md img")]; showLb(Math.max(0, lbList.indexOf(img))); lb.hidden = false; document.body.classList.add("lb-open"); });

  /* ============ init ============ */
  buildSidebar();
  window.addEventListener("hashchange", render);
  function boot() { if (!location.hash) location.replace("#/inicio"); render(); }
  if (window.marked || !document.querySelector('script[src*="marked"]')) boot();
  else window.addEventListener("load", boot, { once: true });
})();
