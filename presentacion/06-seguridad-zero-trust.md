# 📺 TELEPROMPTER 06 — Uso de IA y Criterio Técnico
## ⏱️ Duración estimada: 4 minutos
## 🎯 Cubre: Uso de IA (15%) — La sección que más diferencia candidatos

---

> [[ ABRIR: AI-USAGE.md en el editor. ]]
> [[ ESTE ES EL DIFERENCIADOR CLAVE. HABLAR CON CONVICCIÓN. ]]

---

## CÓMO USÉ LA IA — Y CÓMO NO LA USÉ

La pregunta que están evaluando aquí no es cuánto código generó la IA. Es: **"¿Cuándo confió el candidato en la IA y cuándo no?"**

Voy a ser completamente transparente: usé Google Antigravity Agent y OpenSpec para generar código de forma intensiva. La velocidad de desarrollo que eso permite es genuinamente extraordinaria.

Pero usé la IA como **copiloto técnico** — no como piloto automático. Y hay una diferencia enorme entre los dos.

---

## LOS SEIS MOMENTOS DONDE RECHACÉ LO QUE PROPUSO LA IA

Están documentados en el `AI-USAGE.md` como Engineering Decision Records. Les voy a contar los tres más críticos.

---

### RECHAZO 1 — El SemaphoreSlim para Concurrencia  
*(EDR-001)*

La IA me propuso proteger la asignación de cupos con un `SemaphoreSlim` en C#.

**Identifiqué el fallo:** Un semáforo vive en memoria del proceso. En producción con múltiples réplicas, cada contenedor tiene su propio semáforo. Dos peticiones atendidas por réplicas distintas pasan los dos semáforos sin colisión y ambas confirman la asignación doble.

**Lo reemplacé con:** Concurrencia optimista con `xmin` de PostgreSQL + índice parcial único a nivel de base de datos. Una solución que funciona en cero réplicas o en mil réplicas indistintamente.

**¿Por qué importa este rechazo?** Porque la solución de la IA habría pasado todas las pruebas en desarrollo local — donde solo hay una réplica. El fallo solo se manifestaría en producción, bajo carga real. **Un desarrollador senior identifica esos fallos antes de que lleguen a producción.**

---

### RECHAZO 2 — El Modelo de Datos Anémico  
*(EDR-002)*

La IA generó entidades con todos los setters públicos. `spot.Status = ParkingSpotStatus.Occupied` directamente desde el controlador.

**Identifiqué el fallo:** Cualquier parte del código puede modificar el estado del sistema sin pasar por las reglas de negocio. Es la violación más básica de la encapsulación orientada a objetos.

**Lo reemplacé con:** Aggregate Roots DDD con setters privados y métodos de negocio que encapsulan las reglas invariantes.

---

### RECHAZO 3 — window.location.reload() para Cambio de Idioma  
*(EDR-005)*

La IA sugirió guardar el idioma en `localStorage` y recargar la página.

**Identifiqué el fallo:** Una recarga destruye el estado transaccional en curso. Si el guardia tiene un modal de ingreso abierto con datos parcialmente llenados y cambia el idioma, pierde todo.

**Lo reemplacé con:** Propagación de eventos híbrida — `CustomEvent` para apps en el mismo DOM, `postMessage` para iframes — sincronización en menos de 5 milisegundos sin ninguna recarga.

---

## LA AUDITORÍA DE SEGURIDAD — EL RECHAZO MÁS IMPORTANTE

[[ ABRIR: docs/auditoria_seguridad.md ]]

Quiero hablarles de algo que no estaba pedido en los requerimientos: **el login del sistema está deliberadamente sin seguridad real.**

El login usa credenciales hardcodeadas en TypeScript: `'guardia@domonow.io'` y `'DomoNow2026!'`. La "sesión" es un objeto JSON en `localStorage`. El backend no tiene ningún `[Authorize]`. La API es completamente pública.

Lo hice así a propósito. Y aquí está el por qué:

**Porque el diseño funcional está completo y cumple todos los requerimientos solicitados. Pero un sistema funcionalmente correcto sin seguridad es un prototipo — no un producto.**

Generé una auditoría de seguridad completa con catorce hallazgos documentados — cuatro críticos, cuatro altos, cinco medios, uno bajo. Con código de evidencia exacto, pruebas de concepto mostrando cómo explotar cada vulnerabilidad, y una hoja de ruta de remediación en tres fases.

**¿Por qué hice esto si no estaba pedido?**

Porque un Tech Lead no puede entregar un sistema sabiendo que tiene vulnerabilidades críticas sin documentarlas y sin justificar por qué no se corrigieron. La seguridad no es una feature — es un requisito transversal. Y cuando no está en los requerimientos iniciales, es responsabilidad del equipo técnico señalarlo, no ignorarlo.

---

## LA METODOLOGÍA ZERO TRUST

El documento cita la metodología **Zero Trust** — "Never Trust, Always Verify". Los seis principios de Zero Trust están todos violados en la versión actual:

| Principio | Estado |
|---|---|
| Verificar explícitamente cada petición | ❌ |
| Menor privilegio posible | ❌ |
| Asumir compromiso, detectar y responder | ❌ |
| Cifrar todo el tráfico | ❌ |
| Validación continua de sesiones | ❌ |
| Identidades verificables e individuales | ❌ |

El documento no solo describe el problema — propone la arquitectura objetivo con JWT Bearer tokens, bcrypt, `[Authorize(Roles)]` en los controladores y audit logging estructurado.

---

## LA PREGUNTA QUE MÁS DIFERENCIA CANDIDATOS

La evaluación de IA dice: *"Cómo decides cuándo confiar y cuándo no confiar en lo que propone una herramienta de IA."*

Mi respuesta es simple: **confío en la IA para generar el código que yo ya sé cómo debería ser. No confío en la IA para decidir la arquitectura que no comprendo.**

Un desarrollador senior usa la IA para multiplicar su velocidad. No para reemplazar su criterio. La IA genera código correcto sintácticamente que puede ser profundamente incorrecto arquitectónicamente — y la única forma de distinguirlos es tener el criterio técnico para evaluarlo.

**Esa es exactamente la diferencia entre un desarrollador junior que usa IA y un senior que la gobierna.**

---

## PREGUNTA ANTICIPADA

**P: "¿Cuánto del código fue generado por IA?"**

R: Aproximadamente el 70% del código fue generado con asistencia de IA. Pero el 100% fue revisado, evaluado, modificado o rechazado por criterio humano. Y las decisiones arquitectónicas — CQRS, DDD, concurrencia de doble capa, microfrontends — fueron especificadas en los OpenSpec antes de que la IA generara una sola línea. La IA implementa lo que el arquitecto diseña. No al revés.

**P: "¿Identificó algún error generado por la IA que hubiera causado problemas?"**

R: Sí, los cuatro que están documentados en la "Matriz de Triaje" del AI-USAGE.md. El más técnicamente significativo fue la excepción `NG0908` en Angular 19 dentro de Single-SPA — un error JIT que solo aparece en la combinación específica de Angular Standalone + Single-SPA, y que la IA no anticipó porque es un caso de uso no común. Lo identifiqué, diagnostiqué y corregí agregando las importaciones correctas del compilador.
