/*
 * Datos del portfolio. Editá este archivo para actualizar el informe:
 * hallazgos, máquinas, bitácora, arsenal y proyectos se renderizan desde acá.
 * (El anexo de Obsidian se genera aparte con tools/sync_vault.py.)
 */
window.PROFILE = {
  engagement: "ENG-2026-ISAR",
  reportDate: "2026-11-15",
  name: "Iñaki Sarobe",
  handle: "AkaliKaliLinux",
  location: "La Plata, Buenos Aires, Argentina",
  headline: "Pentesting · Seguridad ofensiva · Bug bounty · Red Team con IA",
  email: "sarobeinaki@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/sarobeinaki/",
    github: "https://github.com/inakiSarobe",
    htb: "https://app.hackthebox.com/users/2501615",
    informes: "https://github.com/inakiSarobe/Informes-Tecnicos",
    cvEs: "assets/cv/Inaki-Sarobe-CV-ES.pdf",
    cvEn: "assets/cv/Inaki-Sarobe-CV-EN.pdf"
  },
  githubUser: "inakiSarobe",

  /* ---------- "Trabajando ahora" (editá libremente) ---------- */
  now: {
    label: "Trabajando ahora",
    updated: "nov 2026",
    items: [
      "HackTheBox: <b>DoubleTake</b> → root (cadena de 2 CVEs)",
      "<b>Bug bounty</b> en programas públicos",
      "LINSI (UTN): herramienta de <b>pentesting automatizado</b>",
      "<b>CyberWar</b> / <b>morocho.ai</b> — Red Team con IA",
      "Cisco Networking Academy: curso <b>Hacker ético</b> (en curso)"
    ]
  },

  /*
   * Informes técnicos (repo Informes-Tecnicos). La lista completa se lee en vivo desde GitHub:
   * cuando subas un informe nuevo aparece solo en el Anexo C y en el contador.
   * Acá solo va la descripción corta de cada uno (opcional) y cuáles mostrar como ejemplo en SAR-005.
   */
  reportNotes: {
    "CVE-2023-0386": "OverlayFS · escalada local a root",
    "CVE-2026-41567": "Docker · escape de contenedor (CWE-427)",
    "CVE-2026-123158": "OpenSSH + musl · bypass de auth (\"sshole\")"
  },
  featuredReports: ["CVE-2023-0386", "CVE-2026-41567"],

  /* ---------- §3 Hallazgos ---------- */
  findings: [
    {
      id: "SAR-001", sev: "critica", score: 9.8,
      vector: "SAR:1.0/CU:H/AU:H/DO:H/EQ:M",
      title: "Automatización ofensiva sin contener",
      where: "LINSI · Laboratorio de Investigación en Nuevas Tecnologías (UTN FRLP) · mar 2025 → hoy",
      desc: "El objetivo desarrolló una herramienta de pentesting automatizado para aplicaciones web, desde el escaneo hasta la generación de resultados. Una vez que algo se puede automatizar, lo automatiza.",
      evidence: [
        "<b>14 aplicaciones</b> evaluadas con la herramienta",
        "<b>44 vulnerabilidades</b> identificadas: <b>2 críticas</b> y <b>7 de severidad alta</b>",
        "Cada hallazgo validado y documentado con pasos de reproducción y remediación",
        "Stack: Python, Linux y herramientas de seguridad ofensiva"
      ],
      impact: "En un engagement, lo repetitivo (recon, escaneo, verificación) corre solo y el tiempo del pentester se va a lo que requiere criterio: lógica de negocio, encadenar fallas y explotar.",
      tags: ["Pentesting web", "Python", "Automatización", "Reporting"]
    },
    {
      id: "SAR-002", sev: "critica", score: 9.1,
      vector: "SAR:1.0/CU:H/AU:M/DO:H/EQ:L",
      title: "Exposición confirmada a vulnerabilidades reales (bug bounty)",
      where: "Programas públicos de bug bounty · 2026",
      desc: "En menos de un mes en programas de bug bounty, el objetivo envió 10 reportes de seguridad. Varios fueron clasificados con severidad alta o crítica. En la mayoría no llegó primero (duplicados), así que todavía no cobró recompensas, pero los hallazgos fueron reales y reproducibles.",
      evidence: [
        "<b>10 reportes</b> en menos de un mes",
        "Severidades <b>altas y críticas</b> en varios de ellos",
        "Foco en lógica de negocio, autenticación/autorización, validación de firmas y flujo de datos no confiables",
        "PoC reproducibles y reportes basados en evidencia; divulgación responsable (capturas difuminadas)"
      ],
      impact: "Ya trabaja contra objetivos reales, con scope y reglas: encuentra, prioriza por riesgo y escribe un reporte que un desarrollador puede reproducir y arreglar sin reuniones extra.",
      tags: ["Bug bounty", "Business logic", "AuthN/AuthZ", "Divulgación responsable"]
    },
    {
      id: "SAR-003", sev: "alta", score: 8.8,
      vector: "SAR:1.0/CU:H/AU:M/DO:H/EQ:L",
      title: "Escalada de privilegios a root reproducible",
      where: "HackTheBox · máquinas y Starting Point · 2025 → hoy",
      desc: "Dado un puerto abierto, el objetivo encadena reconocimiento, acceso inicial y escalada de privilegios hasta root. Después escribe cómo llegó.",
      evidence: [
        "<b>TwoMillion</b>: API de invitaciones → admin → inyección de comandos → root con <b>CVE-2023-0386</b> (kernel, OverlayFS)",
        "<b>Cap</b>: IDOR → credenciales FTP en claro dentro de un .pcap → SSH → root abusando de <b>Linux capabilities</b>",
        "<b>Starting Point</b>: 12 máquinas completas en los tiers 0 a 2, en Linux y Windows: SMB, FTP, Redis, SQLi, MSSQL con xp_cmdshell, captura de hashes NTLM con Responder, subida de archivos y abuso de SUID/sudo",
        "<b>DoubleTake</b>: bypass de auth en sshd (CVE-2026-123158) → escape de contenedor Docker (CVE-2026-41567) → root del host"
      ],
      impact: "Sabe ir de un puerto abierto a root, en Linux y en Windows, y contar cómo llegó. Es lo que necesita un informe de pentest de infraestructura.",
      tags: ["Linux privesc", "Windows", "Kernel exploits", "SMB/MSSQL", "Responder", "HackTheBox"],
      links: [{ label: "Anexo A · evidencia en HackTheBox", url: "#annex-a" }]
    },
    {
      id: "SAR-004", sev: "alta", score: 8.1,
      vector: "SAR:1.0/CU:H/AU:H/DO:M/EQ:M",
      title: "Red Team con agentes de IA (y reglas de enfrentamiento)",
      where: "CyberWar · HackerTech 2026 (UTN FRC) · morocho.ai (Ekoparty 2026) · h1-scrap",
      desc: "El objetivo construye sistemas multiagente para atacar y les pone límites duros. Para el CTF attack-defense CyberWar 2026 armó un framework con un centro de comando web, unos 46 agentes especializados y un router RAG que carga solo los relevantes para cada objetivo.",
      evidence: [
        "<b>CyberWar · HackerTech 2026</b> (UTN FRC, Córdoba, 22 ago 2026): <b>4.º puesto</b> con mi equipo",
        "<b>CyberWar 2026</b>: replay de exploits confirmados contra todas las \"capitales\" rivales, tracker de flags con SQLite, guardia de SLA y generación de documentación de fixes",
        "Reglas de enfrentamiento embebidas: nada de DoS, nunca workstations rivales ni el juez",
        "Presentó <b>morocho.ai</b> (pentest automatizado con IA) al Start-up Zone de <b>Ekoparty 2026</b>; la demo interactiva fue parte de esa presentación",
        "<b>h1-scrap</b>: recon de programas de HackerOne con Playwright + SQLite reanudable"
      ],
      impact: "Puede sumar IA a un equipo de pentest o Red Team sin que se vuelva un riesgo: automatiza el ataque, pero con alcance, límites y auditoría.",
      tags: ["Red Team", "Attack-defense", "Multiagente", "RAG", "Docker", "Playwright"]
    },
    {
      id: "SAR-005", sev: "media", score: 6.8,
      vector: "SAR:1.0/CU:H/AU:L/DO:H/EQ:L",
      title: "Investigación de vulnerabilidades documentada en exceso",
      where: "Informes-Tecnicos (GitHub) · vault de Obsidian",
      desc: "El objetivo no da por terminada una vulnerabilidad hasta escribir cómo funciona: causa raíz, explotación, PoC, detección y mitigación. Cada CVE que explota en laboratorio termina en un informe público.",
      reportsEvidence: true,
      evidence: [
        "Notas mapeadas a <b>MITRE ATT&amp;CK</b> y CWE en su cuaderno de Obsidian (ver Anexo B)"
      ],
      impact: "Sus informes se entienden y se pueden accionar: hallazgo, impacto, PoC y remediación, listos para entregarle al cliente.",
      tags: ["Vulnerability research", "CVE", "Technical writing", "MITRE ATT&CK", "CWE"],
      links: [{ label: "Repositorio de informes", url: "https://github.com/inakiSarobe/Informes-Tecnicos" }]
    },
    {
      id: "SAR-006", sev: "media", score: 5.9,
      vector: "SAR:1.0/CU:M/AU:H/DO:M/EQ:L",
      title: "Conocimiento del lado defensivo",
      where: "Proyecto Ubuntu Server Security Hardening · 2023 → 2025",
      desc: "El objetivo también estuvo del otro lado: levantó y endureció un entorno Ubuntu Server y lo auditó hasta dejarlo sin vulnerabilidades críticas.",
      evidence: [
        "Vulnerabilidades detectadas: <b>30 → 5</b>, ninguna crítica",
        "Hardening de SSH, firewall multicapa (iptables/UFW) y control de conexiones",
        "Nginx como reverse proxy con HTTPS",
        "Aislamiento de usuarios mediante sandboxing",
        "Evaluación con OWASP ZAP y automatización de la configuración en Bash"
      ],
      impact: "Sus recomendaciones de remediación son realistas porque ya las aplicó: sabe cuánto cuesta cerrar cada hallazgo que reporta.",
      tags: ["Linux", "SSH", "iptables/UFW", "Nginx", "OWASP ZAP", "Bash"]
    },
    {
      id: "SAR-007", sev: "media", score: 5.2,
      vector: "SAR:1.0/CU:M/AU:L/DO:H/EQ:H",
      title: "Divulgación descontrolada de conocimiento",
      where: "GIC · LINES UTN FRLP · PyDay · Foro Provincial · Cybertech Women",
      desc: "El objetivo comparte lo que aprende en charlas, podcasts y mentorías, en todos los formatos que encuentra.",
      evidence: [
        "Charla <b>\"DevSecOps automatizados\"</b> en PyDay 2025 (UTN La Plata), junto a Jonathan Santurio",
        "<b>Mentor</b> del Hackathon UTN-UNAD en el 5.º Congreso Internacional Cybertech Women (UNAD, mayo 2026), en representación de la UTN: guió a un equipo internacional (Argentina y Colombia). Con certificado de la UNAD",
        "Conversatorio de <b>OSINT</b> en el 2.º Foro Provincial de Ciberseguridad (oct 2025) y voz del Boletín N.º 1 del <b>GIC Podcast</b>",
        "Integrante del Semillero de Ciberseguridad GIC 2025"
      ],
      impact: "Sabe explicarle un hallazgo técnico a alguien que no es técnico, algo clave en la reunión de cierre de un pentest.",
      tags: ["Divulgación", "Mentoría", "OSINT", "Comunicación"]
    },
    {
      id: "SAR-008", sev: "baja", score: 3.7,
      vector: "SAR:1.0/CU:H/AU:M/DO:L/EQ:L",
      title: "Desarrollo full-stack con fines no maliciosos",
      where: "Icalsports · AhorraTe · TradeAI · ReparAI · AI-Workspace",
      desc: "Además de romper software, el objetivo lo construye de punta a punta. Eso le da contexto para hablar con desarrolladores en su idioma.",
      evidence: [
        "<b>Icalsports</b>: calendarios .ics para más de 450 competiciones, con SQLite, API propia, caché y service worker",
        "<b>ReparAI</b>: agente para un servicio técnico con un freno de seguridad en tres capas",
        "<b>TradeAI</b>: arranca siempre en simulación y pide tres desbloqueos independientes antes de operar con dinero real",
        "<b>AhorraTe</b>: app de finanzas personales (proyecto en curso)"
      ],
      impact: "Lee código como quien lo escribió. En un pentest web, eso significa encontrar más rápido dónde está la lógica que se puede romper.",
      tags: ["FastAPI", "SQLite", "Docker", "JavaScript", "C/C++"]
    },
    {
      id: "SAR-009", sev: "info", score: 0.0,
      vector: "SAR:1.0/INFO",
      title: "Certificación y formación formal",
      where: "Cisco Networking Academy · UTN FRLP",
      desc: "Introduction to Cybersecurity (Cisco, oct 2025) y Claude 101 (Claude Academy, nov 2026). Cursando Hacker ético en Cisco Networking Academy. Estudiante de Ingeniería en Sistemas de Información en la UTN FRLP (2024 → 2029). Detalle en la sección Formación.",
      evidence: [
        "Cisco · <b>Introduction to Cybersecurity</b> · credencial en Credly",
        "Claude Academy · <b>Claude 101</b> · credencial verificable",
        "Cisco Networking Academy · <b>Hacker ético</b> · en curso",
        "UTN FRLP · Ingeniería en Sistemas de Información"
      ],
      impact: "Es informativo, no hace falta remediarlo. El objetivo sigue sumando certificaciones.",
      tags: ["Cisco", "UTN"]
    }
  ],

  /*
   * ---------- Formación: carrera, certificaciones, cursos en curso y laboratorios ----------
   * Solo cosas verificables. status: "obtenida" | "en-curso".
   * Si un curso está en curso, NO le pongas fecha de emisión ni credencial hasta terminarlo.
   */
  formacion: {
    carrera: {
      title: "Ingeniería en Sistemas de Información",
      org: "UTN · Facultad Regional La Plata",
      when: "2024 → actualidad",
      note: "Carrera de grado en curso."
    },
    certificaciones: [
      {
        name: "Hacker ético", issuer: "Cisco Networking Academy", status: "en-curso",
        level: "Intermedio · v2.0 · a mi ritmo",
        desc: "Curso de seguridad ofensiva: cómo descubrir amenazas y vulnerabilidades antes de que sean aprovechadas.",
        tags: ["Pentesting", "Seguridad ofensiva", "Cisco"]
      },
      {
        name: "Introduction to Cybersecurity", issuer: "Cisco Networking Academy", status: "obtenida",
        date: "oct 2025", verify: "Credly",
        url: "https://www.credly.com/badges/c4fd679b-2ca8-4f35-a464-894d97922e57",
        desc: "Fundamentos: amenazas y su impacto en las organizaciones, vulnerabilidades, detección y defensa, y caminos de certificación en ciberseguridad.",
        tags: ["Fundamentos", "Amenazas", "Defensa", "Cisco"]
      },
      {
        name: "Claude 101", issuer: "Claude Academy (Anthropic)", status: "obtenida",
        date: "nov 2026", verify: "Claude Academy",
        url: "https://academy.claude.com/verify/246c85e6d275c01f0d2737adb896d820",
        desc: "Uso de Claude para trabajo técnico. Complementa los proyectos de automatización con agentes de IA (CyberWar, morocho.ai).",
        tags: ["IA", "Agentes", "Automatización"]
      }
    ],
    // Competencias y eventos (participación, no empleo).
    eventos: [
      {
        name: "CyberWar · HackerTech 2026", org: "UTN Facultad Regional Córdoba", when: "22 ago 2026",
        role: "CTF por equipos entre facultades de la UTN",
        result: "4.º puesto",
        items: [
          "Competencia de ataque y defensa dentro de HackerTech, el evento de ciberseguridad de la UTN FRC (3.ª edición)",
          "Armé un framework multiagente para el equipo: replay de exploits, seguimiento de flags y control de SLA"
        ],
        links: [
          { label: "Sitio del evento", url: "https://hackertech.com.ar/" },
          { label: "Código del framework", url: "https://github.com/inakiSarobe/Projects/tree/main/cyberwar" }
        ]
      },
      {
        name: "Hackathon UTN-UNAD · 5.º Congreso Internacional Cybertech Women", org: "UNAD (Colombia) · modalidad híbrida", when: "6–8 may 2026",
        role: "Mentor en representación de la UTN",
        result: "Mentor",
        items: [
          "Acompañé a un equipo internacional (Argentina y Colombia) durante la hackatón",
          "Certificado emitido por la UNAD (Escuela de Ciencias Básicas, Tecnología e Ingeniería)"
        ]
      }
    ],
    // Participación académica en laboratorios de la UTN FRLP (no es empleo).
    labs: [
      {
        name: "LINES · Laboratorio en Ciberseguridad", org: "UTN FRLP", when: "mar 2024 → actualidad",
        role: "Investigación y divulgación en ciberseguridad",
        items: [
          "Práctica de CTF, OSINT, reversing, esteganografía y análisis de vulnerabilidades",
          "Semillero de Ciberseguridad GIC 2025",
          "Charla \"DevSecOps automatizados\" (PyDay 2025) y conversatorio de OSINT (2.º Foro Provincial de Ciberseguridad)"
        ]
      },
      {
        name: "LINSI · Laboratorio de Investigación en Nuevas Tecnologías", org: "UTN FRLP", when: "mar 2025 → actualidad",
        role: "Investigación en pentesting automatizado",
        items: [
          "Desarrollo de una herramienta que automatiza análisis de seguridad sobre aplicaciones web",
          "Evaluación de 14 aplicaciones: 44 vulnerabilidades, 2 críticas y 7 altas"
        ],
        link: { label: "Ver detalle en Capacidades", url: "#/capacidades" }
      }
    ]
  },

  /* ---------- Anexo A: HackTheBox ---------- */
  htb: {
    level: 13,
    machinesOwned: 3,
    profile: "https://app.hackthebox.com/users/2501615",
    machines: [
      {
        name: "TwoMillion", os: "Linux", diff: "Easy", status: "owned", when: "2025",
        chain: [
          ["Recon", "JS ofuscado revela la API de invitaciones"],
          ["Foothold", "Abuso de la API → admin → inyección de comandos en la generación de VPN"],
          ["Privesc", "CVE-2023-0386: OverlayFS + FUSE, archivo \"de root\" en upperdir → root"]
        ],
        report: "https://github.com/inakiSarobe/Informes-Tecnicos/blob/main/CVE-2023-0386/CVE-2023-0386.pdf"
      },
      {
        name: "Cap", os: "Linux", diff: "Easy", status: "owned", when: "2026",
        chain: [
          ["Recon", "Dashboard web de capturas de red"],
          ["Foothold", "IDOR → .pcap ajeno con credenciales FTP en claro → SSH"],
          ["Privesc", "Linux capabilities: python con cap_setuid → root"]
        ]
      },
      {
        name: "DoubleTake", os: "Linux", diff: "Easy", status: "owned", when: "nov 2026",
        chain: [
          ["Recon", "Alpine Linux con SSH (OpenSSH sobre musl) y Docker por detrás"],
          ["Foothold", "CVE-2026-123158: bypass de auth en sshd (musl/crypt) → SSH dentro del contenedor"],
          ["Privesc", "CVE-2026-41567: el daemon de Docker ejecuta binarios del contenedor como root → escape al host"]
        ]
      }
    ],
    startingPoint: [
      { tier: "Tier 0 · Foundations", boxes: [["Meow", 100], ["Fawn", 100], ["Dancing", 100], ["Redeemer", 100], ["Explosion", 0], ["Preignition", 0], ["Mongod", 0], ["Synced", 0]] },
      { tier: "Tier 1 · Fundamental Exploitation", boxes: [["Appointment", 100], ["Sequel", 100], ["Crocodile", 100], ["Responder", 100], ["Three", 100], ["Funnel", 0], ["Bike", 0], ["Ignition", 0], ["Pennyworth", 0], ["Tactics", 0]] },
      { tier: "Tier 2 · Multi-step & Privesc", boxes: [["Archetype", 100], ["Oopsie", 100], ["Vaccine", 100], ["Unified", 50], ["Included", 0], ["Markup", 0], ["Base", 0]] }
    ]
  },

  /* ---------- §4 Bitácora ---------- */
  timeline: [
    { when: "mar 2024", phase: "recon", title: "Ingreso a LINES · UTN FRLP", text: "Investigación en ciberseguridad: CTF, OSINT, reversing, esteganografía y análisis de vulnerabilidades." },
    { when: "mar 2025", phase: "enum", title: "LINSI · Pentesting automatizado", text: "Arranca la herramienta de pentesting automatizado de aplicaciones web (14 apps, 44 vulnerabilidades)." },
    { when: "jun 2025", phase: "enum", title: "Semillero de Ciberseguridad GIC 2025", text: "Formación en el laboratorio GIC del LINES." },
    { when: "2025", phase: "exploit", title: "HTB TwoMillion → root", text: "Escalada con CVE-2023-0386 y primer informe técnico público." },
    { when: "2025", phase: "post", title: "Hardening de Ubuntu Server", text: "Del otro lado: de 30 vulnerabilidades a 5, ninguna crítica." },
    { when: "oct 2025", phase: "post", title: "Cisco · Introduction to Cybersecurity", text: "Primera certificación." },
    { when: "oct 2025", phase: "report", title: "2.º Foro Provincial de Ciberseguridad", text: "Con el GIC: conversatorio de OSINT con un juego hecho en el laboratorio y entrevistas para el GIC Podcast." },
    { when: "2025", phase: "report", title: "PyDay 2025 · \"DevSecOps automatizados\"", text: "Charla práctica sobre pipelines con seguridad continua, en UTN La Plata." },
    { when: "2025", phase: "post", title: "Icalsports", text: "Calendarios deportivos para más de 450 competiciones, con API propia." },
    { when: "may 2026", phase: "report", title: "Mentor · Hackathon UTN-UNAD (Cybertech Women)", text: "5.º Congreso Internacional Cybertech Women UNAD 2026, en representación de la UTN, con un equipo internacional." },
    { when: "2026", phase: "exploit", title: "HTB Cap → root", text: "IDOR, credenciales en claro en un pcap y abuso de capabilities." },
    { when: "nov 2026", phase: "exploit", title: "HTB DoubleTake → root", text: "Cadena de dos CVEs: bypass de auth en sshd (musl) y escape de contenedor Docker al host." },
    { when: "2026", phase: "exploit", title: "Bug bounty: 10 reportes en menos de un mes", text: "Varios de severidad alta o crítica." },
    { when: "ago 2026", phase: "exploit", title: "CyberWar · HackerTech 2026", text: "4.º puesto por equipos en el CTF attack-defense de la UTN FRC, con un framework multiagente de ataque y defensa." },
    { when: "2026", phase: "report", title: "Ekoparty 2026 · presentación de morocho.ai", text: "Presentó el proyecto (pentest automatizado con IA) al Start-up Zone. La demo interactiva fue parte de esa presentación; no estuvo en ningún stand del evento." },
    { when: "nov 2026", phase: "recon", title: "Claude Academy · Claude 101", text: "Curso completado con credencial verificable." },
    { when: "nov 2026", phase: "recon", title: "Cuaderno de campo en Obsidian", text: "Las notas de máquinas, CVEs y conceptos se publican solas en este informe (Anexo B)." }
  ],

  /* ---------- §5 Arsenal (ls -la) ---------- */
  arsenal: [
    { dir: "recon-exploit", perm: "drwxr-x---", items: ["kali-linux", "nmap", "burpsuite", "ffuf", "gobuster", "nuclei", "sqlmap", "metasploit", "searchsploit", "hydra", "owasp-zap"] },
    { dir: "post-exploitation", perm: "drwxr-x---", items: ["linpeas.sh", "winpeas", "impacket", "responder", "john", "wireshark", "linux-capabilities", "suid-sudo"] },
    { dir: "web-attacks", perm: "drwxr-x---", items: ["owasp-top10", "owasp-api-top10", "idor", "sqli", "command-injection", "business-logic", "authn-authz", "file-upload"] },
    { dir: "reporting", perm: "drwxr-xr-x", items: ["cvss", "mitre-att&ck", "cwe", "poc", "remediacion", "obsidian"] },
    { dir: "code", perm: "drwxr-xr-x", items: ["python", "bash", "powershell", "javascript", "sql", "c", "c++", "fastapi"] },
    { dir: "ai-automation", perm: "drwxr-x---", items: ["claude-code", "multi-agent", "rag", "mcp", "ollama", "playwright"] },
    { dir: "blue-side", perm: "drwxr-xr-x", items: ["linux-hardening", "ssh", "iptables", "ufw", "nginx", "docker", "wsl2", "ssdlc", "devsecops"] },
    { dir: "human", perm: "-rw-r--r--", items: ["comunicacion", "divulgacion", "mentoria", "trabajo-en-equipo", "reportes-claros"] }
  ],

  /* ---------- Anexo C: proyectos propios ---------- */
  projects: [
    {
      name: "CyberWar 2026", kind: "Red Team · IA", stack: "Python · Claude Code · Docker · WSL",
      desc: "Centro de comando para el CTF attack-defense de HackerTech 2026: alrededor de 46 agentes, un router RAG, replay de exploits, flags, SLA y documentación de fixes.",
      url: "https://github.com/inakiSarobe/Projects/tree/main/cyberwar"
    },
    {
      name: "morocho.ai · demo", kind: "Pentest automatizado con IA", stack: "HTML · CSS · JS vanilla",
      desc: "Demo interactiva que fue parte de la presentación del proyecto al Start-up Zone de Ekoparty 2026: 3 engagements anonimizados, playback de comandos reales y hallazgos con evidencia y remediación.",
      url: "https://inakisarobe.github.io/morocho/", repo: "https://github.com/inakiSarobe/morocho"
    },
    {
      name: "Informes técnicos", kind: "Vulnerability research", stack: "PDF · DOCX",
      desc: "CVEs explotados en laboratorio con causa raíz, PoC, detección y mitigación.",
      url: "https://github.com/inakiSarobe/Informes-Tecnicos", live: "informes"
    },
    {
      name: "h1-scrap", kind: "Recon · bug bounty", stack: "Python · Playwright · SQLite",
      desc: "Recorre programas de HackerOne, se puede reanudar, descarga los recursos del scope y genera program.md y scope.md.",
      url: "https://github.com/inakiSarobe/Projects/tree/main/h1-scrap"
    },
    {
      name: "AI-Workspace", kind: "Documentación con IA", stack: "Python · Ollama · MCP · RAG",
      desc: "Analiza sistemas de agentes (inventario, grafo de dependencias, MCP en vivo) y genera una tesis técnica en MD, DOCX y PDF.",
      url: "https://github.com/inakiSarobe/Projects/tree/main/AI-Workspace"
    },
    {
      name: "ReparAI", kind: "Agente con guardarraíles", stack: "FastAPI · Docker · WhatsApp",
      desc: "Empleado administrativo con IA para un servicio técnico. Una allowlist de números corta en tres capas distintas para que la IA no le escriba a quien no debe.",
      url: "https://github.com/inakiSarobe/Projects/tree/main/ReparAI"
    },
    {
      name: "TradeAI", kind: "Arquitectura segura", stack: "Python · Docker · Nginx",
      desc: "Local-first, en simulación por defecto y con tres desbloqueos independientes. El instalador valida nginx -t y revierte si algo falla.",
      url: "https://github.com/inakiSarobe/Projects/tree/main/TradeAI"
    },
    {
      name: "Icalsports", kind: "Producto web", stack: "Python · SQLite · Service Worker",
      desc: "Calendarios deportivos descargables para más de 450 competiciones, con recordatorios antes de cada evento."
    }
  ],

  repoNotes: {
    "Projects": "Monorepo: CyberWar, h1-scrap, AI-Workspace, TradeAI, ReparAI, juegos y prácticas.",
    "Informes-Tecnicos": "Informes de CVEs explotados en laboratorio (PDF / DOCX).",
    "morocho": "Demo interactiva de morocho.ai, parte de la presentación del proyecto a Ekoparty 2026."
  }
};
