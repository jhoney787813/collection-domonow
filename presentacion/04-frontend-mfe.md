# 📺 TELEPROMPTER 04 — Frontend: Microfrontends Angular 19 + Vue 3
## ⏱️ Duración estimada: 5 minutos
## 🎯 Cubre: Angular & TypeScript (20%)

---

> [[ ABRIR: http://localhost:9000 en el navegador. Sistema con sesión ya iniciada, vista /parking activa. ]]
> [[ TENER A MANO: src/frontend/ en el explorador de archivos. ]]

---

## ARQUITECTURA DE MICROFRONTENDS

[[ MOSTRAR: navegador con la aplicación corriendo ]]

Lo que están viendo es una sola URL — `localhost:9000` — pero detrás hay tres aplicaciones completamente independientes corriendo en paralelo.

El **Root Orchestrator** en el puerto 9000 actúa como shell contenedor. Es Vanilla TypeScript — sin framework pesado — porque su responsabilidad es solo orquestar: gestionar el login, el navbar superior y el ciclo de vida de los microfrontends.

El **Angular MFE** en el puerto 9001 maneja la ruta `/parking` — todo lo relacionado con operaciones de portería.

El **Vue MFE** en el puerto 9002 maneja la ruta `/analytics` — el panel de analítica y predicción de demanda.

**¿Cómo se comunican?** Sin acoplamiento directo. Usan el bus de eventos nativo del navegador:

```typescript
// Angular emite cuando registra un ingreso:
window.dispatchEvent(new CustomEvent('domonow:spot-assigned', {
  detail: { spotNumber: 'P-15', licensePlate: 'ABC123' }
}));

// Vue escucha y actualiza su dashboard sin importar Angular:
window.addEventListener('domonow:spot-assigned', (e) => {
  analyticsStore.recordImmediateEntry(e.detail);
});
```

Los dos microfrontends no se conocen. Si mañana reemplazo Vue por React para analítica, Angular no cambia absolutamente nada.

---

## ANGULAR 19 — OPERACIONES DE PORTERÍA

[[ MOSTRAR: /parking — la grilla de 30 cupos ]]

El módulo de portería usa las capacidades más modernas de Angular 19:

**Angular Signals** para gestión de estado reactivo:

```typescript
readonly parkingSpots = signal<ParkingSpot[]>([]);
readonly isLoading = signal<boolean>(false);
readonly activeFilter = signal<ParkingSpotStatus | null>(null);
readonly apiError = signal<boolean>(false);
```

¿Por qué Signals en lugar de RxJS? Porque para este caso de uso — una grilla de 30 elementos que se actualiza con cambios discretos — Signals son más simples, más legibles y evitan la complejidad de los Observables y los memory leaks de subscripciones no canceladas.

**OnPush Change Detection** — los componentes solo se re-renderizan cuando cambia una referencia explícita, no en cada ciclo de detección de Angular. Eso es crítico para una grilla de 30 tarjetas bajo actualizaciones frecuentes.

**Standalone Components** — sin NgModules. Cada componente declara sus propias dependencias. El tree-shaking es más eficiente y el código es más fácil de leer.

---

## LA GRILLA DE PARQUEADEROS

[[ MOSTRAR: los cupos de colores — disponible, ocupado, fuera de servicio ]]

Cada cupo tiene tres estados visuales con código de color del sistema de diseño oficial de DomoNow:

- **Disponible** — verde (`#ECFDF5`), borde verde claro, punto `#10B981`
- **Ocupado** — morado (`#F3E8FF`), borde morado claro, punto `#6C35DE`
- **Fuera de Servicio** — gris (`#F1F5F9`), borde gris, punto `#94A3B8`

[[ CLIC EN UN CUPO DISPONIBLE — mostrar el modal de registro ]]

El modal de ingreso tiene un input mask automático para placas. El usuario puede escribir "abc-123" con guión, con espacios, en minúsculas — el sistema normaliza a "ABC123" en tiempo real.

[[ MOSTRAR: modal con la placa autoformateada ]]

Eso reduce errores humanos en la garita. Un guardia apurado no necesita recordar el formato — el sistema lo hace por él.

---

## MANEJO DE ERRORES Y ESTADOS VACÍOS

Una de las cosas que me pidieron explícitamente: cuando no hay datos o la API no responde, no mostrar un `alert()` ni un modal vacío — mostrar un **estado de reemplazo inline** en el lugar donde irían los datos.

[[ MOSTRAR: estado de error inline si la API está caída, o describir verbalmente ]]

Implementé un `EmptyStateComponent` en Angular que aparece en el lugar de la grilla con:
- Un ícono contextual
- Un título descriptivo del problema
- El endpoint que falló y el código de error
- Un botón de reintento

Y en Vue, el Pinia store tiene una señal `apiError` que activa un estado de error inline en el dashboard de analítica.

**Los errores no son modales que interrumpen — son parte del flujo de la UI.**

---

## VUE 3 — ANALÍTICA Y PREDICCIÓN

[[ MOSTRAR: /analytics — el dashboard de analítica ]]

El microfrontend de analítica usa Vue 3 con Composition API y Pinia como estado global.

El dashboard muestra:
- **Matriz de saturación 24×7** — ocupación por hora y día de la semana
- **Tabla de asignaciones activas** — vehículos actualmente en el parqueadero con tiempo transcurrido
- **Indicadores de tendencia** — patrones de uso y predicción de demanda

El store de Pinia centraliza toda la lógica de fetching y error handling:

```typescript
// analyticsStore.ts — estado centralizado
const apiError = ref<boolean>(false);
const errorMessage = ref<string>('');

async function fetchActiveAssignments() {
  try {
    const data = await fetch(`${API_BASE}/parking-assignments/active`);
    activeAssignments.value = await data.json();
  } catch (err) {
    apiError.value = true;
    errorMessage.value = 'No se pudo conectar con el backend';
  }
}
```

---

## INTERNACIONALIZACIÓN REACTIVA

[[ MOSTRAR: botón ESP / ENG en el navbar — clic para cambiar idioma ]]

El sistema es completamente bilingüe — Español e Inglés — y el cambio de idioma se propaga en tiempo real a los dos microfrontends sin recargar la página.

El Root Shell emite un evento `domonow:lang-changed` via `window.dispatchEvent` para las apps montadas en el mismo DOM, y simultáneamente envía un `postMessage` a cada iframe. Angular y Vue escuchan ese evento y actualizan todos sus textos en menos de 5 milisegundos.

**Sin librerías pesadas de i18n.** Los diccionarios son objetos TypeScript tipados en el paquete compartido `@domonow/ui-tokens`.

---

## PREGUNTA ANTICIPADA

**P: "¿Por qué Angular para portería y Vue para analítica en lugar de usar el mismo framework?"**

R: Porque cada módulo tiene requerimientos fundamentalmente distintos. Angular es ideal para la portería por su tipado fuerte, las reactive forms para validaciones complejas y los Signals para estado determinista. Vue es ideal para analítica por su reactividad liviana, la Composition API para lógica compleja de gráficos y Pinia para estado compartido entre componentes visuales. El microfrontend permite elegir la herramienta correcta para cada dominio sin comprometer ninguno de los dos.

**P: "¿No es muy complejo para un guardia de portería?"**

R: La interfaz tiene exactamente tres acciones para el guardia: ver la grilla, hacer clic en un cupo disponible y registrar la placa. El guardia no ve la complejidad técnica — ve tres campos y un botón. La complejidad existe debajo para garantizar que lo que el guardia registra sea siempre correcto y nunca genere un conflicto.
