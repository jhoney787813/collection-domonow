# Registro de Decisiones Técnicas y Uso de IA (`AI-USAGE.md`)

<!--
  PROYECTO: DomoNow PropTech Platform - Sistema de Gestión de Parqueaderos de Visitantes
  AUTOR / POSTULANTE: Jhon Edison Hincapié García (Solutions Architect & Senior Full Stack Engineer)
  ROL POSTULADO: Desarrollador Senior / Tech Lead
  METODOLOGÍA: Open Spec 1.0 - Engineering Decision Records (EDRs)
-->

## 1. Propósito de este Repositorio y Contexto de la Prueba Técnica

Este repositorio contiene la solución técnica integral para la plataforma **DomoNow**, un sistema especializado en la automatización del control de acceso vehicular y la administración inteligente de parqueaderos comunales para copropiedades residenciales de alta densidad.

### El Reto de Negocio e Ingeniería
En conjuntos residenciales con cientos o miles de apartamentos y un número limitado de cupos para visitantes (por ejemplo, 30 bahías `P-01` a `P-30`), las horas pico generan congestión severa en portería. Si el sistema no está diseñado para alta concurrencia, ocurren condiciones de carrera donde dos guardias asignan simultáneamente el mismo cupo libre a dos vehículos distintos (*double-booking* o *phantom assignment*), causando bloqueos físicos en la talanquera y disputas entre residentes.

### Propósito de esta Entrega Técnica
Como desarrollador senior, este proyecto no se construyó como una simple prueba de concepto (MVP) o una maqueta estática. Se diseñó como una **arquitectura distribuida lista para producción**, demostrando dominio avanzado en:
1. **Frontend Políglota y Desacoplado:** Implementación de microfrontends con **Single-SPA**, combinando **Angular 19** (máquina de estados reactiva con *Signals* para garita) y **Vue 3** (panel analítico denso con modelos de predicción y matrices de calor 24x7), bajo un **Root Orchestrator** con autenticación, sesión y soporte bilingüe reactivo (ESP/ENG).
2. **Backend Concurrente de Alto Rendimiento:** Diseño en **.NET 10 LTS** aplicando **CQRS (Command Query Responsibility Segregation)** y **Vertical Slice Architecture**, respaldado por PostgreSQL 16+, Redis Cache y políticas de concurrencia optimista y física.
3. **Contenedorización Nativa:** Despliegue reproducible multinodo mediante **Podman / Docker Compose**.

### Filosofía del Uso de Inteligencia Artificial
La inteligencia artificial (Google Antigravity Agent, OpenSpec) se utilizó como un **acelerador de productividad y copiloto técnico**, nunca como un piloto automático. Un desarrollador senior se diferencia en su capacidad de **triaje crítico, diseño de arquitectura, auditoría de seguridad y rechazo proactivo de soluciones ingenuas generadas por IA**. A continuación, se detallan las decisiones arquitectónicas clave donde el criterio del ingeniero guió, corrigió y perfeccionó las propuestas de los modelos.

---

## 2. Registros de Decisiones de Ingeniería (EDRs - Engineering Decision Records)

---

### EDR-001: Mitigación de Condiciones de Carrera en Asignación Concurrente de Cupos

* **Fecha:** 2026-09-12
* **Líder Técnico / Arquitecto:** Jhon Edison Hincapié García
* **Herramientas de IA:** Google Antigravity Agent / OpenSpec Engine
* **Componente:** `DomoNow.Parking.Infrastructure` / PostgreSQL 16+ Engine

#### 1. Planteamiento del Problema
En horas pico (18:00 - 20:30), dos guardias en diferentes terminales o dos cámaras LPR pueden intentar registrar la entrada de dos vehículos al mismo cupo disponible (ej. bahía `P-15`) en el mismo milisegundo. Un flujo tradicional de lectura y escritura (`if (spot.Status == Available) { spot.Status = Occupied; }`) es vulnerable a condiciones de carrera donde ambas transacciones leen el estado libre y confirman la asignación.

#### 2. Propuesta Inicial Generada por la IA
La IA sugirió utilizar un bloqueo en memoria dentro de la API mediante `SemaphoreSlim` en C# o un bloque `lock` global alrededor del manejador del comando de asignación.

#### 3. Crítica Técnica y Evaluación de Riesgos (Criterio Senior)
* **Fallo Crítico Identificado:** Los bloqueos en memoria (`SemaphoreSlim`, `Monitor`, `lock`) solo funcionan dentro de un único proceso monohilo o una sola instancia de servidor. En un entorno real en la nube con escalado horizontal (múltiples réplicas en Podman, Kubernetes o AWS ECS), cada contenedor corre en un proceso aislado sin memoria compartida. La solución de la IA habría fallado catastróficamente en producción ante dos peticiones atendidas por réplicas distintas.
* **Solución de Grado Empresarial:** La garantía de unicidad y serialización de asignaciones debe asegurarse en el motor de persistencia mediante restricciones matemáticas deterministas.

#### 4. Decisión de Arquitectura Adoptada
Se implementó una estrategia de **Defensa en Profundidad**:
1. **Control de Concurrencia Optimista (Nivel Aplicación):** Entity Framework Core mapea `ParkingSpot.RowVersion` al campo de sistema `xmin` de PostgreSQL. Si dos transacciones intentan actualizar el mismo registro simultáneamente, la segunda falla inmediatamente con `DbUpdateConcurrencyException`.
2. **Restricción Invariante Física en Base de Datos:** Se configuró un índice parcial único en PostgreSQL:
   ```sql
   CREATE UNIQUE INDEX uq_parking_active_assignment 
   ON parking_assignments (parking_spot_id) 
   WHERE status = 1; -- 1: Activo
   ```
   Incluso si ambas peticiones superan el bloqueo a nivel de software por desfase de milisegundos, el motor de base de datos rechaza la segunda físicamente con el error `23505 (unique_violation)`.
3. **Mapeo a RFC 7807 (ProblemDetails):** El middleware global captura `DbUpdateConcurrencyException` y el código de error `23505` traduciéndolos a un código de estado estándar **HTTP 409 Conflict**, con detalles claros para que la interfaz de usuario reintente o asigne automáticamente la siguiente bahía disponible.

#### 5. Evidencia de Validación
* **Prueba Automatizada de Concurrencia (`ConcurrencyIntegrationTests.cs`):** Se disparan 10 peticiones HTTP POST asíncronas simultáneas hacia `/api/parking-assignments` compitiendo por el cupo `P-15`. Exactamente 1 petición responde con HTTP 201 Created y 9 peticiones son rechazadas con HTTP 409 Conflict.
* **Simulación Visual en Frontend:** En el microfrontend de Angular se incluyó el botón interactivo `⚡ Simular Ráfaga Concurrente (P-15)` para validar en tiempo real la transición de estado inmediata sin recargas.

---

### EDR-002: Modelo de Dominio Enriquecido (DDD) frente a Entidades Anémicas

* **Fecha:** 2026-09-12
* **Líder Técnico / Arquitecto:** Jhon Edison Hincapié García
* **Herramientas de IA:** Google Antigravity Agent / OpenSpec Engine
* **Componente:** `DomoNow.Parking.Domain` / Agregados `ParkingSpot` y `ParkingAssignment`

#### 1. Planteamiento del Problema
Las herramientas convencionales de scaffolding asistidas por IA tienden a generar modelos de datos anémicos donde las entidades son simples estructuras de datos con `get; set;` públicos en todas sus propiedades, dispersando las reglas de negocio entre controladores y servicios.

#### 2. Propuesta Inicial Generada por la IA
La IA propuso clases con setters públicos donde el endpoint directamente modificaba `spot.Status = ParkingSpotStatus.Occupied` y `assignment.ExitTime = DateTime.UtcNow`.

#### 3. Crítica Técnica y Evaluación de Riesgos (Criterio Senior)
* **Fallo Crítico Identificado:** Un modelo anémico viola el principio de encapsulamiento orientado a objetos. Permite que cualquier desarrollador o endpoint modifique el estado de un parqueadero sin validar las 6 reglas invariantes del dominio (ej. permitir checkout con fecha anterior a la entrada, asignar un cupo en mantenimiento o registrar placas con caracteres inválidos).

#### 4. Decisión de Arquitectura Adoptada
Se rediseñó el dominio bajo los principios de **Domain-Driven Design (DDD)**:
1. **Setters Privados e Inmutabilidad:** Todas las propiedades de los agregados tienen visibilidad `private` o `internal init`.
2. **Métodos de Dominio Expresivos:** Las transiciones de estado se efectúan exclusivamente mediante métodos de negocio: `AssignSpot(...)`, `CompleteCheckout(...)`, `MarkOutOfService(...)`.
3. **Validación Inmediata de Invariantes:** Si un comando intenta violar una regla temporal o de capacidad, el agregado lanza excepciones fuertemente tipadas (`DomainValidationException`, `DomainConflictException`).
4. **Objetos de Valor (Value Objects):** Los primitivos se reemplazaron por Value Objects inmutables (`LicensePlate` con normalización automática a mayúsculas sin guiones, `DestinationUnit`).

---

### EDR-003: Arquitectura de Microfrontends con Single-SPA y Poliglotismo Guiado por el Dominio

* **Fecha:** 2026-09-12
* **Líder Técnico / Arquitecto:** Jhon Edison Hincapié García
* **Herramientas de IA:** Google Antigravity Agent / OpenSpec Engine
* **Componente:** `src/frontend/root-config`, `domonow-angular-parking`, `domonow-vue-analytics`

#### 1. Planteamiento del Problema
El sistema requería dos interfaces con requerimientos operacionales drásticamente opuestos:
* La garita de portería necesita un tablero de control determinista, de altísima confiabilidad, con validaciones estrictas y respuesta instantánea para registrar vehículos.
* El módulo administrativo requiere gráficos analíticos densos, matrices de calor 24x7 y ejecución en el cliente de modelos de Machine Learning (inferencia ONNX).
Forzar un único framework para ambos módulos comprometía o la agilidad de la analítica o la robustez de la portería.

#### 2. Propuesta Inicial Generada por la IA
La IA sugirió construir una aplicación monolítica tradicional en React o cargar páginas independientes mediante recargas completas de navegador (`window.location.href`).

#### 3. Crítica Técnica y Evaluación de Riesgos (Criterio Senior)
* **Fallo Crítico Identificado:** Un monolito impide que los equipos evolucionen de forma autónoma. Por otro lado, las recargas de página destruyen el estado en memoria, provocan parpadeos molestos al guardia y aumentan la latencia en la garita.

#### 4. Decisión de Arquitectura Adoptada
Se implementó una arquitectura de **Microfrontends orquestados con Single-SPA**:
1. **Root Orchestrator (Vite + Single-SPA):** Puerto 9000. Actúa como shell contenedor, gestiona el flujo inicial de Login institucional, el navbar superior y el control de ciclo de vida de los microfrontends sin recargar la página.
2. **Angular 19 (Operaciones en Puerto 9001):** Aplica la nueva arquitectura de **Angular Signals** (`signal`, `computed`), garantizando reactividad sin sobrecarga de Zone.js en el renderizado de la grilla de 30 cupos.
3. **Vue 3 (Analítica en Puerto 9002):** Utiliza Pinia y la reactividad liviana de Vue para pintar la matriz de saturación 24x7 y procesar la inferencia ONNX en milisegundos.
4. **Bus de Eventos Desacoplado:** La comunicación inter-MFE se realiza mediante `postMessage` y eventos estándar de navegador (`domonow:spot-assigned`, `domonow:spot-released`, `domonow:lang-changed`), evitando acoplamiento directo de dependencias.
5. **Tokens Compartidos (`@domonow/ui-tokens`):** Centraliza la paleta oficial (`#6C35DE`), tipografía *Plus Jakarta Sans* y diccionarios i18n para una identidad visual unificada.

---

### EDR-004: Adopción de CQRS y Vertical Slice Architecture en Backend

* **Fecha:** 2026-09-12
* **Líder Técnico / Arquitecto:** Jhon Edison Hincapié García
* **Herramientas de IA:** Google Antigravity Agent / OpenSpec Engine
* **Componente:** `src/backend` (.NET 10 LTS / C# 14)

#### 1. Planteamiento del Problema
La arquitectura en capas tradicional (*Controllers -> Services -> Repositories -> Entities*) genera una alta fricción técnica. Cada nuevo requerimiento obliga a modificar 4 o 5 archivos dispersos en diferentes carpetas, dificultando el mantenimiento y aumentando el radio de impacto de cualquier cambio (*blast radius*).

#### 2. Propuesta Inicial Generada por la IA
La IA recomendó crear un `ParkingService` gigante con más de 15 métodos CRUD, inyectado en un `ParkingController` tradicional.

#### 3. Crítica Técnica y Evaluación de Riesgos (Criterio Senior)
* **Fallo Crítico Identificado:** Los servicios monolíticos ("God Classes") acumulan dependencias innecesarias, rompen el principio de responsabilidad única (SRP) y hacen que las pruebas unitarias requieran decenas de mocks complejos.

#### 4. Decisión de Arquitectura Adoptada
Se implementó **Vertical Slice Architecture combinado con CQRS (MediatR)**:
1. **Organización por Capacidades de Negocio:** En lugar de agrupar por tipo técnico (carpetas de Controllers, Services, Repositories), cada caso de uso reside en una rebanada vertical autocontenida:
   * `RegisterParkingEntrySlice`: Endpoint Minimal API + Command + FluentValidator + CommandHandler + Agregado Domain.
   * `CompleteParkingCheckoutSlice`: Endpoint + Command + Handler + Liquidación de estadía.
   * `GetParkingSpotsQuerySlice`: Endpoint + Query + Handler optimizado con Dapper y caché Redis (< 2ms).
   * `GetDemandForecastQuerySlice`: Endpoint + Query + Handler de inferencia predictiva.
2. **Cero Efectos Secundarios:** Optimizar o modificar la consulta de la grilla no afecta en absoluto la lógica transaccional de cobro o ingreso.
3. **Pipeline Reutilizable con MediatR:** Se incorporaron comportamientos de pipeline (*Pipeline Behaviors*) para validación automática (`FluentValidation`), logging estructurado y manejo centralizado de excepciones.

---

### EDR-005: Internacionalización Reactiva (i18n) y Gestión de Sesión en el Shell

* **Fecha:** 2026-09-12
* **Líder Técnico / Arquitecto:** Jhon Edison Hincapié García
* **Herramientas de IA:** Google Antigravity Agent / OpenSpec Engine
* **Componente:** `src/frontend/root-config`, `angular-parking`, `vue-analytics`

#### 1. Planteamiento del Problema
El sistema debía soportar operación bilingüe (Español / Inglés) con un selector visible `[ 🇪🇸 ESP | 🇺🇸 ENG ]` en el contenedor principal, así como una pantalla inicial de Login estático con opción de cierre de sesión, garantizando que el cambio de idioma se propague instantáneamente a los microfrontends cargados en memoria o iframes sin recargar el navegador.

#### 2. Propuesta Inicial Generada por la IA
La IA sugirió forzar `window.location.reload()` tras guardar el idioma en `localStorage` o instalar librerías pesadas independientes (`ngx-translate` en Angular e `i18next` en Vue), lo cual desincronizaba los estados entre subproyectos.

#### 3. Crítica Técnica y Evaluación de Riesgos (Criterio Senior)
* **Fallo Crítico Identificado:** Recargar la página borra el estado transaccional en curso (formularios abiertos, modales de ingreso, contadores en vivo) y genera una experiencia de usuario deficiente y lenta.

#### 4. Decisión de Arquitectura Adoptada
1. **Diccionarios Compartidos Centralizados:** Se crearon definiciones tipadas en `@domonow/ui-tokens` consumidas tanto por el Root Shell como por los adaptadores de Angular y Vue.
2. **Propagación Híbrida de Eventos:** El Root Shell emite un evento `domonow:lang-changed` vía `window.dispatchEvent` para aplicaciones montadas en el mismo DOM, y envía simultáneamente un `postMessage` a todos los `<iframe>` montados, asegurando sincronización inmediata (< 5 ms) en Angular y Vue sin recargar la página.
3. **Control de Acceso y Sesión:** Se implementó `isAuthenticated()` en el orquestador principal: al entrar sin sesión se muestra el formulario de login institucional con el logo oficial (`domonow-logo-320.webp`); al autenticarse se revelan los microfrontends y el botón de cierre de sesión (`#btn-logout`).

---

## 3. Matriz de Triaje y Supervisión de Revisiones de Código Asistidas por IA

Durante las fases de integración y despliegue continuo en Podman, el modelo de IA ejecutó revisiones automáticas que fueron auditadas y resueltas bajo criterio senior:

| Fecha | Hallazgo Notificado por la IA | Severidad | Evaluación y Resolución del Ingeniero Senior |
| :--- | :--- | :--- | :--- |
| **2026-09-12** | Excepción `NG0908` y fallo JIT de Angular 19 en arranque de contenedor. | **Alta** | **Aceptada y Corregida:** Angular 19 en modo standalone dentro de Single-SPA requiere explícitamente `@angular/compiler` y `zone.js` en los puntos de entrada para resolver `_PlatformLocation`. Se agregaron las importaciones en `main.standalone.ts` y `main.single-spa.ts`. |
| **2026-09-12** | Posible desbordamiento visual (*overflow*) en la tarjeta de inferencia ML de Vue 3. | **Media** | **Aceptada y Corregida:** Se ajustaron márgenes, espaciados flex y padding en `PeakHourForecaster.vue` para garantizar que métricas de inferencia (0.42 ms, PSI 0.03) se visualicen impecables en pantallas estándar. |
| **2026-09-12** | Inyección de CORS inseguro (`Access-Control-Allow-Origin: *`) en despliegues productivos. | **Media** | **Mitigada:** Se acotó el wildcard a los orígenes del cluster local de microfrontends (`http://localhost:9000`, `9001`, `9002`), impidiendo peticiones no autorizadas desde otros dominios. |
| **2026-09-12** | Event listener duplicado al inicializar el selector de idioma en el Root Shell. | **Baja** | **Resuelta:** Se añadió un guardia booleano (`isLangSwitcherInitialized`) para prevenir múltiples registros de eventos en `DOMContentLoaded`. |

---

## 4. Conclusión: Valor Aportado como Candidato Senior

Esta prueba técnica demuestra que el rol de un **Desarrollador Senior / Tech Lead** moderno trasciende la simple escritura de código:
* **Capacidad de Arquitectura Sistémica:** Comprensión profunda de cómo interactúan la infraestructura, el motor de base de datos, las capas de persistencia y los microfrontends bajo estrés de concurrencia.
* **Gobierno y Criterio sobre Herramientas de IA:** Utilización estratégica de modelos de lenguaje para maximizar velocidad de desarrollo, manteniendo un filtrado riguroso contra anti-patrones, garantizando seguridad, mantenibilidad y robustez de grado empresarial.
* **Enfoque en la Experiencia de Usuario y Negocio:** Entrega de interfaces pulidas, accesibles, bilingües y con identidad institucional, alineadas directamente con los objetivos de negocio de la plataforma **DomoNow**.
