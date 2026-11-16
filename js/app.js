/* ENG-2026-ISAR — lógica principal (terminal, hallazgos, anexos). Sin dependencias. */
(function () {
  "use strict";
  const P = window.PROFILE;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SEV = { critica: "Crítica", alta: "Alta", media: "Media", baja: "Baja", info: "Info" };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= §3 Hallazgos ================= */
  const reportUrl = (n) => `https://github.com/${P.githubUser}/Informes-Tecnicos/blob/main/${encodeURIComponent(n)}/${encodeURIComponent(n)}.pdf`;
  const ext = (url) => /^https?:/.test(url) ? ' target="_blank" rel="noopener"' : "";

  // Evidencia de informes: unos pocos ejemplos elegidos + enlace al repo con el total en vivo,
  // así el hallazgo no crece con cada informe nuevo y se entiende que hay más.
  function reportsEvidence() {
    const ex = (P.featuredReports || []).map((n) =>
      `<li><a href="${reportUrl(n)}" target="_blank" rel="noopener"><b>${esc(n)}</b></a> · ${esc(P.reportNotes[n] || "informe técnico")}</li>`);
    return {
      first: ex.length ? `<li>Informes de CVE explotados en laboratorio, por ejemplo:<ul class="f-examples">${ex.join("")}</ul></li>` : "",
      after: `<a class="f-more" href="${P.links.informes}" target="_blank" rel="noopener"><span class="reports-total">Ver todos los informes en el repositorio</span> ↗</a>`
    };
  }

  function renderFindings() {
    const box = $("#findings");
    box.innerHTML = P.findings.map((f, i) => {
      const rep = f.reportsEvidence ? reportsEvidence() : { first: "", after: "" };
      return `
      <details class="finding sev-${f.sev} reveal" ${i === 0 ? "open" : ""} id="${f.id}">
        <summary>
          <span class="f-id">${f.id}</span>
          <span class="f-sev">${SEV[f.sev]}</span>
          <span class="f-title">${f.title}</span>
          <span class="f-score">${f.score.toFixed(1)}</span>
        </summary>
        <div class="f-body">
          <div>
            <p class="f-where">${esc(f.where)}</p>
            <h4>Descripción</h4><p>${f.desc}</p>
            <h4>Evidencia${f.reportsEvidence ? " (muestra)" : ""}</h4><ul>${rep.first}${f.evidence.map((e) => `<li>${e}</li>`).join("")}</ul>
            ${rep.after}
          </div>
          <div>
            <h4>Impacto para tu organización</h4><p class="f-impact">${f.impact}</p>
            <h4>Vector</h4><span class="f-vector" title="CU: curiosidad · AU: automatización · DO: documentación · EQ: equipo">${esc(f.vector)}</span>
            <div class="tags">${f.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
            ${f.links ? `<h4>Referencias</h4><ul>${f.links.map((l) => `<li><a href="${l.url}"${ext(l.url)}>${esc(l.label)} ${ext(l.url) ? "↗" : "→"}</a></li>`).join("")}</ul>` : ""}
          </div>
        </div>
      </details>`;
    }).join("");

    const counts = {};
    P.findings.forEach((f) => (counts[f.sev] = (counts[f.sev] || 0) + 1));
    $("#sevbar").innerHTML = Object.keys(SEV).filter((k) => counts[k]).map((k) =>
      `<div class="sev-${k}" style="flex:${counts[k]}" title="${SEV[k]}: ${counts[k]}">${counts[k]} ${SEV[k]}</div>`).join("");
    $("#n-findings").textContent = `${P.findings.length} hallazgos`;
  }

  /* ================= §4 Bitácora ================= */
  const PHASE = { recon: "recon", enum: "enum", exploit: "exploit", post: "post-expl.", report: "reporte" };
  function renderTimeline() {
    $("#timeline").innerHTML = P.timeline.map((t) => `
      <li class="ph-${t.phase} reveal">
        <span class="t-when">${esc(t.when)}</span>
        <span class="t-dot"></span>
        <div class="t-body"><b>${esc(t.title)}</b><span class="t-phase">${PHASE[t.phase]}</span><p>${esc(t.text)}</p></div>
      </li>`).join("");
  }

  /* ================= §5 Arsenal ================= */
  function renderArsenal() {
    const total = P.arsenal.reduce((n, d) => n + d.items.length, 0);
    $("#arsenal").innerHTML =
      `<div><span class="cmd">inaki@lines:~$</span> ls -la /opt/arsenal</div><div class="perm">total ${total}</div>` +
      P.arsenal.map((d) => `
        <div class="row"><span class="perm">${d.perm}</span><span class="own">inaki</span><span class="grp">utn</span><span class="dir">${esc(d.dir)}/</span></div>
        <div class="files">${d.items.map((x) => `<span>${esc(x)}</span>`).join("")}</div>`).join("");
  }

  /* ================= Anexo A — HTB ================= */
  function renderHTB() {
    const h = P.htb;
    $("#htb-level").textContent = h.level;
    $("#machines").innerHTML = h.machines.map((m) => {
      const owned = m.status === "owned";
      return `
      <article class="machine ${m.status} reveal">
        <div class="m-name">${esc(m.name)}</div>
        <div class="m-meta"><span>${esc(m.os)}</span><span>·</span><span>${esc(m.diff)}</span><span>·</span><span>${esc(m.when)}</span></div>
        <div class="m-flags"><span class="${owned ? "ok" : ""}">user.txt</span><span class="${owned ? "ok" : ""}">root.txt</span></div>
        <ul class="chain">${m.chain.map(([k, v]) => `<li><b>${esc(k)}</b><span>${esc(v)}</span></li>`).join("")}</ul>
        ${m.note ? `<p class="note">${esc(m.note)}</p>` : ""}
        ${m.report ? `<a class="btn btn--ghost" href="${m.report}" target="_blank" rel="noopener">Informe técnico ↗</a>` : ""}
      </article>`;
    }).join("");

    $("#sp").innerHTML = h.startingPoint.map((t) => {
      const done = t.boxes.filter((b) => b[1] === 100).length;
      return `<div class="sp-tier reveal"><b>${esc(t.tier)}<small>${done}/${t.boxes.length} completas</small></b>
        <div class="sp-boxes">${t.boxes.map(([n, p]) => `<span class="sp-box ${p === 100 ? "full" : p > 0 ? "half" : ""}" title="${esc(n)}: ${p}%">${esc(n)}</span>`).join("")}</div></div>`;
    }).join("");

    // KPI: máquinas con al menos una flag
    const sp = h.startingPoint.reduce((n, t) => n + t.boxes.filter((b) => b[1] > 0).length, 0);
    const k = $("#kpi-htb");
    if (k) { k.dataset.count = String(sp + h.machinesOwned); k.textContent = String(sp + h.machinesOwned); }
  }

  /* ================= Anexo C — proyectos + GitHub en vivo ================= */
  const LANG = { Python: "#3572A5", HTML: "#e34c26", JavaScript: "#f1e05a", CSS: "#563d7c", C: "#555555", "C++": "#f34b7d", Shell: "#89e051", PowerShell: "#012456" };
  function ago(iso) {
    const d = (Date.now() - new Date(iso).getTime()) / 864e5;
    if (d < 1) return "hoy";
    if (d < 30) return `hace ${Math.round(d)} d`;
    if (d < 365) return `hace ${Math.round(d / 30)} m`;
    return `hace ${(d / 365).toFixed(1)} a`;
  }
  async function cachedJSON(url, key, ttlMs = 3600e3) {
    try {
      const c = JSON.parse(localStorage.getItem(key) || "null");
      if (c && Date.now() - c.t < ttlMs) return c.d;
    } catch (_) {}
    const r = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (_) {}
    return d;
  }
  function renderProjects() {
    $("#projects").innerHTML = P.projects.map((p) => `
      <article class="proj reveal">
        <span class="proj__kind">${esc(p.kind)}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <span class="proj__stack">${esc(p.stack)}</span>
        <div class="proj__links">
          ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener">${p.url.includes("github.com") ? "código" : "demo en vivo"} ↗</a>` : `<span class="muted">repo privado</span>`}
          ${p.repo ? `<a href="${p.repo}" target="_blank" rel="noopener">repo ↗</a>` : ""}
        </div>
      </article>`).join("");
  }
  // Anexo C: los informes más recientes y una tarjeta "+N más" cuando el repo crece.
  const MAX_REPORTS = 6;
  const cveKey = (n) => { const m = /^CVE-(\d{4})-(\d+)$/i.exec(n); return m ? [+m[1], +m[2]] : [0, 0]; };
  const sortReports = (names) => names.slice().sort((a, b) => {
    const x = cveKey(a), y = cveKey(b);
    return (y[0] - x[0]) || (y[1] - x[1]) || a.localeCompare(b);
  });
  function drawReports(names, live) {
    const shown = names.slice(0, MAX_REPORTS);
    const rest = names.length - shown.length;
    $("#reports").innerHTML = shown.map((n) => `
      <a class="report" href="${reportUrl(n)}" target="_blank" rel="noopener">
        <span class="report__ico">PDF</span>
        <span><b>${esc(n)}</b><span>${esc(P.reportNotes[n] || "Informe técnico")}</span></span>
      </a>`).join("") + (rest > 0 ? `
      <a class="report report--more" href="${P.links.informes}" target="_blank" rel="noopener">
        <span class="report__ico">+${rest}</span>
        <span><b>${rest} informe${rest > 1 ? "s" : ""} más</b><span>ver todos en GitHub</span></span>
      </a>` : "");
    $("#informes-src").textContent = live ? "(en vivo desde GitHub)" : "(copia local; GitHub no respondió)";
    if (!live) return;
    const total = names.length;
    const kpi = $("#kpi-cves");
    if (kpi) { kpi.dataset.count = String(total); kpi.textContent = String(total); }
    document.querySelectorAll(".reports-total").forEach((el) => {
      el.innerHTML = `Ver los <b>${total} informe${total > 1 ? "s" : ""}</b> publicados (y contando) en el repositorio`;
    });
  }
  async function loadReports() {
    const fallback = sortReports(Object.keys(P.reportNotes));
    try {
      const d = await cachedJSON(`https://api.github.com/repos/${P.githubUser}/Informes-Tecnicos/contents/`, "gh_informes");
      const dirs = sortReports(d.filter((x) => x.type === "dir").map((x) => x.name));
      drawReports(dirs.length ? dirs : fallback, dirs.length > 0);
    } catch (_) { drawReports(fallback, false); }
  }
  async function loadRepos() {
    const box = $("#repos");
    const fallback = [
      { name: "Projects", language: "Python", pushed_at: "2026-08-18T23:23:04Z", stargazers_count: 0, html_url: `https://github.com/${P.githubUser}/Projects` },
      { name: "morocho", language: "HTML", pushed_at: "2026-09-16T03:04:13Z", stargazers_count: 0, html_url: `https://github.com/${P.githubUser}/morocho`, homepage: "https://inakisarobe.github.io/morocho/" },
      { name: "Informes-Tecnicos", language: null, pushed_at: "2025-09-05T06:05:59Z", stargazers_count: 0, html_url: `https://github.com/${P.githubUser}/Informes-Tecnicos` }
    ];
    let repos = fallback, live = false;
    try {
      repos = (await cachedJSON(`https://api.github.com/users/${P.githubUser}/repos?per_page=100&sort=pushed`, "gh_repos"))
        .filter((r) => !r.fork && !/\.github\.io$/i.test(r.name));
      live = true;
    } catch (_) {}
    box.innerHTML = repos.map((r) => `
      <a class="repo reveal in" href="${r.html_url}" target="_blank" rel="noopener">
        <b>${esc(P.githubUser)}/${esc(r.name)}</b>
        <p>${esc(P.repoNotes[r.name] || r.description || "Sin descripción.")}</p>
        <div class="repo__meta">
          ${r.language ? `<span><i class="lang-dot" style="background:${LANG[r.language] || "#888"}"></i>${esc(r.language)}</span>` : ""}
          <span>★ ${r.stargazers_count}</span>
          <span>push ${ago(r.pushed_at || r.updated_at)}</span>
        </div>
      </a>`).join("");
    $("#repos-src").textContent = live ? "(en vivo desde la API de GitHub)" : "(copia local; la API no respondió)";
  }

  /* ================= Terminal ================= */
  const body = $("#term-body");
  const input = $("#term-input");
  const hist = []; let hIdx = 0; let busy = false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  function print(html, cls) {
    const div = document.createElement("div");
    if (cls) div.className = cls;
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }
  async function typeCmd(cmd) {
    const line = print(`<span class="c">$</span> `);
    for (const ch of cmd) { line.innerHTML += esc(ch); await sleep(28 + Math.random() * 40); }
  }
  const PORTS = [
    ["22/tcp", "open", "ssh", "contacto seguro", "#s6"],
    ["80/tcp", "open", "http", "resumen ejecutivo", "#s1"],
    ["443/tcp", "open", "https", "hallazgos", "#s3"],
    ["445/tcp", "open", "smb", "informes CVE", "#annex-c"],
    ["1337/tcp", "open", "htb", "HackTheBox", "#annex-a"],
    ["8600/tcp", "open", "cyberwar", "IA attack-defense", "#SAR-004"],
    ["9418/tcp", "open", "git", "repos GitHub", "#annex-c"],
    ["27124/tcp", "open", "obsidian", "vault de estudio", "#annex-b"]
  ];
  async function nmap() {
    await typeCmd("nmap -sV -sC -p- inaki.sarobe");
    await sleep(250);
    print(`<span class="d">Starting Nmap 7.95 ( https://nmap.org ) at ${P.reportDate} ART</span>`);
    await sleep(500);
    print(`Nmap scan report for <b>inaki.sarobe</b> (La Plata, AR)`);
    print(`Host is up (0.0042s latency). <span class="o">Disponible para trabajar.</span>`);
    print(`<span class="d">PORT      STATE SERVICE  VERSION</span>`);
    for (const [port, st, svc, ver, href] of PORTS) {
      await sleep(160);
      print(`<a class="port" href="${href}">${port.padEnd(9)}</a> <span class="o">${st}</span>  ${svc.padEnd(8)} <span class="d">${ver}</span>`);
    }
    await sleep(200);
    print(`<span class="d">Service Info: OS: Linux; Device: estudiante UTN FRLP</span>`);
    const since = new Date("2024-03-01"), now = new Date(P.reportDate);
    const yrs = ((now - since) / (365.25 * 864e5)).toFixed(1);
    print(`Nmap done: 1 IP address (1 host up) scanned in <span class="w">${yrs} años</span>`);
    print(`<span class="d">Hacé clic en un puerto o escribí </span><span class="c">help</span><span class="d">.</span>`);
  }
  const CMDS = {
    help() {
      print(`<span class="d">comandos disponibles:</span>
  <span class="c">whoami</span>          quién es el objetivo
  <span class="c">nmap</span>            re-escanear al objetivo
  <span class="c">ls</span>              contenido del informe
  <span class="c">findings</span>        listar hallazgos
  <span class="c">htb</span>             evidencia en HackTheBox
  <span class="c">vault</span>           abrir el cuaderno de Obsidian
  <span class="c">cv</span>              descargar el CV
  <span class="c">open</span> &lt;x&gt;        linkedin | github | htb | mail
  <span class="c">sudo contratar</span>  remediar el riesgo
  <span class="c">clear</span>           limpiar pantalla`);
    },
    whoami() {
      print(`visitante <span class="d">(vos)</span>
<span class="d">objetivo:</span> <b>${esc(P.name)}</b> <span class="d">· ${esc(P.handle)} en HTB</span>
<span class="d">rol:</span>      ${esc(P.headline)}
<span class="d">lab:</span>      LINES / LINSI · UTN FRLP
<span class="d">loc:</span>      ${esc(P.location)}`);
    },
    nmap,
    ls() {
      print(`<span class="i">hallazgos/</span>  <span class="i">htb/</span>  <span class="i">obsidian-vault/</span>  <span class="i">github/</span>  resumen.md  bitacora.log  <span class="o">cv_es.pdf</span>  <span class="o">cv_en.pdf</span>  <span class="r">flag.txt</span>`);
    },
    findings() {
      const col = { critica: "r", alta: "w", media: "w", baja: "o", info: "i" };
      print(P.findings.map((f) => `<a href="#${f.id}">${f.id}</a>  <span class="${col[f.sev]}">${SEV[f.sev].toUpperCase().padEnd(8)}</span> ${f.score.toFixed(1)}  ${esc(f.title)}`).join("\n"));
    },
    htb() {
      const h = P.htb;
      const sp = h.startingPoint.reduce((n, t) => n + t.boxes.filter((b) => b[1] === 100).length, 0);
      print(`${esc(P.handle)} · nivel ${h.level}
${h.machines.map((m) => `  ${m.status === "owned" ? '<span class="c">[pwned]</span>' : '<span class="r">[embargo]</span>'} ${esc(m.name).padEnd(11)} ${esc(m.os)} · ${esc(m.diff)}`).join("\n")}
  <span class="c">[sp]</span>     Starting Point: ${sp} completas
<a href="#annex-a">→ ver anexo A</a>`);
    },
    vault() {
      const V = window.VAULT;
      print(V ? `vault "${esc(V.vaultName)}": ${V.notes.length} notas sincronizadas. <a href="#annex-b">→ abrir anexo B</a>` : `vault no sincronizado todavía.`);
      document.getElementById("annex-b").scrollIntoView();
    },
    cv() {
      print(`<a href="${P.links.cvEs}" download>cv_es.pdf</a>   <a href="${P.links.cvEn}" download>cv_en.pdf</a>`);
    },
    open(arg) {
      const map = { linkedin: P.links.linkedin, github: P.links.github, htb: P.links.htb, mail: `mailto:${P.email}`, email: `mailto:${P.email}`, cv: P.links.cvEs };
      const url = map[(arg || "").toLowerCase()];
      if (!url) return print(`uso: open linkedin | github | htb | mail | cv`, "w");
      print(`abriendo <a href="${url}" target="_blank" rel="noopener">${esc(url)}</a>…`);
      window.open(url, "_blank", "noopener");
    },
    clear() { body.innerHTML = ""; },
    exit() { print(`No hay salida: ya estás adentro del informe.`, "w"); },
    flag() { print(`cat: flag.txt: Permiso denegado. Las flags se ganan. Pista: F12.`, "r"); },
    async contratar() {
      print(`[sudo] contraseña para visitante: `);
      await sleep(500);
      const l = body.lastChild;
      for (let i = 0; i < 8; i++) { l.innerHTML += "•"; await sleep(90); }
      await sleep(300);
      print(`<span class="c">Acceso concedido.</span> Ejecutando remediación…`);
      await sleep(500);
      document.getElementById("s6").scrollIntoView();
    }
  };
  CMDS.cat = (arg) => (/flag/.test(arg || "") ? CMDS.flag() : /cv/.test(arg || "") ? CMDS.cv() : /hallazgos|findings/.test(arg || "") ? CMDS.findings() : print(`cat: ${esc(arg || "")}: no existe`, "r"));
  CMDS.obsidian = CMDS.vault;
  CMDS.hallazgos = CMDS.findings;
  CMDS.contacto = CMDS.contratar;

  async function run(raw) {
    const line = raw.trim();
    print(`<span class="c">$</span> ${esc(line)}`);
    if (!line) return;
    const [cmd, ...rest] = line.split(/\s+/);
    const arg = rest.join(" ");
    const c = cmd.toLowerCase();
    if (c === "sudo") {
      if (/contrat|hire/.test(arg)) return CMDS.contratar();
      return print(`visitante no está en el archivo sudoers. Este incidente será reportado.`, "r");
    }
    if (c === "rm" && /-rf/.test(arg)) return print(`Buen intento. Quedó registrado como SAR-999: crítico, autor el visitante.`, "r");
    const fn = CMDS[c];
    if (fn) return fn(arg);
    print(`${esc(cmd)}: comando no encontrado. Probá <span class="c">help</span>.`, "d");
  }

  $("#term-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const v = input.value; input.value = "";
    if (v.trim()) { hist.push(v); hIdx = hist.length; }
    busy = true; try { await run(v); } finally { busy = false; }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && hIdx > 0) { input.value = hist[--hIdx]; e.preventDefault(); }
    if (e.key === "ArrowDown") { hIdx = Math.min(hist.length, hIdx + 1); input.value = hist[hIdx] || ""; e.preventDefault(); }
  });
  $("#term").addEventListener("click", (e) => { if (!e.target.closest("a")) input.focus({ preventScroll: true }); });

  /* ================= UI: reveal + nav activa ================= */
  function setupObservers() {
    document.querySelectorAll(".sec__head, .prose, .tldr, .kpi, .phases, .lsla, .vault, .remed__box, .htb-head").forEach((el) => el.classList.add("reveal"));
    if (!("IntersectionObserver" in window) || reduceMotion) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    const links = [...document.querySelectorAll(".runhead__nav a")];
    const nio = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main > section[id]").forEach((s) => nio.observe(s));
  }

  /* ================= Easter egg para quien abre DevTools ================= */
  function consoleFlag() {
    const f = ["SAROBE{", "r3c0n_", "3s_l4_", "m1t4d_", "d3l_", "tr4b4j0", "}"].join("");
    console.log("%c ENG-2026-ISAR %c Mirar el código fuente ya cuenta como reconocimiento.", "background:#9fef00;color:#000;font-weight:700;padding:3px 6px;border-radius:3px", "color:#9fef00");
    console.log("%cflag → " + f, "color:#ff3b6b;font-family:monospace");
    console.log("%cMandámela por mail con el asunto \"flag\" y te debo un café ☕ → " + P.email, "color:#b4bfb8");
  }

  /* ================= init ================= */
  document.getElementById("report-date").textContent = P.reportDate;
  renderFindings();
  renderTimeline();
  renderArsenal();
  renderHTB();
  renderProjects();
  loadReports();
  loadRepos();
  setupObservers();
  consoleFlag();
  (async () => { busy = true; try { await nmap(); } finally { busy = false; } })();
})();
