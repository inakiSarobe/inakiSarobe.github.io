/* Generado por tools/sync_vault.py — no editar a mano */
window.VAULT = {
 "generated": "2026-11-16T17:33:24+00:00",
 "vaultName": "Cybersecurity",
 "notes": [
  {
   "id": "Puertos comunes",
   "title": "Puertos comunes",
   "path": "01 Conceptos/Puertos comunes.md",
   "folder": "01 Conceptos",
   "props": {
    "tipo": "concepto",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "concepto"
    ]
   },
   "tags": [
    "concepto",
    "flashcards/redes"
   ],
   "links": [],
   "embargo": false,
   "body": "#flashcards/redes\n\nPuertos por defecto que vas a ver en casi cualquier escaneo con nmap. Repasalos con `Ctrl+P` → *Spaced Repetition: Review flashcards*.\n\n¿Puerto por defecto de FTP?::21/tcp\n¿Puerto por defecto de SSH?::22/tcp\n¿Puerto por defecto de Telnet?::23/tcp\n¿Puerto por defecto de SMTP?::25/tcp\n¿Puerto por defecto de DNS?::53 (UDP, y TCP para transferencias de zona)\n¿Puerto por defecto de HTTP?::80/tcp\n¿Puerto por defecto de Kerberos?::88\n¿Puerto por defecto de POP3?::110/tcp\n¿Puertos de NetBIOS / RPC en Windows?::135 (RPC), 137-139 (NetBIOS)\n¿Puerto por defecto de LDAP?::389 (636 para LDAPS)\n¿Puerto por defecto de HTTPS?::443/tcp\n¿Puerto por defecto de SMB?::445/tcp\n¿Puerto por defecto de MySQL?::3306/tcp\n¿Puerto por defecto de RDP?::3389/tcp\n¿Puerto por defecto de PostgreSQL?::5432/tcp\n¿Puertos de WinRM?::5985 (HTTP) y 5986 (HTTPS)\n",
   "mtime": "2026-11-16T17:33:21.667512+00:00"
  },
  {
   "id": "DoubleTake",
   "title": "DoubleTake",
   "path": "03 Máquinas y CTF/DoubleTake.md",
   "folder": "03 Máquinas y CTF",
   "props": {
    "tipo": "maquina",
    "plataforma": "HackTheBox",
    "dificultad": "fácil",
    "so": "Linux",
    "estado": "completado",
    "tags": [
     "ctf"
    ],
    "inicio": "2026-11-14",
    "fin": "2026-11-15",
    "retirada": true
   },
   "tags": [
    "ctf"
   ],
   "links": [
    "CVE-2026-123158",
    "CVE-2026-41567"
   ],
   "embargo": false,
   "body": "## Resumen\n| User flag | Root flag | Vector inicial | Escalada |\n| --------- | --------- | --------------------------------------- | ------------------------------------------- |\n| ✅ | ✅ | [[CVE-2026-123158]] · bypass de auth en sshd (Alpine/musl) | [[CVE-2026-41567]] · escape de contenedor Docker → root del host |\n\n**DoubleTake** (HackTheBox · Linux · Easy) encadena dos CVEs, de ahí el nombre: una debilidad en la autenticación de `sshd` sobre **musl libc** da el acceso inicial dentro de un contenedor, y un fallo de resolución de binarios en el *daemon* de **Docker** permite escapar del contenedor y terminar como **root en el host**.\n\n## 1. Reconocimiento\n```bash\nnmap -sC -sV -p- --min-rate 2000 -oN nmap.txt <IP>\n```\nEl escaneo muestra un objetivo Linux con SSH expuesto. El banner y el comportamiento del sistema apuntan a **Alpine Linux**, dato clave porque en Alpine OpenSSH se enlaza contra **musl** en lugar de glibc.\n\n![[DoubleTake-1794688098053.webp]]\n\n![[DoubleTake-1794688207302.webp]]\n\n## 2. Enumeración\nLa enumeración confirma la pila de Alpine/musl y la presencia de **Docker** por detrás del servicio: el acceso inicial cae dentro de un contenedor, no sobre el host directamente.\n\n![[DoubleTake-1794688141956.webp]]\n\n## 3. Explotación (acceso inicial)\nVector: **[[CVE-2026-123158]]**. Se aprovecha el manejo de contraseñas de `sshd` cuando `crypt()` lo provee **musl** para pasar la autenticación y entrar por SSH como el usuario del contenedor (`alpine`). La causa raíz, la detección y la mitigación están en la nota del CVE.\n\n![[DoubleTake-1794689903746.webp]]\n\n![[DoubleTake-1794689970407.webp]]\n\n## 4. Escalada de privilegios\n\n![[DoubleTake-1794690331116.webp]]\n\n![[DoubleTake-1794690536901.webp]]\n\n![[DoubleTake-1794690757162.webp]]\n\n![[DoubleTake-1794696365521.webp]]\n\n![[DoubleTake-1794764750650.webp]]\n\nVector: **[[CVE-2026-41567]]**. Ya dentro del contenedor, se abusa del *daemon* de Docker: al descomprimir archivos subidos por su API resuelve binarios como `xz`/`unpigz` contra el *rootfs* del **contenedor** pero los ejecuta como **root del host**. Colocando un binario con ese nombre se logra ejecución como root del host y, desde ahí, la *root flag*. PoC completa en la nota del CVE.\n\nxz trojan\n![[DoubleTake-1794785072892.webp]]\n![[DoubleTake-1794786370273.webp]]\n![[DoubleTake-1794786392763.webp]]\n![[DoubleTake-1794786428574.webp]]\n![[DoubleTake-1794786524701.webp]]\n![[DoubleTake-1794786580862.webp]]\n\nda error ya que nada puede descomprimir el xz. y gracias a eso obtenemos acceso\n\n![[DoubleTake-1794786674889.webp]]\n\n## 5. Lecciones aprendidas\n- Dos vulnerabilidades de severidad media encadenadas dan compromiso total: autenticación débil para entrar y escape de contenedor para ser root.\n- Identificar la *libc* (musl vs glibc) y detectar un Docker accesible desde el contenedor es parte del reconocimiento, no un detalle menor.\n- Las dos patas se cortan con medidas conocidas: SSH solo con claves (`PasswordAuthentication no`) y Docker actualizado (≥ 29.5.1) o *rootless*.\n\n## Referencias\n- [[CVE-2026-123158]] — bypass de autenticación en sshd (Alpine/musl)\n- [[CVE-2026-41567]] — escape de contenedor en Docker (CWE-427)\n- HackTheBox · DoubleTake (máquina retirada)\n",
   "mtime": "2026-11-16T00:27:18.817525+00:00"
  },
  {
   "id": "CVE-2026-41567",
   "title": "CVE-2026-41567",
   "path": "04 Vulnerabilidades/CVE-2026-41567.md",
   "folder": "04 Vulnerabilidades",
   "props": {
    "tipo": "vulnerabilidad",
    "cve": "CVE-2026-41567",
    "cwe": "CWE-427",
    "owasp": null,
    "mitre": "T1611",
    "severidad": "alta",
    "cvss": "7.2 – 7.5 (Alta)",
    "estado": "documentado",
    "tags": [
     "vulnerabilidad",
     "docker",
     "contenedores",
     "escape",
     "privesc"
    ],
    "creado": "2026-11-15"
   },
   "tags": [
    "vulnerabilidad",
    "docker",
    "contenedores",
    "escape",
    "privesc"
   ],
   "links": [
    "DoubleTake",
    "CVE-2026-123158"
   ],
   "embargo": false,
   "body": "## Descripción\nFallo de **resolución de binarios** en el *daemon* de **Docker** (hasta la versión **29.5.0**) que permite un **escape de contenedor** y la ejecución de código como **root en el host**. Al recibir un archivo comprimido por la API `PUT /containers/{id}/archive`, el *daemon* resuelve los binarios de descompresión (`xz`, `unpigz`) usando el **sistema de archivos *overlay* del contenedor** en lugar del **host**, y los ejecuta como **root del host con `CAP_SYS_ADMIN`**. Visto en la máquina [[DoubleTake]] (HackTheBox) como vector de **escalada de privilegios**.\n\nRelacionada temáticamente con [[CVE-2026-123158]] (acceso inicial en la misma máquina).\n\n## Causa raíz\n- La API de Docker expone `PUT /containers/{id}/archive` para subir archivos dentro de un contenedor. Cuando el archivo viene comprimido, el *daemon* lo descomprime invocando binarios externos.\n- Para formatos como **`.xz`** y **`.gz` con *pigz*** el *daemon* llama a `xz` y `unpigz`, pero **los busca en el `PATH` resolviéndolos contra el `rootfs` *overlay* del contenedor**, no contra el host.\n- Esos binarios se ejecutan **en el contexto del host**, como **root** y con **`CAP_SYS_ADMIN`**. Un atacante que controle el contenido del contenedor puede plantar un binario troyano con ese nombre y lograr que el host lo ejecute con privilegios.\n- Es un caso clásico de **CWE-427 (Uncontrolled Search Path Element)**: confianza en una ruta de búsqueda controlada por un componente de menor privilegio.\n- Las implementaciones **puras en Go** (`bzip2`, `zstd`, `gzip` nativo) **no** llaman a binarios externos y, por tanto, **no son explotables**. Solo las rutas que delegan en `xz` y `unpigz` son vulnerables.\n\n## Impacto\n- **Escape de contenedor** → ejecución de código arbitrario como **root en el host**.\n- Compromiso total del *host* Docker desde un contenedor sin privilegios aparentes.\n- En [[DoubleTake]] se usa para pasar de un usuario dentro del contenedor a **root del host**.\n\n## Cómo se explota\nIdea general: subir primero el binario troyano (como `.tar` plano, para que quede tal cual en el *overlay* del contenedor) y luego **disparar** la descompresión subiendo cualquier `.tar.xz`, que hará que el *daemon* ejecute el `xz` del contenedor como root del host.\n\n1. **Plantar el troyano** en `/usr/bin/xz` del contenedor mediante una subida `.tar` plana (sin compresión).\n2. **Disparar** subiendo un archivo `.tar.xz`: el *daemon* intenta descomprimirlo invocando el `xz` que ahora apunta al troyano.\n3. El troyano se ejecuta como **root del host con `CAP_SYS_ADMIN`**; desde ahí se monta **procfs** y se hace `chroot /proc/1/root` para operar sobre el sistema de archivos del host.\n\n```http\nPUT /containers/{id}/archive?path=/usr/bin HTTP/1.1\nHost: docker\nContent-Type: application/x-tar\n\n<archivo .tar plano con un /usr/bin/xz troyano>\n\n--- luego, para disparar la descompresión ---\n\nPUT /containers/{id}/archive?path=/tmp HTTP/1.1\nHost: docker\nContent-Type: application/x-tar\n\n<archivo .tar.xz cualquiera -> el daemon ejecuta el \"xz\" del contenedor como root del host>\n```\n\n> [!tip] Escape vía procfs\n> Una vez con ejecución como root del host, el payload típico monta `procfs` y usa `chroot /proc/1/root` para acceder al *rootfs* del host (PID 1) y ejecutar comandos fuera del contenedor.\n\n## Cómo se detecta\n- Monitorizar llamadas a la API **`PUT /containers/{id}/archive`**, especialmente subidas de archivos comprimidos (`.tar.xz`, `.tar.gz`).\n- **Auditar los binarios de los contenedores**: buscar `xz` / `unpigz` modificados o sospechosos dentro del *rootfs* del contenedor.\n- Comprobar la **versión de Docker** (`docker version` / `docker info`): las versiones **≤ 29.5.0** son vulnerables.\n- Vigilar procesos `xz`/`unpigz` lanzados por el *daemon* (`dockerd`) con rutas que apunten al *overlay* de un contenedor.\n\n## Mitigación\n- **Actualizar a Docker Engine 29.5.1 o superior**, donde se corrige la resolución de binarios.\n- **Restringir el acceso a la API** de Docker (no exponer el socket/`tcp` sin autenticación; limitar quién puede subir archivos a los contenedores).\n- Usar **Docker *rootless***, de forma que el *daemon* no corra como root del host.\n- Aplicar defensa en profundidad: *seccomp*, AppArmor/SELinux y evitar otorgar `CAP_SYS_ADMIN` innecesariamente.\n\n## Laboratorio / práctica\n- [[DoubleTake]] (HackTheBox), escalada de privilegios a root del host.\n\n## Referencias\n- Aviso de corrección: Docker Engine **29.5.1**.\n- Informe técnico en el repo Informes-Tecnicos (en preparación).\n-\n",
   "mtime": "2026-11-15T19:23:13.874279+00:00"
  },
  {
   "id": "CVE-2026-123158",
   "title": "CVE-2026-123158",
   "path": "04 Vulnerabilidades/CVE-2026-123158.md",
   "folder": "04 Vulnerabilidades",
   "props": {
    "tipo": "vulnerabilidad",
    "cve": "CVE-2026-123158",
    "cwe": null,
    "owasp": null,
    "mitre": "T1110",
    "severidad": null,
    "cvss": null,
    "estado": "investigando",
    "tags": [
     "vulnerabilidad",
     "linux",
     "ssh"
    ],
    "creado": "2026-11-15"
   },
   "tags": [
    "vulnerabilidad",
    "linux",
    "ssh"
   ],
   "links": [
    "DoubleTake"
   ],
   "embargo": false,
   "body": "## Descripción\nVulnerabilidad en la autenticación por contraseña de `sshd` en sistemas **Alpine Linux**, donde OpenSSH usa **musl libc** en lugar de glibc. Vista en la máquina [[DoubleTake]] (HackTheBox) como vector de acceso inicial.\n\n> [!warning] Por verificar\n> No encontré todavía un aviso público (NVD, Alpine o musl) para este CVE. Completar severidad, CVSS, CWE y versiones afectadas cuando se confirme.\n\n## Causa raíz\n- En Alpine, `crypt()` lo implementa musl, que maneja los hashes de `/etc/shadow` (`$5$` SHA-256, `$6$` SHA-512, con salt).\n- El problema está en cómo sshd/PAM se comporta con la búsqueda del salt y las comparaciones de contraseñas.\n- \n\n## Impacto\n- Acceso inicial por SSH a un usuario del sistema (en DoubleTake, `alpine`).\n- \n\n## Cómo se explota\nVer la sección *3. Explotación* de [[DoubleTake]].\n```http\n\n```\n\n## Cómo se detecta\n- Revisar los logs de autenticación de sshd (`/var/log/messages` o `/var/log/auth.log`) buscando fallos repetidos o intentos con entradas anómalas para un mismo usuario.\n- Comprobar la versión de los paquetes `musl` y `openssh` instalados (`apk info -v musl openssh`).\n\n## Mitigación\n- Actualizar `musl` y `openssh` a las versiones corregidas (`apk upgrade`).\n- Desactivar la autenticación por contraseña y usar solo claves (`PasswordAuthentication no` en `sshd_config`).\n- Limitar intentos con `MaxAuthTries` y herramientas como fail2ban.\n\n## Laboratorio / práctica\n- [[DoubleTake]] (HackTheBox), acceso inicial.\n\n## Referencias\n- Informe técnico en el repo Informes-Tecnicos (en preparación).\n-\n",
   "mtime": "2026-11-15T18:52:42.793078+00:00"
  }
 ],
 "assets": [
  "DoubleTake-1794688098053.webp",
  "DoubleTake-1794688141956.webp",
  "DoubleTake-1794688207302.webp",
  "DoubleTake-1794689903746.webp",
  "DoubleTake-1794689970407.webp",
  "DoubleTake-1794690331116.webp",
  "DoubleTake-1794690536901.webp",
  "DoubleTake-1794690757162.webp",
  "DoubleTake-1794696365521.webp",
  "DoubleTake-1794764750650.webp",
  "DoubleTake-1794785072892.webp",
  "DoubleTake-1794786370273.webp",
  "DoubleTake-1794786392763.webp",
  "DoubleTake-1794786428574.webp",
  "DoubleTake-1794786524701.webp",
  "DoubleTake-1794786580862.webp",
  "DoubleTake-1794786674889.webp"
 ]
};
