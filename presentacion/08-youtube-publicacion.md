# 🎬 YouTube — Publicación de Video
## DomoNow PropTech | Prueba Técnica Senior .NET 10 + Angular 19 + Vue 3

---

## 📌 TÍTULO DEL VIDEO (Copiar exacto)

```
DomoNow | Prueba Técnica Senior: .NET 10 + Angular 19 + Vue 3 + Single-SPA + PostgreSQL 17 | Arquitectura Real
```

> **Título alternativo (más conciso):**
> ```
> Prueba Técnica .NET 10 COMPLETA: Clean Architecture + CQRS + Microfrontends + Concurrencia Real
> ```

---

## 📝 DESCRIPCIÓN DEL VIDEO (Copiar en YouTube)

```
🚗 DomoNow — Sistema de Gestión de Parqueaderos de Visitantes
Prueba técnica para rol de Desarrollador Senior / Tech Lead @ OFIMA SAS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 ARQUITECTURA IMPLEMENTADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este video documenta la presentación técnica completa del sistema DomoNow, 
una plataforma PropTech para automatización de control de acceso vehicular en 
copropiedades residenciales. El sistema resuelve un problema real de concurrencia:
garantizar matemáticamente que dos guardias no puedan asignar el mismo cupo de 
parqueadero simultáneamente — incluso bajo escalado horizontal.

▶ Backend: .NET 10 LTS (C# 14) con Clean Architecture + CQRS (MediatR)
▶ Frontend 1: Angular 19 Standalone + Signals + OnPush — Portería
▶ Frontend 2: Vue 3 Composition API + Pinia — Analítica Predictiva
▶ Orquestador: Single-SPA Root Config (Vanilla TypeScript)
▶ Base de datos: PostgreSQL 17 Alpine en Podman
▶ Concurrencia: xmin optimista + índice parcial único (doble capa)
▶ Pruebas: 16 tests (xUnit + FluentAssertions) — 1 HTTP 201 + 9 HTTP 409 bajo carrera

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ CAPÍTULOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

00:00 — Introducción y contexto del problema de negocio
03:00 — Arquitectura y decisiones técnicas (4 EDRs clave)
09:00 — Backend .NET 10: Clean Architecture, CQRS, DDD y concurrencia
16:00 — Frontend: Single-SPA + Angular 19 + Vue 3
21:00 — Calidad: 16 pruebas automatizadas y documentación
25:00 — Uso de IA con criterio técnico — Auditoría de seguridad Zero Trust
29:00 — Trade-offs, cierre y demo en vivo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️ DECISIONES DE ARQUITECTURA ABORDADAS EN EL VIDEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Por qué CQRS + MediatR en lugar de un ParkingService monolítico
✅ Por qué DDD con Rich Domain Model y no entidades anémicas con setters públicos
✅ Por qué un índice parcial único en PostgreSQL y no SemaphoreSlim en C#
✅ Por qué Microfrontends Single-SPA y no un monolito React o Angular
✅ Por qué DDL idempotente y no EF Core Migrations en runtime
✅ Por qué postMessage híbrido y no window.location.reload() para i18n

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 SECCIÓN ESPECIAL: AUDITORÍA DE SEGURIDAD (ZERO TRUST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El login fue implementado deliberadamente sin seguridad real para demostrar 
que un sistema funcionalmente completo sin seguridad es un prototipo, no un 
producto. Se presenta una auditoría de 14 vulnerabilidades documentadas con:

🔴 SEC-001: Credenciales hardcodeadas en código fuente TypeScript (CWE-798)
🔴 SEC-002: Sesión falsificable desde la consola del navegador (CWE-602)
🔴 SEC-003: API REST completamente pública — sin autenticación (CWE-306)
🔴 SEC-004: Sin [Authorize] en ningún controlador .NET (CWE-285)
🟠 + 10 vulnerabilidades adicionales de severidad Alta, Media y Baja

Metodología: Zero Trust — "Never Trust, Always Verify"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 REPOSITORIO Y DOCUMENTACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 GitHub: https://github.com/jhoney787813/collection-domonow
📄 Auditoría de Seguridad: /docs/auditoria_seguridad.md
📐 Open Spec (8 archivos): /open-spec/
📋 Engineering Decision Records: /AI-USAGE.md
🗺️ Diagramas C4: /docs/architecture/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ STACK TECNOLÓGICO COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backend:
• .NET 10 LTS / C# 14 / ASP.NET Core Web API
• MediatR 12.4 (CQRS)
• FluentValidation (Pipeline Behaviors)
• Entity Framework Core 10 + Npgsql
• PostgreSQL 17 Alpine (Podman)
• xUnit + FluentAssertions (16 pruebas)
• RFC 7807 ProblemDetails (error handling)
• OpenAPI 3.1 / Swagger UI

Frontend:
• Single-SPA 6.x (Root Orchestrator)
• Angular 19 (Standalone, Signals, OnPush, Zone-less)
• Vue 3 (Composition API, script setup, Pinia)
• Vite (Vue bundler)
• @domonow/ui-tokens (Design System compartido)
• Plus Jakarta Sans / Inter (tipografía)
• CSS custom properties (Design Tokens #6C35DE)

Infraestructura:
• Podman 5.x ARM64 (macOS Apple Silicon)
• podman-compose (orquestación multi-contenedor)
• DDL idempotente (PostgreSQL init.d)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#dotnet #csharp #angular #vuejs #singlespa #microfrontends
#postgresql #cleanarchitecture #cqrs #ddd #mediator
#pruebatecnica #desarrolladorsenior #techlead #softwarearchitecture
#concurrency #zerotrust #security #dotnet10 #angular19
#colombia #ofima #domonow #proptech #backend #frontend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Jhon Edison Hincapié García
Solutions Architect & Senior Full Stack Engineer
```

---

## 🔖 MINIATURA SUGERIDA (Elementos visuales)

```
DISEÑO DE MINIATURA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fondo: Degradado oscuro #0F172A → #1E1B4B

Logo DomoNow (esquina superior izquierda)
  "Domo" en #6C35DE | "Now" en blanco

TEXTO PRINCIPAL (grande, bold):
  "Prueba Técnica SENIOR"

TEXTO SECUNDARIO:
  ".NET 10 + Angular 19 + Vue 3"
  "Single-SPA + CQRS + Concurrencia Real"

BADGES/ÍCONOS (fila horizontal):
  🔵 .NET 10    🔴 Angular 19    🟢 Vue 3
  🐘 PostgreSQL  🟣 Single-SPA

ESQUINA INFERIOR DERECHA:
  Screenshot del sistema corriendo
  (grilla de cupos P-01 a P-30)

SELLO/BADGE esquina superior derecha:
  "🔐 ZERO TRUST AUDIT"
  en rojo sobre fondo oscuro
```

---

## 📱 POST SUGERIDO — LINKEDIN

```
🚀 Presentación Técnica Completa — DomoNow PropTech Platform

Documenté en video la solución que desarrollé para una prueba técnica de rol 
Senior Developer / Tech Lead: un sistema de gestión de parqueaderos de visitantes 
para copropiedades residenciales.

Pero más que una prueba — es un caso de estudio sobre gobernanza de IA y criterio técnico.

🏗️ LO QUE SE CONSTRUYÓ:
├── Backend .NET 10 (Clean Architecture + CQRS + MediatR)
├── Angular 19 (Standalone + Signals) para portería
├── Vue 3 (Composition API + Pinia) para analítica
├── Single-SPA como orquestador de microfrontends
├── PostgreSQL 17 en Podman con inicialización automática
└── 16 pruebas automatizadas (incluyendo carrera de 10 peticiones simultáneas)

🎯 EL RETO TÉCNICO CENTRAL:
Garantizar matemáticamente que dos guardias no puedan asignar el mismo 
cupo simultáneamente — incluso bajo escalado horizontal con múltiples réplicas.

Solución: Defensa en profundidad con dos capas:
1️⃣ Concurrencia optimista con xmin de PostgreSQL (EF Core)
2️⃣ Índice único parcial en DB: WHERE status = 1

Resultado de la prueba: 1 HTTP 201 Created + 9 HTTP 409 Conflict. 
Exactamente lo esperado. Matemáticamente correcto.

🤖 USO DE IA CON CRITERIO:
La IA propuso SemaphoreSlim para concurrencia.
Lo rechacé — falla en producción con múltiples réplicas.

La IA propuso entidades anémicas con setters públicos.
Lo rechacé — viola encapsulamiento y permite bypassear invariantes de dominio.

La IA propuso window.location.reload() para cambio de idioma.
Lo rechacé — destruye el estado transaccional en curso.

Un Tech Lead no delega las decisiones arquitectónicas a la IA.
La usa como copiloto — no como piloto automático.

🔐 LO MÁS HONESTO DEL PROYECTO:
El login está deliberadamente sin seguridad real.
¿Por qué? Para demostrar que un sistema funcionalmente completo 
sin seguridad es un PROTOTIPO — no un producto.

Generé una auditoría de seguridad de 14 vulnerabilidades 
(4 críticas, 4 altas, 5 medias) con evidencia técnica, pruebas de 
concepto y hoja de ruta de remediación Zero Trust.

Porque la seguridad no es una feature — es un requisito transversal.
Y cuando no está en los requerimientos iniciales, es responsabilidad 
del equipo técnico señalarlo, no ignorarlo.

🔗 Repositorio completo (abierto):
https://github.com/jhoney787813/collection-domonow

🎬 Video de presentación: [LINK AL VIDEO]

#SoftwareArchitecture #DotNet #Angular #VuJS #SingleSPA
#CleanArchitecture #CQRS #Microfrontends #TechLead #ZeroTrust
#PruebaTecnica #CriterioTecnico #AI #DesarrolladorSenior #Colombia
```

---

## 🐦 POST SUGERIDO — X (TWITTER)

```
Presentación técnica completa de mi prueba Senior Dev:
.NET 10 + Angular 19 + Vue 3 + Single-SPA + CQRS + PostgreSQL

El reto: garantizar matemáticamente que 2 guardias no asignen 
el mismo cupo simultáneamente.

La IA propuso SemaphoreSlim.
Yo implementé xmin + índice parcial único.

¿La diferencia? El semáforo falla con múltiples réplicas en Kubernetes.
El índice no. Nunca.

Resultado del test de carrera: 1✅ + 9❌ (perfecto)

🔐 + generé la auditoría de seguridad de mis propias vulnerabilidades.
Porque un senior no entrega código inseguro sin documentarlo.

GitHub: https://github.com/jhoney787813/collection-domonow

#dotnet #angular #vuejs #cqrs #cleanarchitecture #techlead
```

---

## 📋 CHECKLIST ANTES DE PUBLICAR EN YOUTUBE

```
PREPARACIÓN DEL VIDEO:
[ ] Grabar pantalla completa (1920x1080 mínimo)
[ ] Micrófono sin eco — probar audio antes
[ ] Cerrar notificaciones del sistema operativo
[ ] Tener el sistema corriendo: Podman + Backend + 3 MFEs
[ ] Tener terminal lista para ejecutar: dotnet test
[ ] Abrir en tabs: localhost:9000, localhost:5050/swagger, GitHub repo

SECUENCIA DE DEMO (del guión 07):
[ ] 1. Login en localhost:9000 (mencionar que es deliberado)
[ ] 2. Grilla de 30 cupos con colores
[ ] 3. Clic en cupo → Modal → Placa autoformateada
[ ] 4. Cambio de idioma ESP ↔ ENG sin recarga
[ ] 5. /analytics — dashboard Vue
[ ] 6. Botón "⚡ Simular Ráfaga Concurrente"
[ ] 7. Swagger UI — documentación
[ ] 8. dotnet test — 16 pruebas pasando

SUBIDA A YOUTUBE:
[ ] Título copiado exacto de este archivo
[ ] Descripción completa con capítulos (timestamps correctos)
[ ] Tags añadidos
[ ] Miniatura personalizada (ver diseño sugerido)
[ ] Visibilidad: Público (o No listado si es solo para OFIMA)
[ ] Playlist: "Pruebas Técnicas" o "Portfolio"
[ ] Capítulos: verificar que los timestamps coincidan con el video real
[ ] Link al repositorio en descripción verificado

PUBLICACIÓN EN LINKEDIN:
[ ] Actualizar [LINK AL VIDEO] con la URL real de YouTube
[ ] Publicar en horario de mayor alcance: Martes-Jueves 8-9am o 12-1pm
[ ] Etiquetar a OFIMA SAS si tienen página de LinkedIn
[ ] Agregar al perfil de LinkedIn en sección "Proyectos"

ACTUALIZAR README.md DEL REPO:
[ ] Agregar enlace al video en la sección de documentación
[ ] Formato: 🎬 [Video de Presentación](URL_YOUTUBE)
```

---

## 🎙️ INTRO Y OUTRO SUGERIDOS PARA EL VIDEO

### INTRO (primeros 15 segundos)

```
[PANTALLA: Logo DomoNow animado → Fondo oscuro]

Voz en off o texto en pantalla:

"Esta es la presentación técnica completa de DomoNow —
el sistema de gestión de parqueaderos de visitantes 
que desarrollé como prueba técnica para rol Senior.

No es un tutorial. Es un caso de estudio real sobre
arquitectura, criterio técnico y gobernanza de IA."
```

### OUTRO (últimos 30 segundos)

```
[PANTALLA: Grilla de cupos + terminal con pruebas pasando]

"El repositorio está completamente abierto.
El código, las especificaciones, la auditoría de seguridad
y los Engineering Decision Records están disponibles para revisión.

Link en la descripción.

Si esto les pareció valioso — compartan con alguien 
que esté preparando una prueba técnica o
evaluando cómo usar IA con criterio en su equipo."

[Pantalla final: GitHub URL + LinkedIn]
```
