# ENG-2026-ISAR · "Me hice un pentest a mí mismo"

Portfolio de ciberseguridad de **Iñaki Sarobe** presentado como un **informe de pentest donde el objetivo soy yo**.
Cada hallazgo es una capacidad, la evidencia está en HackTheBox, GitHub y mi vault de Obsidian, y la
remediación recomendada es contactarme.

🌐 https://inakisarobe.github.io

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | Esqueleto del informe (portada, §1–§6, anexos A–C) |
| `data/profile.js` | **Todo el contenido editable**: hallazgos, máquinas HTB, bitácora, arsenal, proyectos |
| `js/app.js` | Terminal interactiva (`nmap`, `help`, `sudo contratar`…), render de secciones, GitHub en vivo |
| `js/vault.js` | Anexo B: grafo de notas tipo Obsidian + lector de Markdown (callouts, wikilinks, flashcards) |
| `vault/vault.js` | **Generado** desde el vault de Obsidian (no editar a mano) |
| `tools/sync_vault.py` | Conector Obsidian → portfolio |
| `publicar.ps1` | Sincroniza el vault, hace commit y push |
| `.well-known/security.txt` | Contacto para reportar vulnerabilidades (RFC 9116) |

## Informes técnicos

Los informes se leen **en vivo** del repo [Informes-Tecnicos](https://github.com/inakiSarobe/Informes-Tecnicos):
cada carpeta `CVE-AAAA-NNNN/CVE-AAAA-NNNN.pdf` aparece sola en el Anexo C y suma al contador.
El Anexo C muestra los 6 más recientes y una tarjeta "+N más". En el hallazgo SAR-005 solo se muestran
algunos ejemplos y un enlace con el total.

En `data/profile.js`:

- `reportNotes`: descripción corta de cada informe (opcional).
- `featuredReports`: cuáles mostrar como ejemplo en SAR-005.

## Conexión con Obsidian

`tools/sync_vault.py` lee el vault (`C:\Programacion\Cybersecurity\Cybersecurity`) y publica las notas de
`01 Conceptos`, `02 Herramientas`, `03 Máquinas y CTF`, `04 Vulnerabilidades` y `05 Cursos`.

Reglas de publicación:

- `publicar: false` en el frontmatter → la nota no se publica.
- **Máquinas de HackTheBox** (`tipo: maquina` + `plataforma: HackTheBox`) salen **embargadas**
  (solo metadatos) hasta que agregues `retirada: true`. Las reglas de HTB prohíben publicar soluciones de
  máquinas activas.
- Cualquier mención a una máquina embargada en otras notas se reemplaza por `████████`.
- Se eliminan los comentarios `%% … %%` y la propiedad `ip`.
- Las imágenes `![[...]]` de las notas publicadas se copian a `vault/assets/`.

Para que una máquina retirada aparezca completa, agregá en su frontmatter:

```yaml
retirada: true
```

## Publicar (GitHub Pages, gratis)

Primera vez:

1. Creá en GitHub un repo **público** llamado exactamente `inakiSarobe.github.io`.
2. En esta carpeta:

   ```powershell
   git init -b main
   git add -A
   git commit -m "Informe ENG-2026-ISAR"
   git remote add origin https://github.com/inakiSarobe/inakiSarobe.github.io.git
   git push -u origin main
   ```

3. En el repo: **Settings → Pages → Source: Deploy from a branch → `main` / root**.
4. En 1–2 minutos queda en https://inakisarobe.github.io

Después de cada cambio en el vault o en `data/profile.js`:

```powershell
.\publicar.ps1 "Agrego writeup de Cap"
```

> Tip: con el plugin **Shell commands** de Obsidian podés correr `publicar.ps1` desde Obsidian con un atajo.

## Vista local

```powershell
py -m http.server 5518 --bind 127.0.0.1
```

y abrí http://127.0.0.1:5518

## Easter eggs

- La terminal de la portada acepta comandos (`help`).
- Hay una flag para quien abra DevTools.
- `robots.txt` y `security.txt` también son parte del informe.
- Imprimir la página (Ctrl+P) genera una versión en PDF con formato de informe.
