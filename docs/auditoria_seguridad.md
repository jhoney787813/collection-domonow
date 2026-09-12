# 🔐 Auditoría de Seguridad — Plataforma DomoNow PropTech
**Fecha de Auditoría:** 2026-09-12  
**Auditor:** Equipo de Arquitectura & Seguridad — DomoNow  
**Versión del Sistema:** v1.0.0-dev (Sprint Demo)  
**Clasificación:** CONFIDENCIAL — Solo para uso interno  

---

> **⚠️ ADVERTENCIA:** Este documento expone **vulnerabilidades críticas de seguridad** identificadas en todos los proyectos de la plataforma DomoNow (frontend y backend). Su contenido es intencionalmente detallado para justificar por qué la seguridad **NO ES NEGOCIABLE** en cualquier sistema de software de producción, independientemente de si fue incluida en los requerimientos funcionales iniciales.

---

## 🎯 Propósito y Contexto

La presente auditoría fue realizada sobre la versión de demostración de la plataforma **DomoNow — Sistema Integral de Gestión de Portería y Parqueaderos de Visitantes**, compuesta por:

| Proyecto | Tecnología | Puerto |
|---|---|---|
| `root-config` | Single-SPA + TypeScript | 9000 |
| `domonow-angular-parking` | Angular 19 | 9001 |
| `domonow-vue-analytics` | Vue 3 + Pinia | 9002 |
| `DomoNow.Parking.Api` | .NET 10 Web API | 5050 |
| `PostgreSQL` | Podman Container | 5432 |

### Declaración del Desarrollador

> *"El login lo hice a propósito sin seguridad para demostrar que, aunque el diseño puede estar completo cumpliendo con los requisitos solicitados iniciales, aunque la seguridad no estaba solicitada, **este no se puede dejar así como está**."*

Esta afirmación es **correcta y valiente**. Sin embargo, justifica la necesidad de este documento: evidenciar técnicamente **por qué** una aplicación funcionalmente completa sin seguridad es, en la práctica, **un sistema no apto para producción**.

---

## 🔴 Resumen Ejecutivo de Hallazgos

| ID | Severidad | Proyecto Afectado | Categoría | Título |
|---|---|---|---|---|
| SEC-001 | 🔴 CRÍTICA | `root-config` | AuthN | Credenciales hardcodeadas en código fuente |
| SEC-002 | 🔴 CRÍTICA | `root-config` | AuthN | Sesión basada exclusivamente en `localStorage` |
| SEC-003 | 🔴 CRÍTICA | `DomoNow.Parking.Api` | AuthZ | API completamente pública sin autenticación |
| SEC-004 | 🔴 CRÍTICA | `DomoNow.Parking.Api` | AuthZ | Sin control de autorización en ningún endpoint |
| SEC-005 | 🟠 ALTA | `root-config` | CORS/PostMessage | `postMessage` con wildcard `'*'` como targetOrigin |
| SEC-006 | 🟠 ALTA | `DomoNow.Parking.Api` | Secrets | Credenciales de base de datos en `appsettings.json` |
| SEC-007 | 🟠 ALTA | `domonow-angular-parking` | Config | URL de API hardcodeada en código TypeScript |
| SEC-008 | 🟠 ALTA | `domonow-vue-analytics` | Config | URL de API hardcodeada en código TypeScript |
| SEC-009 | 🟡 MEDIA | `DomoNow.Parking.Api` | Exposición | Swagger/OpenAPI habilitado en producción sin auth |
| SEC-010 | 🟡 MEDIA | `DomoNow.Parking.Api` | Config | `AllowedHosts: "*"` permite cualquier host header |
| SEC-011 | 🟡 MEDIA | `root-config` | AuthN | Sin protección contra ataques de fuerza bruta |
| SEC-012 | 🟡 MEDIA | `root-config` | Session | Sin expiración ni invalidación de sesión en servidor |
| SEC-013 | 🟡 MEDIA | `DomoNow.Parking.Api` | Logging | Sin registro de auditoría de acciones sensibles |
| SEC-014 | 🟢 BAJA | `root-config` | Info | Contraseña visible en mensaje de error de login |

---

## 📋 Detalle de Vulnerabilidades

---

### SEC-001 — 🔴 CRÍTICA: Credenciales Hardcodeadas en Código Fuente

**Archivo:** `src/frontend/root-config/src/domonow-root-config.ts` — Líneas 9–17  
**Categoría:** CWE-798 — Use of Hard-coded Credentials  
**OWASP Top 10:** A07:2021 — Identification and Authentication Failures  

```typescript
// ⛔ VULNERABILIDAD CRÍTICA — Credenciales en texto plano en código fuente
const STATIC_USER = {
  email: 'guardia@domonow.io',
  password: 'DomoNow2026!',   // ← CONTRASEÑA EN TEXTO PLANO EN EL CÓDIGO
  ...
};
```

**¿Por qué es una vulnerabilidad?**

1. **Exposición en control de versiones**: Cualquier persona con acceso al repositorio Git (colaboradores, ex-empleados, atacantes con acceso al repo) puede ver las credenciales directamente. Los secretos en Git son prácticamente imposibles de erradicar con certeza total dado el historial de commits.

2. **Las credenciales NO se pueden rotar sin redesplegar**: Si la contraseña `DomoNow2026!` es comprometida, no existe ningún mecanismo para cambiarla sin modificar el código, hacer commit y volver a desplegar. Esto viola el principio de **separación de configuración del código**.

3. **Bundle JavaScript distribuido al cliente**: En una aplicación web, el código TypeScript compilado se convierte en un archivo `.js` accesible desde el navegador. Cualquier usuario final puede abrir las **DevTools → Sources** y ver la contraseña en el bundle distribuido.

4. **Un solo punto de fallo — Sin individualidad de usuarios**: Una sola credencial para todos los guardias de portería. No hay trazabilidad, no hay posibilidad de revocar el acceso a un guardia específico sin cambiar la contraseña de todos.

**Impacto:** Acceso no autorizado total al sistema por cualquier persona que inspeccione el código o el bundle JavaScript del navegador.

**Remediación Requerida:** Implementar un Identity Provider (IdP) con flujo OAuth2/OIDC o un endpoint `/api/auth/login` que valide contra una base de datos de usuarios con contraseñas hasheadas (bcrypt/Argon2id) y retorne un JWT firmado con RS256 o ES256.

---

### SEC-002 — 🔴 CRÍTICA: Sesión Basada Exclusivamente en `localStorage` (Sin Token del Servidor)

**Archivo:** `src/frontend/root-config/src/domonow-root-config.ts` — Líneas 19–21, 192–216  
**Categoría:** CWE-602 — Client-Side Enforcement of Server-Side Security  
**OWASP Top 10:** A07:2021 — Identification and Authentication Failures  

```typescript
// ⛔ La "sesión" es simplemente un objeto JSON en localStorage
export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_STORAGE_KEY) !== null;
  // ↑ TRIVIALMENTE FALSIFICABLE desde la consola del navegador
}

// ⛔ Un atacante puede ejecutar esto en la consola del navegador:
// localStorage.setItem('domonow_auth_user', JSON.stringify({ email: 'x', name: 'x' }))
// → ACCESO TOTAL sin conocer ninguna contraseña
```

**¿Por qué es una vulnerabilidad?**

1. **`localStorage` es accesible por JavaScript**: Cualquier script XSS en la página puede leer, escribir o borrar el token de sesión. A diferencia de las cookies `HttpOnly`, `localStorage` no tiene ninguna protección contra XSS.

2. **Sesión completamente falsificable (client-side trust)**: Abrir la consola del navegador y ejecutar `localStorage.setItem('domonow_auth_user', '{"email":"x"}')` otorga acceso completo sin conocer ninguna contraseña. La "autenticación" existe solo en el cliente; el servidor **no sabe quién está haciendo las peticiones**.

3. **Sin token criptográfico verificable**: No existe un JWT firmado con clave privada que el servidor pueda validar. El servidor no tiene forma alguna de distinguir una petición legítima de una falsificada.

4. **Vulnerable a Session Fixation**: Sin invalidación del lado del servidor, una sesión robada permanece válida indefinidamente.

**Impacto:** Bypass completo del control de acceso mediante manipulación trivial de `localStorage` desde la consola del navegador. Cero seguridad real.

**Remediación Requerida:** El servidor debe emitir un JWT firmado (RS256 o ES256) almacenado en cookie `HttpOnly; Secure; SameSite=Strict`. La función `isAuthenticated()` del cliente solo debe ser una señal de UI; la autorización real debe ocurrir en el servidor validando el token en cada petición.

---

### SEC-003 — 🔴 CRÍTICA: API REST Completamente Pública Sin Autenticación

**Archivo:** `src/backend/DomoNow.Parking.Api/Program.cs`  
**Categoría:** CWE-306 — Missing Authentication for Critical Function  
**OWASP Top 10:** A07:2021 — Identification and Authentication Failures  

```csharp
// ⛔ Program.cs — Sin ninguna línea de autenticación/autorización
var app = builder.Build();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSwagger();
app.UseSwaggerUI(...);
app.UseCors("AllowFrontendOrigins");

// ❌ FALTA: app.UseAuthentication();
// ❌ FALTA: app.UseAuthorization();

app.MapControllers();  // Todos los endpoints, completamente públicos
```

**¿Por qué es una vulnerabilidad?**

El backend .NET 10 **no tiene ningún mecanismo de autenticación configurado**. Esto significa:

1. **Cualquier herramienta HTTP** (curl, Postman, Insomnia, un script Python) puede acceder a TODOS los endpoints sin presentar credencial alguna, independientemente de si el usuario inició sesión en el frontend.

2. **La "seguridad" del frontend es completamente decorativa**: Si el sistema dependiera de que el guardia inicie sesión en el frontend para tener acceso, un atacante puede ignorar el frontend completamente y llamar directamente a la API.

3. **Prueba de concepto inmediata — Explotación en segundos:**
   ```bash
   # Sin ninguna credencial, se puede leer TODA la data operacional:
   curl http://localhost:5050/api/parking-spots

   # Sin ninguna credencial, se puede registrar una entrada fraudulenta:
   curl -X POST http://localhost:5050/api/parking-assignments \
     -H "Content-Type: application/json" \
     -d '{"spotId": "...", "visitorName": "Atacante", "licensePlate": "AAA000"}'

   # Sin ninguna credencial, se puede hacer checkout de cualquier vehículo:
   curl -X POST http://localhost:5050/api/parking-assignments/{id}/checkout
   ```

**Impacto:** Acceso no autenticado y no autorizado a todos los datos y operaciones del sistema. Permite lectura, escritura y modificación de datos operacionales críticos desde cualquier cliente HTTP en la red.

**Remediación Requerida:** Registrar servicios de autenticación JWT en `Program.cs` (`builder.Services.AddAuthentication().AddJwtBearer(...)`), activar el middleware en el pipeline (`app.UseAuthentication()`, `app.UseAuthorization()`), y decorar los controladores con `[Authorize]`.

---

### SEC-004 — 🔴 CRÍTICA: Sin Control de Autorización en Ningún Endpoint

**Archivos:**  
- `src/backend/DomoNow.Parking.Api/Controllers/ParkingAssignmentsController.cs`  
- `src/backend/DomoNow.Parking.Api/Controllers/ParkingSpotsController.cs`  
**Categoría:** CWE-285 — Improper Authorization  
**OWASP Top 10:** A01:2021 — Broken Access Control  

```csharp
// ⛔ Ningún controller tiene atributo [Authorize] o lógica de autorización
[ApiController]
[Route("api/parking-assignments")]
public class ParkingAssignmentsController : ControllerBase  // ← Sin [Authorize]
{
    [HttpPost]                   // ← Cualquier persona puede registrar entradas
    [HttpPost("{id}/checkout")]  // ← Cualquier persona puede hacer checkout
    [HttpGet("active")]          // ← Cualquier persona puede ver data operacional
}
```

**¿Por qué es una vulnerabilidad?**

Incluso si se implementara autenticación (SEC-003), la ausencia de `[Authorize]` significa que:

1. **Principio de menor privilegio violado**: No existe diferenciación de roles. No hay forma de que un guardia solo pueda registrar entradas y no pueda acceder a endpoints de administración futuros.

2. **Sin trazabilidad de actor**: No es posible saber en los logs **quién** realizó cada operación porque el sistema no requiere identificación del usuario.

3. **Escalada de privilegios**: En un escenario multi-tenant o multi-torre, sin autorización por recurso, un usuario de una propiedad podría acceder a datos de otra.

**Impacto:** Sin control de quién puede hacer qué. Violación directa del principio de mínimo privilegio y de la trazabilidad de auditoría.

**Remediación Requerida:** Aplicar `[Authorize]` a nivel de controlador y donde aplique, `[Authorize(Roles = "Guard")]` o `[Authorize(Policy = "CanRegisterEntry")]` usando políticas de autorización basadas en claims del JWT.

---

### SEC-005 — 🟠 ALTA: `postMessage` con Wildcard `'*'` como targetOrigin

**Archivo:** `src/frontend/root-config/src/domonow-root-config.ts` — Líneas 155–162  
**Categoría:** CWE-346 — Origin Validation Error  
**OWASP Top 10:** A05:2021 — Security Misconfiguration  

```typescript
// ⛔ Se envía postMessage a CUALQUIER origen sin validación
frame.contentWindow?.postMessage({
  type: 'domonow:lang-changed',
  lang: currentLang
}, '*');  // ← targetOrigin '*' = CUALQUIER dominio puede recibir el mensaje
```

**¿Por qué es una vulnerabilidad?**

El uso de `'*'` como `targetOrigin` en `postMessage` es una mala práctica documentada en la especificación HTML. Si un iframe malicioso es cargado (por inyección, manipulación del DOM, o un redirect), recibirá los mensajes. En un contexto donde los mensajes contienen información de sesión o comandos operacionales, esto puede llevar a filtración de información y ejecución de acciones no autorizadas.

**Remediación Requerida:** Especificar el `targetOrigin` exacto en cada llamada: `frame.contentWindow?.postMessage(msg, 'http://localhost:9001')`. En producción, usar la URL real del MFE correspondiente.

---

### SEC-006 — 🟠 ALTA: Credenciales de Base de Datos en `appsettings.json`

**Archivo:** `src/backend/DomoNow.Parking.Api/appsettings.json`  
**Categoría:** CWE-312 — Cleartext Storage of Sensitive Information  
**OWASP Top 10:** A02:2021 — Cryptographic Failures  

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=domonow_parking;Username=domonow_user;Password=domonow_secret_pass;..."
  }
}
```

**¿Por qué es una vulnerabilidad?**

1. **Contraseña de base de datos en texto plano en Git**: Cualquier persona con acceso al repositorio puede leer las credenciales de la base de datos directamente. Una vez en Git, permanece en el historial incluso si se elimina el archivo.

2. **Riesgo en pipelines CI/CD**: Si el repositorio es comprometido, el atacante tiene acceso directo a la base de datos, no solo a la aplicación.

3. **Violación de las 12-Factor App Guidelines**: El Factor III establece explícitamente: *"Store config in the environment"*, nunca en código fuente versionado.

**Remediación Requerida:** Usar variables de entorno (`ASPNETCORE_ConnectionStrings__DefaultConnection`), [.NET User Secrets](https://docs.microsoft.com/en-us/aspnet/core/security/app-secrets) en desarrollo, y Azure Key Vault / AWS Secrets Manager / HashiCorp Vault en producción. Agregar `appsettings.*.json` con secrets a `.gitignore`.

---

### SEC-007 & SEC-008 — 🟠 ALTA: URL de API Hardcodeada en Código TypeScript

**Archivos:**  
- `src/frontend/domonow-angular-parking/src/app/services/parking.service.ts` — Línea 8  
- `src/frontend/domonow-vue-analytics/src/stores/analyticsStore.ts` — Línea 120  
**Categoría:** CWE-547 — Use of Hard-coded, Security-relevant Constants  

```typescript
// Angular MFE — ⛔ URL hardcodeada
private readonly API_BASE = 'http://localhost:5050/api';

// Vue MFE — ⛔ URL hardcodeada
const API_BASE = 'http://localhost:5050/api';
```

**¿Por qué es una vulnerabilidad?**

1. **Sin HTTPS — Comunicación en texto claro**: Las peticiones HTTP transmiten los datos en texto claro. En una red corporativa o con un proxy MITM (Man-in-the-Middle), todos los datos operacionales (matrículas, nombres de visitantes, horarios de acceso) son interceptables sin cifrado.

2. **Imposible desplegar en múltiples entornos**: No existe forma de apuntar a staging o producción sin modificar el código fuente y redesplegar.

3. **`localhost` falla en producción**: En producción, `localhost` apunta al servidor web, no al backend externo. La aplicación falla completamente en cualquier ambiente que no sea la máquina del desarrollador.

**Remediación Requerida:** Usar variables de entorno: Angular (`environment.ts` / `environment.prod.ts`) y Vue (`.env`, `.env.production` con `VITE_API_BASE_URL`). En producción, la URL **debe** usar HTTPS con certificado válido.

---

### SEC-009 — 🟡 MEDIA: Swagger/OpenAPI Habilitado en Producción Sin Autenticación

**Archivo:** `src/backend/DomoNow.Parking.Api/Program.cs` — Líneas 85–90  
**Categoría:** CWE-200 — Exposure of Sensitive Information to Unauthorized Actor  

```csharp
// ⛔ Swagger habilitado sin restricción de ambiente ni autenticación
app.UseSwagger();       // Accesible en: /swagger/v1/swagger.json
app.UseSwaggerUI(...);  // Accesible en: /swagger — sin auth
```

**¿Por qué es una vulnerabilidad?**

Swagger expone el **mapa completo de la API**: todos los endpoints, sus parámetros, tipos de respuesta y ejemplos de request/response. Esto es reconnaissance gratuito para un atacante que quiere entender la superficie de ataque del sistema.

**Remediación Requerida:** Restringir Swagger exclusivamente al entorno de Development:
```csharp
if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}
```

---

### SEC-010 — 🟡 MEDIA: `AllowedHosts: "*"` en appsettings

**Archivo:** `src/backend/DomoNow.Parking.Api/appsettings.json` — Línea 12  
**Categoría:** CWE-184 — Incomplete List of Disallowed Inputs  

```json
"AllowedHosts": "*"  // ⛔ Permite cualquier Host header
```

`AllowedHosts: "*"` desactiva la protección contra HTTP Host Header Injection, lo que habilita ataques de password reset poisoning y cache poisoning.

**Remediación Requerida:** Especificar los hosts permitidos: `"AllowedHosts": "domonow.io;api.domonow.io"`.

---

### SEC-011 — 🟡 MEDIA: Sin Protección Contra Ataques de Fuerza Bruta en Login

**Archivo:** `src/frontend/root-config/src/domonow-root-config.ts` — Función `handleLogin`  

```typescript
// ⛔ handleLogin no tiene rate limiting, lockout ni CAPTCHA
function handleLogin(email: string, pass: string): boolean {
  // Verificación inmediata del lado del cliente, sin límite de intentos
  if (email === STATIC_USER.email && pass === STATIC_USER.password) { ... }
}
```

Un atacante puede intentar contraseñas de forma automatizada (ataques de diccionario, credential stuffing) sin ninguna limitación. Al ser la validación del lado del cliente, ni siquiera hay latencia de red que ralentice el ataque.

**Remediación Requerida:** Implementar rate limiting en el backend (e.g., 5 intentos por IP en 15 minutos), lockout de cuenta temporal, y considerar CAPTCHA para intentos repetidos.

---

### SEC-012 — 🟡 MEDIA: Sin Expiración ni Invalidación de Sesión en el Servidor

**Categoría:** CWE-613 — Insufficient Session Expiration  

La sesión almacenada en `localStorage` contiene un campo `loginTime` pero **ningún componente del sistema lo valida ni expira la sesión**. Una sesión iniciada hace 6 meses sigue siendo válida indefinidamente.

**Remediación Requerida:** Los JWTs deben tener `exp` (expiration) corta (15–60 min) con un Refresh Token de vida más larga. El servidor debe validar la expiración en cada request y rechazar tokens expirados con HTTP 401.

---

### SEC-013 — 🟡 MEDIA: Sin Registro de Auditoría de Acciones Sensibles

**Categoría:** CWE-778 — Insufficient Logging  
**OWASP Top 10:** A09:2021 — Security Logging and Monitoring Failures  

Actualmente no existe ningún log de auditoría que registre: quién inició sesión, quién registró una entrada de vehículo, quién hizo un checkout, o intentos de acceso fallidos.

**¿Por qué es una vulnerabilidad?**

Sin logs de auditoría es imposible:
- Detectar un acceso no autorizado después del hecho.
- Cumplir con regulaciones de protección de datos (Ley 1581 en Colombia, GDPR en Europa).
- Realizar investigaciones forenses ante incidentes de seguridad.

**Remediación Requerida:** Implementar `ILogger` estructurado con eventos de auditoría en todos los endpoints sensibles, incluyendo el `userId` extraído del JWT en cada log entry.

---

### SEC-014 — 🟢 BAJA: Contraseña Expuesta en Mensaje de Error de Login

**Archivo:** `src/frontend/root-config/src/domonow-root-config.ts` — Línea 59  

```typescript
loginError: 'Credenciales incorrectas. Usa guardia@domonow.io y DomoNow2026!',
//                                                              ↑ LA CONTRASEÑA ESTÁ AQUÍ
```

El mensaje de error del login muestra la contraseña correcta al usuario. Esto confirma públicamente la contraseña del sistema ante cualquier observador y facilita ataques de ingeniería social.

**Remediación Requerida:** El mensaje de error nunca debe contener credenciales. Debe ser genérico: *"Usuario o contraseña incorrectos."*

---

## 🏛️ Marco de Referencia: Metodología ZERO TRUST

> *"Debemos implementar la metodología ZERO TRUST la cual nos dicta no delegar todo a la IA."*

### ¿Qué es Zero Trust?

**Zero Trust** es un modelo de seguridad basado en el principio: **"Never Trust, Always Verify"** (Nunca confíes, siempre verifica). En contraste con el modelo perimetral clásico, Zero Trust requiere que **cada petición, de cada usuario, en cada sistema, sea autenticada, autorizada y cifrada**, sin importar su origen.

### Principios Zero Trust Violados por el Sistema Actual

| Principio Zero Trust | Estado Actual | Hallazgo |
|---|---|---|
| **Verificar explícitamente** | ❌ No implementado | El backend no verifica identidad en ninguna petición (SEC-003) |
| **Usar el menor privilegio posible** | ❌ No implementado | No existen roles ni permisos diferenciados (SEC-004) |
| **Asumir compromiso** | ❌ No implementado | Sin logs de auditoría, es imposible detectar incidentes (SEC-013) |
| **Cifrar todo el tráfico** | ❌ No implementado | HTTP plano sin TLS en comunicación frontend-backend (SEC-007/008) |
| **Validación continua** | ❌ No implementado | La sesión nunca expira ni se revalida (SEC-012) |
| **Identidades verificables** | ❌ No implementado | Credenciales estáticas en código, sin identidades individuales (SEC-001) |

### "No Delegar Todo a la IA" — Responsabilidad Humana en Seguridad

La IA puede:
- ✅ Generar código funcional y bien estructurado
- ✅ Implementar patrones de diseño correctos
- ✅ Crear interfaces visualmente impresionantes
- ✅ Sugerir librerías y configuraciones de seguridad
- ✅ Generar documentación y análisis como este

La IA **NO** puede:
- ❌ Tomar decisiones de seguridad por el equipo sin revisión humana
- ❌ Garantizar que el código generado no tiene vulnerabilidades (puede alucinar patrones incorrectos)
- ❌ Reemplazar una revisión de seguridad humana (penetration testing, threat modeling)
- ❌ Gestionar secretos, certificados o claves de forma segura
- ❌ Decidir el nivel de tolerancia al riesgo del negocio
- ❌ Validar que las mitigaciones implementadas son suficientes en el contexto real

**La seguridad requiere responsabilidad humana. La IA es una herramienta de aceleración, no el guardián de la seguridad.**

---

## 🛣️ Hoja de Ruta de Remediación

### Fase 1 — CRÍTICA (Bloqueante para Producción)

| # | Acción | Responsable | Complejidad |
|---|---|---|---|
| 1.1 | Crear endpoint `POST /api/auth/login` con bcrypt | Backend Dev | Alta |
| 1.2 | Emitir JWT firmado (RS256) con `exp: 15min` | Backend Dev | Media |
| 1.3 | Registrar `AddAuthentication().AddJwtBearer()` en `Program.cs` | Backend Dev | Baja |
| 1.4 | Agregar `app.UseAuthentication()` y `app.UseAuthorization()` | Backend Dev | Baja |
| 1.5 | Decorar controladores con `[Authorize]` | Backend Dev | Baja |
| 1.6 | Migrar frontend para incluir JWT en `Authorization: Bearer` header | Frontend Dev | Media |
| 1.7 | Eliminar `STATIC_USER` y credenciales hardcodeadas del código | Frontend Dev | Baja |

### Fase 2 — ALTA (Completar en Sprint Siguiente)

| # | Acción | Responsable | Complejidad |
|---|---|---|---|
| 2.1 | Migrar Connection String a variables de entorno | DevOps | Baja |
| 2.2 | Implementar `environment.ts` / `.env` para URLs de API | Frontend Dev | Baja |
| 2.3 | Habilitar HTTPS en todos los ambientes | DevOps | Media |
| 2.4 | Especificar `targetOrigin` exacto en `postMessage` | Frontend Dev | Baja |
| 2.5 | Restringir Swagger solo a Development | Backend Dev | Baja |
| 2.6 | Configurar `AllowedHosts` con dominios reales | DevOps | Baja |

### Fase 3 — MEDIA (Mejora Continua)

| # | Acción | Responsable | Complejidad |
|---|---|---|---|
| 3.1 | Implementar rate limiting en el endpoint de login | Backend Dev | Media |
| 3.2 | Implementar Refresh Token con `HttpOnly` cookie | Backend Dev | Alta |
| 3.3 | Implementar audit logging estructurado por endpoint | Backend Dev | Media |
| 3.4 | Roles y políticas de autorización (`[Authorize(Roles)]`) | Backend Dev | Media |

---

### Arquitectura de Seguridad Objetivo (Zero Trust)

```
ESTADO ACTUAL (Inseguro):
  Usuario → Frontend (login fake) → localStorage → API (sin auth)

ARQUITECTURA OBJETIVO (Zero Trust):
  Usuario → POST /api/auth/login (bcrypt) → JWT Token (RS256, exp:15m)
  Frontend → GET /api/parking-spots + Authorization: Bearer <JWT>
  Backend → Valida JWT (firma + exp + claims)
  Backend → Verifica [Authorize(Role="Guard")]
  Backend → Registra audit log con userId
  Backend → Responde 200 OK | 401 Unauthorized | 403 Forbidden
```

---

## ✅ Conclusión: La Seguridad No Es Negociable

Esta auditoría no fue solicitada en los requerimientos iniciales del sistema. Sin embargo, su ausencia convierte a la plataforma DomoNow en:

1. **Un sistema incapaz de proteger datos personales** de visitantes (matrículas, nombres, horarios de acceso), violando regulaciones como la **Ley 1581 de 2012** (Colombia) y potencialmente el **GDPR** en contextos internacionales.

2. **Un sistema completamente expuesto**: La API pública sin autenticación significa que cualquier persona en la misma red puede leer, modificar o eliminar datos operacionales críticos del condominio con una sola línea de `curl`.

3. **Un sistema no auditable**: Sin logs de auditoría, es imposible determinar responsabilidades ante un incidente de seguridad, cumplir con normativas o detectar intrusiones.

### El Diseño Funcional Sin Seguridad Es un Prototipo, No un Producto

> Un sistema que funciona pero no es seguro es un **prototipo de demostración**. Para convertirse en un producto de producción, **la seguridad no es una feature adicional — es un requisito transversal que debe integrarse desde el diseño hasta el despliegue.**
>
> El hecho de que la seguridad no haya sido solicitada en los requerimientos iniciales **no exime al equipo de desarrollo de su responsabilidad** de implementarla. La negligencia en seguridad no es técnica — es ética y legal.

**Esta auditoría debe ser revisada, firmada y sus hallazgos críticos (SEC-001 a SEC-004) remediados antes de cualquier despliegue en un ambiente que no sea desarrollo local.**

---

*Documento generado como parte del proceso de revisión de calidad de la plataforma DomoNow PropTech v1.0.*  
*Para preguntas o aclaraciones: arquitectura@domonow.io*  
*Clasificación: CONFIDENCIAL — Solo para uso del equipo de arquitectura y dirección técnica.*
