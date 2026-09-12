# 📺 TELEPROMPTER 05 — Calidad, Pruebas y Documentación
## ⏱️ Duración estimada: 4 minutos
## 🎯 Cubre: Calidad & Pruebas (15%)

---

> [[ ABRIR: DomoNow.Parking.UnitTests/ en el explorador. Tener una terminal lista. ]]

---

## ENFOQUE EN CALIDAD

Cuando el criterio de evaluación dice "pruebas relevantes" y no "cobertura al 100%", está señalando algo importante: **no buscan cantidad de pruebas — buscan que las pruebas demuestren que el candidato entiende qué es lo crítico en su sistema.**

En mi sistema, lo más crítico es la concurrencia. Si la concurrencia falla en producción, hay un impacto físico real — dos vehículos en el mismo cupo, un conflicto en la talanquera. Por eso centré las pruebas exactamente ahí.

---

## LAS 16 PRUEBAS AUTOMATIZADAS

Tengo dieciséis pruebas organizadas en dos clases:

### Pruebas Unitarias de Dominio — `ParkingSpotTests.cs`

Seis pruebas que validan las seis invariantes de negocio del modelo de dominio:

**1. Asignación exitosa desde estado disponible**
```csharp
AssignSpot_WhenAvailable_ShouldSucceedAndMarkOccupied
```
Valida que un cupo disponible pase correctamente a Ocupado y genere una asignación con timestamp UTC.

**2. Rechazo de asignación doble**
```csharp
AssignSpot_WhenAlreadyOccupied_ShouldThrowDomainConflictException
```
Confirma que el agregado lanza la excepción correcta antes de llegar a la base de datos.

**3. Rechazo de cupos fuera de servicio**
```csharp
AssignSpot_WhenOutOfService_ShouldThrowInvalidOperationException
```

**4. Checkout exitoso con reconciliación de estado**
```csharp
CompleteCheckout_WhenActive_ShouldSetAvailableAndRecordExit
```
Valida que el cupo vuelve a Disponible y la asignación queda con estado Completed.

**5. Validación temporal de salida anterior a entrada**
```csharp
CompleteCheckout_WhenExitDateBeforeEntry_ShouldFailTemporalRule
```
La regla que garantiza que `ExitTime >= EntryTime` es una invariante absoluta.

**6. Normalización de placas**
```csharp
LicensePlate_Normalization_ShouldSanitizeHyphensAndSpaces
```
Confirma que "abc-123", " ABC 123 " y "abc.123" todos resultan en "ABC123".

---

### Prueba de Concurrencia — `ConcurrencyIntegrationTests.cs`

Esta es la prueba más importante. Un solo test que simula la condición de carrera real:

```csharp
// Se disparan 10 peticiones HTTP simultáneas al mismo cupo P-15
var tasks = Enumerable.Range(0, 10)
    .Select(_ => client.PostAsJsonAsync("/api/parking-assignments", command))
    .ToArray();

var responses = await Task.WhenAll(tasks);

// Exactamente 1 debe ser HTTP 201
responses.Count(r => r.StatusCode == HttpStatusCode.Created).Should().Be(1);

// Exactamente 9 deben ser HTTP 409 Conflict
responses.Count(r => r.StatusCode == HttpStatusCode.Conflict).Should().Be(9);
```

[[ EJECUTAR EN TERMINAL: dotnet test src/backend/DomoNow.Parking.UnitTests/ --logger "console;verbosity=normal" ]]

Cuando ven ese resultado — 1 Created, 9 Conflict — están viendo la prueba de que la defensa de doble capa funciona exactamente como fue diseñada.

---

## LEGIBILIDAD Y MANTENIBILIDAD DEL CÓDIGO

Hay tres estándares de código que apliqué consistentemente:

**1. FluentAssertions en todas las pruebas**
```csharp
// En lugar de Assert.Equal(expected, actual):
result.Status.Should().Be(ParkingSpotStatus.Occupied);
result.LicensePlate.Value.Should().Be("ABC123");
```
El código de prueba lee como lenguaje natural. Un desarrollador nuevo entiende qué se está validando sin necesidad de comentarios.

**2. XML Documentation en todos los endpoints**
```csharp
/// <summary>
/// Registers entry of a visitor vehicle, allocating the designated parking spot.
/// </summary>
[HttpPost]
[ProducesResponseType(typeof(ParkingAssignmentDto), StatusCodes.Status201Created)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
public async Task<ActionResult<ParkingAssignmentDto>> RegisterEntry(...)
```
Los ProducesResponseType declarativos generan documentación automática en Swagger y eliminan ambigüedad sobre los contratos de la API.

**3. Nombres expresivos — sin abreviaciones ni comentarios explicativos**

El código debe explicarse solo. Si necesito un comentario para explicar qué hace una línea de código, el nombre del método está mal elegido.

---

## GIT Y TRAZABILIDAD

El historial de Git refleja el progreso real del desarrollo:

- Commits atómicos con mensajes descriptivos siguiendo Conventional Commits
- Cada commit representa un cambio cohesivo y compilable
- El `AI-USAGE.md` documenta las decisiones de ingeniería con contexto, alternativas evaluadas y justificación técnica

**¿Por qué el AI-USAGE.md es parte de la calidad?** Porque en un equipo real, las decisiones técnicas necesitan ser comunicadas, entendidas y eventualmente revisadas. Documentar "por qué no usé SemaphoreSlim" es tan valioso como el código que sí escribí.

---

## DOCUMENTACIÓN

Tengo tres niveles de documentación:

**1. OpenSpec (8 archivos)** — especificaciones formales del sistema antes del código
**2. README.md** — guía de ejecución completa: cómo levantar Podman, cómo compilar, cómo correr pruebas
**3. AI-USAGE.md** — Engineering Decision Records con el razonamiento detrás de cada decisión arquitectónica

Y también generé un documento de **auditoría de seguridad** — `docs/auditoria_seguridad.md` — porque la calidad del software no es solo que funcione. Es que sea seguro, trazable y honesto sobre sus limitaciones.

---

## PREGUNTA ANTICIPADA

**P: "¿Por qué solo dieciséis pruebas? ¿No es poco?"**

R: Son dieciséis pruebas que cubren el 100% de los caminos críticos del negocio. Prefiero dieciséis pruebas que fallan cuando algo importante está roto, antes que cien pruebas que prueban getters y setters. La cobertura de código no es sinónimo de calidad de pruebas. La pregunta correcta es: "¿si cualquiera de estas pruebas falla, significa que algo importante está roto en producción?" Y la respuesta es sí para las dieciséis.

**P: "¿Tiene pruebas de integración end-to-end?"**

R: La prueba de concurrencia es técnicamente una prueba de integración — levanta un servidor en memoria con WebApplicationFactory y hace peticiones HTTP reales. No tengo pruebas E2E con Cypress o Playwright, y eso lo reconozco como una limitación del tiempo disponible. Lo documenté en el README como algo que implementaría en la siguiente iteración.
