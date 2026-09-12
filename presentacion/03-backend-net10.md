# 📺 TELEPROMPTER 03 — Backend .NET 10, Diseño y Código
## ⏱️ Duración estimada: 7 minutos
## 🎯 Cubre: Backend & C# (25%)

---

> [[ ABRIR: src/backend/ en el explorador. Tener Swagger en http://localhost:5050/swagger listo en otra pestaña. ]]

---

## PRESENTACIÓN DEL BACKEND

El backend está construido en **.NET 10 LTS con C# 14** y organizado en cinco proyectos dentro de una solución única.

[[ MOSTRAR: estructura de carpetas en src/backend/ ]]

```
DomoNow.Parking.Domain/        ← C# puro, cero dependencias externas
DomoNow.Parking.Application/   ← CQRS, MediatR, FluentValidation
DomoNow.Parking.Infrastructure/ ← EF Core 10, Npgsql, PostgreSQL
DomoNow.Parking.Api/           ← ASP.NET Core, Controllers, Swagger
DomoNow.Parking.UnitTests/     ← xUnit, FluentAssertions, 16 pruebas
```

Cada proyecto tiene una responsabilidad exacta. Empecemos desde adentro hacia afuera.

---

## CAPA 1 — EL DOMINIO

[[ MOSTRAR: DomoNow.Parking.Domain/ ]]

El dominio es el corazón del sistema. Tiene **cero dependencias NuGet** — no referencia ni EF Core, ni ASP.NET, ni ningún framework externo. Es C# puro.

Tiene dos Aggregate Roots:

**`ParkingSpot`** — representa el cupo físico. Expone métodos de negocio y tiene setters privados:
- `AssignSpot(visitorName, licensePlate, unit)` → devuelve un `ParkingAssignment`, solo si el cupo está disponible
- `ReleaseSpot()` → vuelve el cupo a estado Disponible
- `DecommissionSpot(reason)` → lo pasa a Fuera de Servicio

Si alguien intenta llamar `AssignSpot()` sobre un cupo ya ocupado, el agregado lanza `DomainConflictException` antes de tocar la base de datos. **La validación de negocio no vive en el controlador — vive en el dominio.**

**`ParkingAssignment`** — representa el registro de visita. Tiene:
- `CompleteCheckout(exitTimeUtc)` → valida que la hora de salida no sea anterior a la de entrada. Si viola esa regla temporal, lanza `DomainValidationException`.

Y tengo tres **Value Objects** — no primitivos sino tipos con semántica de dominio:
- `LicensePlate` — normaliza automáticamente "abc-123", " ABC 123 " y "abc.123" todos a "ABC123"
- `VisitorName` — entre 2 y 100 caracteres, no vacío
- `DestinationUnit` — identificador de apartamento

**¿Por qué Value Objects?** Porque si recibo una placa como parámetro de tipo `string`, cualquier string pasa. Si la recibo como `LicensePlate`, la validación es parte del tipo — no del controlador.

---

## CAPA 2 — LA APLICACIÓN (CQRS)

[[ MOSTRAR: DomoNow.Parking.Application/ ]]

Implementé CQRS completo con MediatR. Tengo cuatro operaciones:

**Comandos** — modifican estado:
- `RegisterParkingEntryCommand` → asigna cupo, devuelve HTTP 201 Created
- `RegisterParkingCheckoutCommand` → cierra asignación, devuelve HTTP 200 OK

**Queries** — solo leen:
- `GetParkingSpotsQuery` → retorna los 30 cupos con filtro opcional por estado
- `GetActiveAssignmentsQuery` → retorna vehículos actualmente en el parqueadero con minutos transcurridos

Y tengo tres **Pipeline Behaviors** de MediatR:
1. `ValidationBehavior` — ejecuta FluentValidation antes de que llegue al handler. Si la placa tiene formato inválido, responde HTTP 400 antes de crear ningún objeto de dominio.
2. `LoggingBehavior` — mide tiempo de ejecución y emite logs estructurados con trace IDs.
3. `TransactionBehavior` — envuelve los comandos en una transacción explícita con el nivel de aislamiento apropiado.

**¿Por qué Pipeline Behaviors?** Porque eso es aplicar el principio Open/Closed. El handler de negocio no sabe que existe validación. No sabe que existe logging. Esas responsabilidades se agregan como capas transparentes.

---

## CAPA 3 — INFRAESTRUCTURA (EF CORE 10 + POSTGRESQL)

[[ MOSTRAR: DomoNow.Parking.Infrastructure/ ]]

EF Core 10 con Npgsql conecta a PostgreSQL 17 Alpine.

El mapeo de concurrencia optimista es explícito:

```csharp
modelBuilder.Entity<ParkingSpot>()
    .Property<uint>("RowVersion")
    .IsRowVersion(); // Mapea a la columna xmin de PostgreSQL
```

`xmin` es una columna de sistema de PostgreSQL que cambia su valor en cada UPDATE del registro. EF Core la usa como token de concurrencia — si dos transacciones leen el mismo `xmin` y las dos intentan escribir, la segunda recibe `DbUpdateConcurrencyException`.

Pero no me quedé solo en eso. También está el índice parcial único:

```sql
CREATE UNIQUE INDEX uq_parking_active_assignment 
ON parking_assignments (parking_spot_id) 
WHERE status = 1;
```

**Esa es la garantía final.** Si por alguna razón dos réplicas pasan la concurrencia optimista en el mismo microsegundo, PostgreSQL rechaza el segundo insert físicamente. Es imposible — no improbable, imposible — que dos asignaciones activas existan para el mismo cupo.

---

## CAPA 4 — LA API

[[ MOSTRAR: http://localhost:5050/swagger ]]

La API expone cuatro endpoints documentados en Swagger/OpenAPI 3.1:

| Método | Endpoint | Descripción | Respuestas |
|---|---|---|---|
| GET | `/api/parking-spots` | Inventario de 30 cupos | 200 OK |
| POST | `/api/parking-assignments` | Registro de entrada | 201, 400, 409, 422 |
| POST | `/api/parking-assignments/{id}/checkout` | Registro de salida | 200, 400, 404 |
| GET | `/api/parking-assignments/active` | Vehículos activos | 200 OK |

Tengo un **middleware global de manejo de excepciones** que implementa RFC 7807 ProblemDetails. Cuando el dominio lanza una excepción, el middleware la mapea a la respuesta HTTP correcta:

- `DomainConflictException` → HTTP 409 Conflict con campo `type`, `title`, `detail`, `instance`
- `DomainValidationException` → HTTP 422 Unprocessable Entity
- `DbUpdateConcurrencyException` → HTTP 409 Conflict
- Error `23505` de PostgreSQL (unique_violation) → HTTP 409 Conflict

**El cliente nunca ve una excepción cruda.** Siempre recibe un JSON estructurado con información suficiente para manejar el error en la UI.

---

## INICIALIZACIÓN DE LA BASE DE DATOS

[[ MOSTRAR: podman/podman-compose.yaml — la sección volumes del postgres ]]

La base de datos se inicializa automáticamente. El archivo `open-spec/06-database-ddl.sql` se monta en el contenedor en `/docker-entrypoint-initdb.d/01-init.sql`. En el primer arranque, PostgreSQL ejecuta ese script y crea:

- Las dos tablas: `parking_spots` y `parking_assignments`
- El índice parcial único de concurrencia
- 30 cupos precargados de `P-01` a `P-30` en estado Disponible
- Datos de prueba: 3 vehículos activos en cupos distintos para demostración

No necesito EF Core Migrations. La inicialización es determinista, idempotente y reproducible desde cero en cualquier máquina.

[[ MOSTRAR: demo en Swagger — GET /api/parking-spots ]]

---

## PREGUNTA ANTICIPADA

**P: "¿Por qué eligió .NET 10 y no .NET 8 que es la versión LTS anterior?"**

R: .NET 10 es la próxima versión LTS — Long Term Support — y tiene soporte hasta noviembre de 2027. La prueba especificaba .NET como tecnología. Usar la versión más moderna es una decisión de forward-compatibility. La migración desde la arquitectura de referencia .NET 8 fue directa y documentada en el EDR-006.

**P: "¿Tiene Entity Framework Migrations?"**

R: Tomé una decisión deliberada de no usar EF Migrations en producción. Ejecutar migraciones automáticas al arrancar un contenedor genera problemas de concurrencia cuando hay múltiples réplicas iniciando simultáneamente. En su lugar, uso el DDL versionado en `open-spec/06-database-ddl.sql` montado directamente en el contenedor. Eso es reproducible, auditado en Git y no tiene condiciones de carrera en el arranque.

**P: "¿Por qué no Minimal APIs?"**

R: El proyecto de referencia usaba Controllers, y ambas opciones son válidas en .NET 10. Para este tamaño de API, los Controllers con documentación XML y decoradores de ProducesResponseType dan mejor visibilidad en Swagger y facilitan el testing. Con más endpoints, consideraría Minimal APIs con grupos de rutas.
