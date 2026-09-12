# 📺 TELEPROMPTER 07 — Cierre, Trade-offs y Preguntas
## ⏱️ Duración estimada: 3 minutos
## 🎯 Cubre: Comunicación Técnica (5%) — Cierre memorable

---

> [[ MANTENER CONTACTO VISUAL. ]]
> [[ ESTE ES EL RESUMEN QUE DEBE QUEDAR EN LA MEMORIA DEL EVALUADOR. ]]

---

## TRADE-OFFS HONESTOS

Quiero ser transparente sobre lo que no implementé y por qué.

**Lo que decidí NO incluir:**
- Redis Redlock como tercera capa de concurrencia distribuida — documentado en el README como la siguiente iteración para multi-nodo
- Autenticación JWT real con bcrypt — documentado en la auditoría de seguridad con la arquitectura objetivo
- Pruebas E2E con Cypress o Playwright — el tiempo fue limitado y prioricé las pruebas de las invariantes de negocio
- Migración de EF Core automática — reemplazado deliberadamente por DDL idempotente montado en el contenedor
- HTTPS / TLS — documentado como hallazgo SEC-007 en la auditoría

**¿Cómo resolvería la autenticación?**

Endpoint `POST /api/auth/login` que valida contra una tabla `users` con contraseñas en bcrypt/Argon2id. Si las credenciales son válidas, emite un JWT firmado con RS256, `exp: 15 minutos`, y un Refresh Token en cookie `HttpOnly; Secure; SameSite=Strict`. El backend agrega `builder.Services.AddAuthentication().AddJwtBearer()`, `app.UseAuthentication()`, `app.UseAuthorization()` y todos los controladores tienen `[Authorize]`. Eso es Zero Trust mínimo viable.

---

## LO QUE SÍ ENTREGUÉ — RESUMEN EJECUTIVO

Para cerrar, les resumo en seis puntos lo que este proyecto demuestra:

**1. COMPRENSIÓN DEL PROBLEMA**  
No construí un CRUD de parqueaderos. Construí un sistema con control de concurrencia para el mundo físico — donde un error no genera un mensaje de error, genera un conflicto en la talanquera.

**2. ARQUITECTURA CON CRITERIO**  
Clean Architecture + CQRS + DDD + Microfrontends Single-SPA. Cada decisión está justificada por el problema, no elegida por currículum vitae.

**3. CALIDAD DE CÓDIGO**  
Dieciséis pruebas automatizadas que cubren el 100% de los caminos críticos. Dominio rico con invariantes encapsuladas. RFC 7807 en todos los errores. FluentValidation en todos los inputs.

**4. GOBIERNO DE IA**  
Seis decisiones arquitectónicas donde rechacé explícitamente la propuesta de la IA y tomé una decisión diferente y mejor. Documentadas con evidencia técnica.

**5. HONESTIDAD TÉCNICA**  
Una auditoría de seguridad completa sobre mis propias vulnerabilidades. Porque un Tech Lead no entrega código sabiendo que tiene problemas críticos sin documentarlos y proponer la solución.

**6. COMUNICACIÓN**  
Ocho archivos OpenSpec antes de código. Un AI-USAGE.md con Engineering Decision Records. Un README completo que permite a cualquier desarrollador levantar el sistema desde cero. Y esta presentación.

---

## MENSAJE DE CIERRE

[[ PAUSA. MIRAR AL EVALUADOR DIRECTAMENTE. ]]

La prueba preguntaba si alcancé a implementar todo. No. Pero eligió deliberadamente la solución incompleta pero técnicamente sólida y bien razonada, sobre una gran cantidad de funcionalidades generadas automáticamente sin criterio técnico.

Eso es exactamente lo que dice el enunciado que buscan.

Lo que este repositorio demuestra no es que sé usar Angular o que sé escribir C#. Lo que demuestra es **cómo pienso**, **cómo decido** y **cómo gobierno las herramientas** — incluyendo la IA — para construir software que resuelve problemas reales con criterio de ingeniería real.

Quedo abierto a sus preguntas.

---

## 📋 HOJA DE REFERENCIA RÁPIDA — DATOS CLAVE

*Para responder preguntas sin dudar:*

| Dato | Valor |
|---|---|
| Backend | .NET 10 LTS, C# 14, ASP.NET Core |
| ORM | EF Core 10 + Npgsql |
| Base de datos | PostgreSQL 17 Alpine en Podman |
| Patrón backend | Clean Architecture + CQRS + MediatR |
| Patrón dominio | DDD con Rich Domain Model |
| Concurrencia | xmin optimista + índice parcial único |
| Framework frontend 1 | Angular 19 Standalone + Signals + OnPush |
| Framework frontend 2 | Vue 3 Composition API + Pinia + Vite |
| Orquestador | Single-SPA Root Config (Vanilla TS) |
| Puerto Root | 9000 |
| Puerto Angular | 9001 |
| Puerto Vue | 9002 |
| Puerto API | 5050 (5050:5000 interno) |
| Puerto PostgreSQL | 5432 |
| Pruebas | 16 (xUnit + FluentAssertions) |
| Resultado concurrencia | 1 HTTP 201 + 9 HTTP 409 (100% correcto) |
| Vulnerabilidades documentadas | 14 (4 críticas, 4 altas, 5 medias, 1 baja) |
| EDRs documentados | 6 en AI-USAGE.md |
| Archivos OpenSpec | 8 en open-spec/ |
| Idiomas soportados | Español + Inglés (reactivo, sin recarga) |
| Contenedor DB | domonow-postgres-db |
| Contenedor API | backend-api |
| Cupos parqueadero | P-01 a P-30 (30 cupos) |
| Placa válida | `^[A-Z0-9]{5,8}$` (normalizada automáticamente) |
| Error code concurrencia | HTTP 409 Conflict (RFC 7807 ProblemDetails) |
| Error code validación | HTTP 422 Unprocessable Entity |
| Índice DB clave | `uq_parking_active_assignment` WHERE status=1 |

---

## 🚨 DEMO EN VIVO — SECUENCIA RECOMENDADA

Si hay tiempo para demo, seguir este orden:

1. `http://localhost:9000` — mostrar pantalla de login (mencionar que es deliberadamente inseguro)
2. Login con `guardia@domonow.io` / `DomoNow2026!` (o clic en "Autocompletar")
3. Mostrar grilla de 30 cupos — colores de estado
4. Clic en cupo disponible → Modal de registro → Llenar placa con guión "abc-123" → ver normalización automática
5. Registrar ingreso → ver cupo cambiar a Ocupado
6. Cambiar idioma ESP/ENG → ver cambio instantáneo sin recarga
7. Ir a `/analytics` → mostrar dashboard Vue con asignaciones activas
8. Volver a `/parking` → botón "⚡ Simular Ráfaga Concurrente" → mostrar el 1 de 10 en la UI
9. `http://localhost:5050/swagger` → mostrar documentación OpenAPI 3.1
10. Terminal: `dotnet test` → mostrar las 16 pruebas pasando
