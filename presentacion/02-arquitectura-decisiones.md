# 📺 TELEPROMPTER 02 — Arquitectura y Decisiones Técnicas
## ⏱️ Duración estimada: 6 minutos
## 🎯 Cubre: Arquitectura (20%) + Uso de IA (15%)

---

> [[ ABRIR: open-spec/03-architecture-backend.md EN PANTALLA O README.md ]]

---

## FILOSOFÍA DE ARQUITECTURA

Cuando empecé a trabajar en esta prueba, lo primero que hice fue escribir las especificaciones formales. No el código — las especificaciones.

Tengo en este repositorio ocho archivos en la carpeta `open-spec` que definen todo antes de que existiera una sola línea de código: el modelo de dominio, los contratos de la API en formato OpenAPI 3.1, las decisiones de concurrencia, los tokens de diseño y los escenarios de prueba.

**¿Por qué eso es importante?** Porque la IA genera código muy rápido. Demasiado rápido. Y si no tienes una especificación clara antes de pedirle que genere, lo que obtienes es código que hace algo — pero no necesariamente lo que necesitas.

[[ MOSTRAR: carpeta open-spec en el explorador de archivos ]]

---

## LAS CUATRO DECISIONES ARQUITECTÓNICAS CLAVE

Documenté en el `AI-USAGE.md` seis Engineering Decision Records — seis momentos donde yo, como arquitecto, evalué lo que propuso la IA, identifiqué el fallo y tomé una decisión diferente.

Voy a contarles las cuatro más relevantes.

---

### DECISIÓN 1 — CQRS y Vertical Slice Architecture  
*(EDR-004 en AI-USAGE.md)*

**La IA me propuso un `ParkingService` con quince métodos** — un servicio monolítico clásico que actuaría como intermediario entre el controlador y el repositorio.

Mi evaluación fue: eso es una *God Class*. Rompe el Single Responsibility Principle. Hace que cualquier prueba unitaria requiera mockearlo completo. Y cuando el negocio pide agregar una nueva funcionalidad, tienes que tocar el mismo archivo que ya tiene quince responsabilidades.

**Mi decisión:** CQRS con MediatR y Vertical Slice Architecture. Cada caso de uso vive completamente encapsulado: el comando, el validador, el handler y las pruebas. Si necesito modificar el checkout, abro exactamente un archivo. El radio de impacto de cualquier cambio es mínimo.

---

### DECISIÓN 2 — Concurrencia de Doble Capa  
*(EDR-001 en AI-USAGE.md)*

Esta es la decisión más importante del backend. **La IA me sugirió un `SemaphoreSlim`** — un semáforo en memoria para serializar el acceso al cupo.

Identifiqué el fallo inmediatamente: un semáforo en memoria solo existe en un proceso. En producción, con escalado horizontal — Kubernetes, múltiples réplicas en Podman — cada contenedor tiene su propio proceso. Dos peticiones en réplicas distintas pasan el semáforo sin problema y ambas confirman la asignación. **El double-booking ocurre de todas formas.**

**Mi decisión:** Defensa en profundidad con dos capas:
- **Capa 1:** Optimistic Concurrency con EF Core mapeando la columna `xmin` de PostgreSQL. Si dos transacciones intentan actualizar el mismo registro, la segunda falla con `DbUpdateConcurrencyException`.
- **Capa 2:** Un índice único parcial en PostgreSQL a nivel de base de datos:
  ```sql
  CREATE UNIQUE INDEX uq_parking_active_assignment 
  ON parking_assignments (parking_spot_id) 
  WHERE status = 1;
  ```
  Incluso si dos nodos de aplicación pasan la capa 1 por desfase de microsegundos, el motor de base de datos rechaza físicamente el segundo insert. Es una garantía matemática, no de software.

[[ MOSTRAR: open-spec/06-database-ddl.sql — el índice uq_parking_active_assignment ]]

---

### DECISIÓN 3 — Microfrontends en lugar de Monolito  
*(EDR-003 en AI-USAGE.md)*

La interfaz tiene dos módulos con requerimientos radicalmente diferentes:

- La **garita de portería**: alta confiabilidad, validaciones estrictas, respuesta inmediata, determinista.
- El **módulo de analítica**: gráficos densos, matrices de calor 24x7, modelos de Machine Learning en el cliente.

**La IA sugirió un monolito en React** con todas las páginas en el mismo bundle.

Mi evaluación: forzar un solo framework compromete las dos cosas. Y una recarga de página en la garita destruye el estado transaccional en curso — el modal de ingreso abierto, los datos ya llenados.

**Mi decisión:** Single-SPA con dos microfrontends independientes — **Angular 19** para portería y **Vue 3** para analítica — orquestados por un Root Shell que maneja el login, la navegación y la sesión sin recargar el navegador.

---

### DECISIÓN 4 — Modelo de Dominio Rico (DDD)  
*(EDR-002 en AI-USAGE.md)*

**La IA generó entidades anémicas** — clases con todos los setters públicos donde el controlador directamente hacía `spot.Status = Occupied`.

El problema: cualquier código en cualquier parte de la aplicación puede modificar el estado de un cupo sin pasar por las reglas de negocio. Un desarrollador nuevo escribe `assignment.ExitTime = DateTime.UtcNow` directamente y evita la validación temporal que garantiza que la hora de salida no puede ser anterior a la entrada.

**Mi decisión:** Dominio enriquecido con DDD. Las entidades tienen setters privados. El estado solo cambia a través de métodos de negocio expresivos: `AssignSpot()`, `CompleteCheckout()`, `DecommissionSpot()`. Si alguien intenta violar una invariante, el agregado lanza una excepción fuertemente tipada antes de que el problema llegue a la base de datos.

---

## SEPARACIÓN DE RESPONSABILIDADES — SOLID EN PRÁCTICA

[[ MOSTRAR: diagrama de capas en README.md sección 5 ]]

La regla de dependencia es estricta y unidireccional:

```
Api  →  Application  ←  Infrastructure
              ↓
           Domain
```

El **Domain** no sabe que existe EF Core. No sabe que existe PostgreSQL. No sabe que existe ASP.NET. Es C# puro. Eso significa que si mañana deciden cambiar de PostgreSQL a SQL Server, cambio solo Infrastructure. El dominio no se toca. Las pruebas del dominio no cambian.

**Eso es exactamente lo que significa "decisiones y trade-offs con criterio".**

---

## PREGUNTA ANTICIPADA

**P: "¿No es sobreingeniería para una prueba técnica?"**

R: La prueba pide explícitamente "capacidad de evitar sobreingeniería" — y yo estoy de acuerdo. Hay cosas que no implementé: Redis, Kafka, el modelo ONNX en runtime. Las documenté en el README como "así las resolvería". Pero lo que sí implementé — CQRS, DDD, concurrencia de doble capa — **no es sobreingeniería. Es ingeniería correcta para el problema real que se planteó**. El problema de concurrencia no tiene solución simple. Tiene solución correcta y solución incorrecta.

**P: "¿Qué haría diferente con más tiempo?"**

R: Implementaría JWT Bearer tokens para autenticación real — de hecho, generé la auditoría de seguridad completa documentando exactamente ese hallazgo. Y agregaría Redis Redlock como tercera capa de concurrencia para entornos multi-nodo. Todo está documentado en los archivos de especificación.
