/* Generado por tools/sync_vault.py — no editar a mano */
window.VAULT = {
 "generated": "2026-11-16T21:53:23+00:00",
 "vaultName": "Cybersecurity",
 "notes": [
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
    "CVE-2026-41567",
    "22 SSH"
   ],
   "embargo": false,
   "body": "## Resumen\n| User flag | Root flag | Vector inicial | Escalada |\n| --------- | --------- | --------------------------------------- | ------------------------------------------- |\n| ✅ | ✅ | [[CVE-2026-123158]] · bypass de auth en sshd (Alpine/musl) | [[CVE-2026-41567]] · escape de contenedor Docker → root del host |\n\n**DoubleTake** (HackTheBox · Linux · Easy) encadena dos CVEs, de ahí el nombre: una debilidad en la autenticación de `sshd` sobre **musl libc** da el acceso inicial dentro de un contenedor, y un fallo de resolución de binarios en el *daemon* de **Docker** permite escapar del contenedor y terminar como **root en el host**.\n\n## 1. Reconocimiento\n```bash\nnmap -sC -sV -p- --min-rate 2000 -oN nmap.txt <IP>\n```\nEl escaneo muestra un objetivo Linux con **[[22 SSH]]** expuesto. El banner y el comportamiento del sistema apuntan a **Alpine Linux**, dato clave porque en Alpine OpenSSH se enlaza contra **musl** en lugar de glibc.\n\n![[DoubleTake-1794688098053.webp]]\n\n![[DoubleTake-1794688207302.webp]]\n\n## 2. Enumeración\nLa enumeración confirma la pila de Alpine/musl y la presencia de **Docker** por detrás del servicio: el acceso inicial cae dentro de un contenedor, no sobre el host directamente.\n\n![[DoubleTake-1794688141956.webp]]\n\n## 3. Explotación (acceso inicial)\nVector: **[[CVE-2026-123158]]**. Se aprovecha el manejo de contraseñas de `sshd` cuando `crypt()` lo provee **musl** para pasar la autenticación y entrar por SSH como el usuario del contenedor (`alpine`). La causa raíz, la detección y la mitigación están en la nota del CVE.\n\n![[DoubleTake-1794689903746.webp]]\n\n![[DoubleTake-1794689970407.webp]]\n\n## 4. Escalada de privilegios\n\n![[DoubleTake-1794690331116.webp]]\n\n![[DoubleTake-1794690536901.webp]]\n\n![[DoubleTake-1794690757162.webp]]\n\n![[DoubleTake-1794696365521.webp]]\n\n![[DoubleTake-1794764750650.webp]]\n\nVector: **[[CVE-2026-41567]]**. Ya dentro del contenedor, se abusa del *daemon* de Docker: al descomprimir archivos subidos por su API resuelve binarios como `xz`/`unpigz` contra el *rootfs* del **contenedor** pero los ejecuta como **root del host**. Colocando un binario con ese nombre se logra ejecución como root del host y, desde ahí, la *root flag*. PoC completa en la nota del CVE.\n\nxz trojan\n![[DoubleTake-1794785072892.webp]]\n![[DoubleTake-1794786370273.webp]]\n![[DoubleTake-1794786392763.webp]]\n![[DoubleTake-1794786428574.webp]]\n![[DoubleTake-1794786524701.webp]]\n![[DoubleTake-1794786580862.webp]]\n\nda error ya que nada puede descomprimir el xz. y gracias a eso obtenemos acceso\n\n![[DoubleTake-1794786674889.webp]]\n\n## 5. Lecciones aprendidas\n- Dos vulnerabilidades de severidad media encadenadas dan compromiso total: autenticación débil para entrar y escape de contenedor para ser root.\n- Identificar la *libc* (musl vs glibc) y detectar un Docker accesible desde el contenedor es parte del reconocimiento, no un detalle menor.\n- Las dos patas se cortan con medidas conocidas: SSH solo con claves (`PasswordAuthentication no`) y Docker actualizado (≥ 29.5.1) o *rootless*.\n\n## Referencias\n- [[CVE-2026-123158]] — bypass de autenticación en sshd (Alpine/musl)\n- [[CVE-2026-41567]] — escape de contenedor en Docker (CWE-427)\n- HackTheBox · DoubleTake (máquina retirada)\n",
   "mtime": "2026-11-16T21:36:03.972744+00:00"
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
    "CVE-2026-123158",
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "## Descripción\nFallo de **resolución de binarios** en el *daemon* de **Docker** (hasta la versión **29.5.0**) que permite un **escape de contenedor** y la ejecución de código como **root en el host**. Al recibir un archivo comprimido por la API `PUT /containers/{id}/archive`, el *daemon* resuelve los binarios de descompresión (`xz`, `unpigz`) usando el **sistema de archivos *overlay* del contenedor** en lugar del **host**, y los ejecuta como **root del host con `CAP_SYS_ADMIN`**. Visto en la máquina [[DoubleTake]] (HackTheBox) como vector de **escalada de privilegios**.\n\nRelacionada temáticamente con [[CVE-2026-123158]] (acceso inicial en la misma máquina).\n\n**Servicio afectado:** API del *daemon* de Docker (socket Unix local `/var/run/docker.sock`; 2375/2376 si se expone sobre TCP). No corresponde a ninguno de los [[Puertos comunes]] de red, por eso no se enlaza a una nota de puerto.\n\n## Causa raíz\n- La API de Docker expone `PUT /containers/{id}/archive` para subir archivos dentro de un contenedor. Cuando el archivo viene comprimido, el *daemon* lo descomprime invocando binarios externos.\n- Para formatos como **`.xz`** y **`.gz` con *pigz*** el *daemon* llama a `xz` y `unpigz`, pero **los busca en el `PATH` resolviéndolos contra el `rootfs` *overlay* del contenedor**, no contra el host.\n- Esos binarios se ejecutan **en el contexto del host**, como **root** y con **`CAP_SYS_ADMIN`**. Un atacante que controle el contenido del contenedor puede plantar un binario troyano con ese nombre y lograr que el host lo ejecute con privilegios.\n- Es un caso clásico de **CWE-427 (Uncontrolled Search Path Element)**: confianza en una ruta de búsqueda controlada por un componente de menor privilegio.\n- Las implementaciones **puras en Go** (`bzip2`, `zstd`, `gzip` nativo) **no** llaman a binarios externos y, por tanto, **no son explotables**. Solo las rutas que delegan en `xz` y `unpigz` son vulnerables.\n\n## Impacto\n- **Escape de contenedor** → ejecución de código arbitrario como **root en el host**.\n- Compromiso total del *host* Docker desde un contenedor sin privilegios aparentes.\n- En [[DoubleTake]] se usa para pasar de un usuario dentro del contenedor a **root del host**.\n\n## Cómo se explota\nIdea general: subir primero el binario troyano (como `.tar` plano, para que quede tal cual en el *overlay* del contenedor) y luego **disparar** la descompresión subiendo cualquier `.tar.xz`, que hará que el *daemon* ejecute el `xz` del contenedor como root del host.\n\n1. **Plantar el troyano** en `/usr/bin/xz` del contenedor mediante una subida `.tar` plana (sin compresión).\n2. **Disparar** subiendo un archivo `.tar.xz`: el *daemon* intenta descomprimirlo invocando el `xz` que ahora apunta al troyano.\n3. El troyano se ejecuta como **root del host con `CAP_SYS_ADMIN`**; desde ahí se monta **procfs** y se hace `chroot /proc/1/root` para operar sobre el sistema de archivos del host.\n\n```http\nPUT /containers/{id}/archive?path=/usr/bin HTTP/1.1\nHost: docker\nContent-Type: application/x-tar\n\n<archivo .tar plano con un /usr/bin/xz troyano>\n\n--- luego, para disparar la descompresión ---\n\nPUT /containers/{id}/archive?path=/tmp HTTP/1.1\nHost: docker\nContent-Type: application/x-tar\n\n<archivo .tar.xz cualquiera -> el daemon ejecuta el \"xz\" del contenedor como root del host>\n```\n\n> [!tip] Escape vía procfs\n> Una vez con ejecución como root del host, el payload típico monta `procfs` y usa `chroot /proc/1/root` para acceder al *rootfs* del host (PID 1) y ejecutar comandos fuera del contenedor.\n\n## Cómo se detecta\n- Monitorizar llamadas a la API **`PUT /containers/{id}/archive`**, especialmente subidas de archivos comprimidos (`.tar.xz`, `.tar.gz`).\n- **Auditar los binarios de los contenedores**: buscar `xz` / `unpigz` modificados o sospechosos dentro del *rootfs* del contenedor.\n- Comprobar la **versión de Docker** (`docker version` / `docker info`): las versiones **≤ 29.5.0** son vulnerables.\n- Vigilar procesos `xz`/`unpigz` lanzados por el *daemon* (`dockerd`) con rutas que apunten al *overlay* de un contenedor.\n\n## Mitigación\n- **Actualizar a Docker Engine 29.5.1 o superior**, donde se corrige la resolución de binarios.\n- **Restringir el acceso a la API** de Docker (no exponer el socket/`tcp` sin autenticación; limitar quién puede subir archivos a los contenedores).\n- Usar **Docker *rootless***, de forma que el *daemon* no corra como root del host.\n- Aplicar defensa en profundidad: *seccomp*, AppArmor/SELinux y evitar otorgar `CAP_SYS_ADMIN` innecesariamente.\n\n## Laboratorio / práctica\n- [[DoubleTake]] (HackTheBox), escalada de privilegios a root del host.\n\n## Referencias\n- Aviso de corrección: Docker Engine **29.5.1**.\n- Informe técnico en el repo Informes-Tecnicos (en preparación).\n-\n",
   "mtime": "2026-11-16T21:36:03.942767+00:00"
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
    "DoubleTake",
    "22 SSH"
   ],
   "embargo": false,
   "body": "## Descripción\nVulnerabilidad en la autenticación por contraseña de `sshd` en sistemas **Alpine Linux**, donde OpenSSH usa **musl libc** en lugar de glibc. Vista en la máquina [[DoubleTake]] (HackTheBox) como vector de acceso inicial.\n\n**Servicio/puerto afectado:** [[22 SSH]].\n\n> [!warning] Por verificar\n> No encontré todavía un aviso público (NVD, Alpine o musl) para este CVE. Completar severidad, CVSS, CWE y versiones afectadas cuando se confirme.\n\n## Causa raíz\n- En Alpine, `crypt()` lo implementa musl, que maneja los hashes de `/etc/shadow` (`$5$` SHA-256, `$6$` SHA-512, con salt).\n- El problema está en cómo sshd/PAM se comporta con la búsqueda del salt y las comparaciones de contraseñas.\n- \n\n## Impacto\n- Acceso inicial por SSH a un usuario del sistema (en DoubleTake, `alpine`).\n- \n\n## Cómo se explota\nVer la sección *3. Explotación* de [[DoubleTake]].\n```http\n\n```\n\n## Cómo se detecta\n- Revisar los logs de autenticación de sshd (`/var/log/messages` o `/var/log/auth.log`) buscando fallos repetidos o intentos con entradas anómalas para un mismo usuario.\n- Comprobar la versión de los paquetes `musl` y `openssh` instalados (`apk info -v musl openssh`).\n\n## Mitigación\n- Actualizar `musl` y `openssh` a las versiones corregidas (`apk upgrade`).\n- Desactivar la autenticación por contraseña y usar solo claves (`PasswordAuthentication no` en `sshd_config`).\n- Limitar intentos con `MaxAuthTries` y herramientas como fail2ban.\n\n## Laboratorio / práctica\n- [[DoubleTake]] (HackTheBox), acceso inicial.\n\n## Referencias\n- Informe técnico en el repo Informes-Tecnicos (en preparación).\n-\n",
   "mtime": "2026-11-16T21:36:03.912536+00:00"
  },
  {
   "id": "CVE-2023-0386",
   "title": "CVE-2023-0386",
   "path": "04 Vulnerabilidades/CVE-2023-0386.md",
   "folder": "04 Vulnerabilidades",
   "props": {
    "tipo": "vulnerabilidad",
    "cve": "CVE-2023-0386",
    "cwe": "CWE-282",
    "owasp": null,
    "mitre": "T1068",
    "severidad": "alta",
    "cvss": "7.8 (Alta)",
    "estado": "documentado",
    "tags": [
     "vulnerabilidad",
     "linux",
     "kernel",
     "overlayfs",
     "fuse",
     "privesc"
    ],
    "creado": "2026-11-16"
   },
   "tags": [
    "vulnerabilidad",
    "linux",
    "kernel",
    "overlayfs",
    "fuse",
    "privesc"
   ],
   "links": [],
   "embargo": false,
   "body": "## Descripción\nEscalada de **privilegios local** en el kernel de Linux por un error en la validación de metadatos de **OverlayFS**. Afecta a kernels **5.11 – 6.1.8** (salvo correcciones posteriores como 5.15.91). Publicada en **enero de 2023**. Vista en la máquina <span class=\"embargo\" title=\"Máquina activa de HTB: embargada hasta su retiro\">████████</span> (HackTheBox) como vector de **escalada a root**.\n\nOverlayFS combina dos directorios en una sola vista: **`lowerdir`** (solo lectura) y **`upperdir`** (escribible). El fallo está en que el kernel **no valida correctamente los metadatos** de los archivos que vienen del `lowerdir`, permitiendo que un archivo con UID/GID falsificados y el bit **setuid** se copie al `upperdir` como si tuviera privilegios de root legítimos.\n\n## Causa raíz\n- Un atacante presenta un `lowerdir` manipulado (por ejemplo montado con **FUSE**) con archivos que declaran **UID 0, GID 0 y setuid activado**.\n- Al combinarlo con OverlayFS, el kernel **copia esos archivos al `upperdir` sin comprobar** si los metadatos (UID/GID) están mapeados en el *namespace* del usuario actual.\n- El resultado es un binario **efectivamente setuid root** controlado por el atacante.\n- Es un caso de **CWE-282 (Improper Ownership Management)**: se confía en metadatos de propiedad provenientes de un componente de menor privilegio.\n\n## Impacto\n- Un usuario local sin privilegios obtiene un binario **setuid root** y, al ejecutarlo, una **shell de root**.\n- Compromiso total del host a partir de una cuenta de usuario normal.\n- En <span class=\"embargo\" title=\"Máquina activa de HTB: embargada hasta su retiro\">████████</span> se usa para pasar del usuario `admin` a **root**.\n\n## Cómo se explota\nIdea general: usar **FUSE** para montar un `lowerdir` falso con un binario que declare UID 0, GID 0 y setuid; montar un OverlayFS que lo copie al `upperdir`; ejecutar el binario resultante (que lanza `/bin/sh` con `setuid(0)`) para obtener root.\n\n1. **FUSE** genera un `lowerdir` con un binario `setuid root` falso (metadatos falsificados, sin ser root).\n2. **OverlayFS** copia ese binario al `upperdir` sin validar los metadatos.\n3. Se ejecuta el binario *setuid root* resultante → **shell de root**.\n\nEn la práctica (p. ej. el PoC `xkaneiki/CVE-2023-0386`) se compila con `make all` y se lanza:\n```bash\n./fuse ./ovlcap/lower ./gc &   # monta el lowerdir falso con FUSE\n./exp                          # dispara OverlayFS y obtiene root\n```\n\n> [!note] Payload mínimo\n> Basta un binario que haga `setuid(0)` y ejecute `/bin/sh`. FUSE solo falsifica los metadatos visibles en el `lowerdir`; no se modifica el binario del exploit.\n\n## Cómo se detecta\n- Comprobar la **versión del kernel** (`uname -r`): las ramas **5.11 – 6.1.8** sin backport son vulnerables.\n- Vigilar **montajes FUSE** y **montajes OverlayFS** creados por usuarios sin privilegios, y la aparición de binarios **setuid root** nuevos en directorios escribibles.\n- Herramientas de enumeración local (linpeas) marcan el kernel como potencialmente vulnerable.\n\n## Mitigación\n- **Actualizar el kernel** a una versión con el parche (que añade `kuid_has_mapping` / `kgid_has_mapping` para verificar que UID/GID estén mapeados en el *namespace* actual, abortando la copia si no lo están).\n- Restringir la creación de ***user namespaces*** sin privilegios (`kernel.unprivileged_userns_clone=0`) donde no se necesiten.\n- Limitar el uso de **FUSE** por usuarios no confiables.\n\n## Laboratorio / práctica\n- <span class=\"embargo\" title=\"Máquina activa de HTB: embargada hasta su retiro\">████████</span> (HackTheBox), escalada de privilegios a root del host.\n\n## Referencias\n- [CVE-2023-0386 (MITRE)](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-0386)\n- Informe técnico propio: repo **Informes-Tecnicos** → `CVE-2023-0386`.\n- PoC: `xkaneiki/CVE-2023-0386` (GitHub).\n",
   "mtime": "2026-11-16T21:35:49.244816+00:00"
  },
  {
   "id": "TwoMillon",
   "title": "TwoMillon",
   "path": "03 Máquinas y CTF/TwoMillon.md",
   "folder": "03 Máquinas y CTF",
   "props": {
    "tipo": "maquina",
    "plataforma": "HackTheBox",
    "dificultad": "fácil",
    "so": "Linux",
    "estado": "completado",
    "inicio": "2026-11-16"
   },
   "tags": [
    "ctf"
   ],
   "links": [],
   "embargo": true,
   "body": "",
   "hiddenLinks": 3,
   "mtime": "2026-11-16T21:35:48.680751+00:00"
  },
  {
   "id": "Puertos comunes",
   "title": "Puertos comunes",
   "path": "01 Conceptos/Puertos comunes.md",
   "folder": "01 Conceptos",
   "props": {
    "tipo": "indice",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "indice",
     "redes"
    ]
   },
   "tags": [
    "indice",
    "redes"
   ],
   "links": [
    "21 FTP",
    "22 SSH",
    "23 Telnet",
    "25 SMTP",
    "53 DNS",
    "80 HTTP",
    "88 Kerberos",
    "110 POP3",
    "135 MSRPC",
    "139 NetBIOS",
    "389 LDAP",
    "443 HTTPS",
    "445 SMB",
    "3306 MySQL",
    "3389 RDP",
    "5432 PostgreSQL",
    "5985 WinRM"
   ],
   "embargo": false,
   "body": "# Puertos comunes\n\nÍndice de los puertos por defecto que vas a ver en casi cualquier escaneo con nmap. Cada uno tiene su propia nota con enumeración y una tarjeta de repaso. Repasá las *flashcards* con `Ctrl+P` → *Spaced Repetition: Review flashcards*.\n\n## Tabla\n| Puerto | Servicio | Nota |\n| ------ | -------- | ---- |\n| 21 | FTP | [[21 FTP]] |\n| 22 | SSH | [[22 SSH]] |\n| 23 | Telnet | [[23 Telnet]] |\n| 25 | SMTP | [[25 SMTP]] |\n| 53 | DNS | [[53 DNS]] |\n| 80 | HTTP | [[80 HTTP]] |\n| 88 | Kerberos | [[88 Kerberos]] |\n| 110 | POP3 | [[110 POP3]] |\n| 135 | MSRPC | [[135 MSRPC]] |\n| 137-139 | NetBIOS | [[139 NetBIOS]] |\n| 389 / 636 | LDAP / LDAPS | [[389 LDAP]] |\n| 443 | HTTPS | [[443 HTTPS]] |\n| 445 | SMB | [[445 SMB]] |\n| 3306 | MySQL | [[3306 MySQL]] |\n| 3389 | RDP | [[3389 RDP]] |\n| 5432 | PostgreSQL | [[5432 PostgreSQL]] |\n| 5985 / 5986 | WinRM | [[5985 WinRM]] |\n\n## Todas las notas de puertos\n```dataview\nTABLE WITHOUT ID file.link AS \"Nota\", puerto AS \"Puerto\", protocolo AS \"Protocolo\"\nFROM \"01 Conceptos/Puertos\"\nSORT number(puerto) ASC\n```\n",
   "mtime": "2026-11-16T21:35:48.658129+00:00"
  },
  {
   "id": "5985 WinRM",
   "title": "5985 WinRM",
   "path": "01 Conceptos/Puertos/5985 WinRM.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "5985",
    "protocolo": "tcp",
    "servicio": "WinRM",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **WinRM** — tcp\n\nAdministración remota de Windows (PowerShell remoting). Con credenciales válidas da *shell* directa con **evil-winrm**. **5986** es la variante HTTPS.\n\n## Enumeración rápida\n```bash\nnmap -p5985,5986 -sV <IP>\nevil-winrm -i <IP> -u usuario -p 'pass'\n```\n\n## Repaso (flashcard)\n¿Puertos de WinRM?::5985 (HTTP) y 5986 (HTTPS)\n",
   "mtime": "2026-11-16T21:34:34.710660+00:00"
  },
  {
   "id": "5432 PostgreSQL",
   "title": "5432 PostgreSQL",
   "path": "01 Conceptos/Puertos/5432 PostgreSQL.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "5432",
    "protocolo": "tcp",
    "servicio": "PostgreSQL",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **PostgreSQL** — tcp\n\nBase de datos. Igual que MySQL: credenciales débiles, acceso remoto y, según permisos, ejecución de comandos (`COPY ... PROGRAM`).\n\n## Enumeración rápida\n```bash\nnmap -p5432 -sV --script pgsql-brute <IP>\npsql -h <IP> -U postgres\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de PostgreSQL?::5432/tcp\n",
   "mtime": "2026-11-16T21:34:34.695493+00:00"
  },
  {
   "id": "3389 RDP",
   "title": "3389 RDP",
   "path": "01 Conceptos/Puertos/3389 RDP.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "3389",
    "protocolo": "tcp",
    "servicio": "RDP",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **RDP** — tcp\n\nEscritorio remoto de Windows. Objetivo de fuerza bruta y reutilización de credenciales; a veces *NLA* deshabilitado.\n\n## Enumeración rápida\n```bash\nnmap -p3389 -sV --script rdp-ntlm-info,rdp-enum-encryption <IP>\nxfreerdp /u:usuario /p:pass /v:<IP>\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de RDP?::3389/tcp\n",
   "mtime": "2026-11-16T21:34:34.690003+00:00"
  },
  {
   "id": "3306 MySQL",
   "title": "3306 MySQL",
   "path": "01 Conceptos/Puertos/3306 MySQL.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "3306",
    "protocolo": "tcp",
    "servicio": "MySQL",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **MySQL** — tcp\n\nBase de datos. Buscar credenciales por defecto/débiles y acceso remoto habilitado; de ahí a lectura de datos o escritura de archivos.\n\n## Enumeración rápida\n```bash\nnmap -p3306 -sV --script mysql-info,mysql-empty-password,mysql-brute <IP>\nmysql -h <IP> -u root -p\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de MySQL?::3306/tcp\n",
   "mtime": "2026-11-16T21:34:34.658990+00:00"
  },
  {
   "id": "445 SMB",
   "title": "445 SMB",
   "path": "01 Conceptos/Puertos/445 SMB.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "445",
    "protocolo": "tcp",
    "servicio": "SMB",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes",
    "139 NetBIOS"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **SMB** — tcp\n\nCompartición de archivos en Windows (SMB directo sobre TCP). Enumerar **recursos compartidos** y probar sesión nula; históricamente blanco de EternalBlue (MS17-010).\n\n## Enumeración rápida\n```bash\nnmap -p445 -sV --script smb-enum-shares,smb-os-discovery,smb-vuln-ms17-010 <IP>\nsmbclient -L //<IP>/ -N\ncrackmapexec smb <IP>\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de SMB?::445/tcp\n\n## Relacionado\n- Relacionado con [[139 NetBIOS]].\n",
   "mtime": "2026-11-16T21:34:34.645667+00:00"
  },
  {
   "id": "443 HTTPS",
   "title": "443 HTTPS",
   "path": "01 Conceptos/Puertos/443 HTTPS.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "443",
    "protocolo": "tcp",
    "servicio": "HTTPS",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes",
    "80 HTTP"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **HTTPS** — tcp\n\nServidor web **cifrado con TLS**. Mismo enfoque que HTTP, revisando además el certificado (nombres alternativos, dominios internos) y la configuración TLS.\n\n## Enumeración rápida\n```bash\nnmap -p443 -sV --script ssl-cert,ssl-enum-ciphers <IP>\nsslscan <IP>:443\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de HTTPS?::443/tcp\n\n## Relacionado\n- Mismo flujo web que [[80 HTTP]].\n",
   "mtime": "2026-11-16T21:34:34.631319+00:00"
  },
  {
   "id": "389 LDAP",
   "title": "389 LDAP",
   "path": "01 Conceptos/Puertos/389 LDAP.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "389",
    "protocolo": "tcp",
    "servicio": "LDAP",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **LDAP** — tcp\n\nDirectorio (habitual en **Active Directory**). Permite volcar usuarios, grupos y la estructura del dominio. **636** es LDAPS (cifrado).\n\n## Enumeración rápida\n```bash\nnmap -p389 -sV --script ldap-rootdse,ldap-search <IP>\nldapsearch -x -H ldap://<IP> -b 'dc=dominio,dc=htb'\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de LDAP?::389 (636 para LDAPS)\n",
   "mtime": "2026-11-16T21:34:34.627843+00:00"
  },
  {
   "id": "139 NetBIOS",
   "title": "139 NetBIOS",
   "path": "01 Conceptos/Puertos/139 NetBIOS.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "139",
    "protocolo": "tcp",
    "servicio": "NetBIOS",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes",
    "445 SMB"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **NetBIOS** — tcp\n\nNetBIOS Session Service (SMB sobre NetBIOS en Windows antiguos). Junto a 137/138 (UDP) permite **enumerar nombres y recursos compartidos**.\n\n## Enumeración rápida\n```bash\nnmap -p137,139 --script nbstat,smb-os-discovery <IP>\nnmblookup -A <IP>\n```\n\n## Repaso (flashcard)\n¿Puertos de NetBIOS en Windows?::137-139 (NetBIOS)\n\n## Relacionado\n- Relacionado con [[445 SMB]] (SMB moderno).\n",
   "mtime": "2026-11-16T21:34:34.616543+00:00"
  },
  {
   "id": "135 MSRPC",
   "title": "135 MSRPC",
   "path": "01 Conceptos/Puertos/135 MSRPC.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "135",
    "protocolo": "tcp",
    "servicio": "MSRPC",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **MSRPC** — tcp\n\n*Endpoint Mapper* de RPC en Windows. Permite **enumerar interfaces y servicios** del sistema y, a veces, usuarios.\n\n## Enumeración rápida\n```bash\nnmap -p135 --script msrpc-enum <IP>\nrpcclient -U '' -N <IP>\nimpacket-rpcdump <IP>\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de RPC en Windows?::135 (RPC)\n",
   "mtime": "2026-11-16T21:34:34.588981+00:00"
  },
  {
   "id": "110 POP3",
   "title": "110 POP3",
   "path": "01 Conceptos/Puertos/110 POP3.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "110",
    "protocolo": "tcp",
    "servicio": "POP3",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **POP3** — tcp\n\nDescarga de correo. En texto plano salvo que se use POP3S (995). Permite leer buzones si se obtienen credenciales.\n\n## Enumeración rápida\n```bash\nnmap -p110 -sV --script pop3-capabilities,pop3-brute <IP>\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de POP3?::110/tcp\n",
   "mtime": "2026-11-16T21:34:34.578627+00:00"
  },
  {
   "id": "88 Kerberos",
   "title": "88 Kerberos",
   "path": "01 Conceptos/Puertos/88 Kerberos.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "88",
    "protocolo": "tcp/udp",
    "servicio": "Kerberos",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **Kerberos** — tcp/udp\n\nAutenticación en **Active Directory**. Su presencia delata un Controlador de Dominio. Objetivo de *AS-REP Roasting* y *Kerberoasting*.\n\n## Enumeración rápida\n```bash\nnmap -p88 --script krb5-enum-users --script-args krb5-enum-users.realm='DOMINIO' <IP>\nGetNPUsers.py DOMINIO/ -usersfile users.txt -no-pass\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de Kerberos?::88\n",
   "mtime": "2026-11-16T21:34:34.573206+00:00"
  },
  {
   "id": "80 HTTP",
   "title": "80 HTTP",
   "path": "01 Conceptos/Puertos/80 HTTP.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "80",
    "protocolo": "tcp",
    "servicio": "HTTP",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **HTTP** — tcp\n\nServidor web **sin cifrar**. Punto de entrada más habitual: *fuzzing* de rutas, APIs, paneles de login y vulnerabilidades web. Revisar siempre el código fuente y el JS.\n\n## Enumeración rápida\n```bash\nnmap -p80 -sV <IP>\nwhatweb http://<IP>\ngobuster dir -u http://<IP>/ -w /usr/share/wordlists/dirb/common.txt\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de HTTP?::80/tcp\n\n## Relacionado\n- Visto en <span class=\"embargo\" title=\"Máquina activa de HTB: embargada hasta su retiro\">████████</span>: *fuzzing* con gobuster, bypass del código de invitación y una API REST con *mass-assignment* + inyección de comandos.\n",
   "mtime": "2026-11-16T21:34:34.548615+00:00"
  },
  {
   "id": "53 DNS",
   "title": "53 DNS",
   "path": "01 Conceptos/Puertos/53 DNS.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "53",
    "protocolo": "udp/tcp",
    "servicio": "DNS",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **DNS** — udp/tcp\n\nResolución de nombres. Por **UDP** para consultas normales y por **TCP** para transferencias de zona (`AXFR`), que pueden volcar todos los registros de un dominio.\n\n## Enumeración rápida\n```bash\ndig axfr dominio.htb @<IP>\nnmap -p53 -sV --script dns-zone-transfer <IP>\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de DNS?::53 (UDP, y TCP para transferencias de zona)\n",
   "mtime": "2026-11-16T21:34:34.528976+00:00"
  },
  {
   "id": "25 SMTP",
   "title": "25 SMTP",
   "path": "01 Conceptos/Puertos/25 SMTP.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "25",
    "protocolo": "tcp",
    "servicio": "SMTP",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **SMTP** — tcp\n\nEnvío de correo. Útil para **enumerar usuarios** (`VRFY`, `EXPN`, `RCPT TO`) y detectar *relays* abiertos.\n\n## Enumeración rápida\n```bash\nnmap -p25 -sV --script smtp-commands,smtp-open-relay,smtp-enum-users <IP>\nsmtp-user-enum -M VRFY -U users.txt -t <IP>\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de SMTP?::25/tcp\n",
   "mtime": "2026-11-16T21:34:34.509668+00:00"
  },
  {
   "id": "23 Telnet",
   "title": "23 Telnet",
   "path": "01 Conceptos/Puertos/23 Telnet.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "23",
    "protocolo": "tcp",
    "servicio": "Telnet",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **Telnet** — tcp\n\nAcceso remoto **sin cifrar**: credenciales y sesión viajan en texto plano. Casi siempre un hallazgo a reportar por sí mismo.\n\n## Enumeración rápida\n```bash\nnmap -p23 -sV --script telnet-encryption <IP>\ntelnet <IP>\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de Telnet?::23/tcp\n",
   "mtime": "2026-11-16T21:34:34.486089+00:00"
  },
  {
   "id": "22 SSH",
   "title": "22 SSH",
   "path": "01 Conceptos/Puertos/22 SSH.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "22",
    "protocolo": "tcp",
    "servicio": "SSH",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes",
    "DoubleTake",
    "CVE-2026-123158"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **SSH** — tcp\n\nAcceso remoto cifrado por línea de comandos. Objetivo típico para **fuerza bruta** de credenciales y reutilización de contraseñas filtradas. La *libc* del objetivo (glibc vs **musl** en Alpine) importa para ciertos fallos.\n\n## Enumeración rápida\n```bash\nnmap -p22 -sV <IP>\nssh usuario@<IP>\nhydra -L users.txt -P pass.txt ssh://<IP>\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de SSH?::22/tcp\n\n## Relacionado\n- Visto en [[DoubleTake]] (acceso inicial vía [[CVE-2026-123158]]) y en <span class=\"embargo\" title=\"Máquina activa de HTB: embargada hasta su retiro\">████████</span> (acceso como `admin` reutilizando credenciales del sitio).\n- Vulnerabilidad relacionada: [[CVE-2026-123158]]\n",
   "mtime": "2026-11-16T21:34:34.484130+00:00"
  },
  {
   "id": "21 FTP",
   "title": "21 FTP",
   "path": "01 Conceptos/Puertos/21 FTP.md",
   "folder": "01 Conceptos/Puertos",
   "props": {
    "tipo": "puerto",
    "puerto": "21",
    "protocolo": "tcp",
    "servicio": "FTP",
    "area": "redes",
    "estado": "repasando",
    "tags": [
     "puerto",
     "redes"
    ]
   },
   "tags": [
    "puerto",
    "redes",
    "flashcards/redes"
   ],
   "links": [
    "Puertos comunes"
   ],
   "embargo": false,
   "body": "#flashcards/redes\n\n[[Puertos comunes]] · **FTP** — tcp\n\nProtocolo de transferencia de archivos. Transmite credenciales y datos en **texto plano**. Interesan el login anónimo (`anonymous`) y las versiones vulnerables (p. ej. vsftpd 2.3.4).\n\n## Enumeración rápida\n```bash\nnmap -p21 -sV --script ftp-anon,ftp-syst <IP>\nftp <IP>   # probar usuario anonymous\n```\n\n## Repaso (flashcard)\n¿Puerto por defecto de FTP?::21/tcp\n",
   "mtime": "2026-11-16T21:34:34.470341+00:00"
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
