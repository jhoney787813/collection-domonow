# Open Spec 04: Frontend Microfrontends Specification (Single-SPA)

<!--
  SPEC-METADATA:
  Subsystem: DomoNow Microfrontends Monorepo
  Framework: Single-SPA 6.x, Angular 19+, Vue.js 3+, SystemJS
  Architecture: Microfrontends with Import Maps & Shared Design Tokens
-->

---

## 1. Microfrontends Architecture Topology

```text
+-------------------------------------------------------------------------------+
|                       Single-SPA Root Orchestrator (Port 9000)                |
|                    HTML Shell, Navigation Header, Auth, Shared Bus            |
+---------------------------------------+---------------------------------------+
| Route: /parking                       | Route: /analytics                     |
| Angular 19 MFE (Port 9001)            | Vue.js 3 MFE (Port 9002)              |
| - Live Grid (P-01 to P-30)            | - Historical Demand Matrix            |
| - Entry Dialog / Modal                | - Peak Hour Predictive Model          |
| - Exit Processing                     | - Occupancy Trend Visualizations      |
+---------------------------------------+---------------------------------------+
|                 Shared Design System: @domonow/ui-tokens                      |
+-------------------------------------------------------------------------------+
```

---

## 2. Microfrontend Technical Contracts

### 2.1 Root Orchestrator (`domonow-root` - Port 9000)
* **Technology:** HTML5 Shell, Vanilla TypeScript, SystemJS, `@single-spa/layout`.
* **Responsibilities:**
  1. Serves the global layout: institutional top-bar navigation featuring the DomoNow logo ("Domo" in `#6C35DE`, "Now" in `#0F172A`), complex/condo selector, and active route switchers.
  2. Resolves and injects the global Import Map.
  3. Registers microfrontends using Single-SPA activity functions.
  4. Manages shared authentication session and global notification toast container.

#### Import Map Manifest (Sample)
```html
<script type="systemjs-importmap">
{
  "imports": {
    "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@6.0.3/lib/system/single-spa.min.js",
    "@domonow/root-config": "//localhost:9000/domonow-root-config.js",
    "@domonow/angular-parking": "//localhost:9001/main.js",
    "@domonow/vue-analytics": "//localhost:9002/src/main.js"
  }
}
</script>
```

### 2.2 Operations MFE (`domonow-angular-parking` - Port 9001)
* **Technology:** Angular 19+ (Standalone Components, Signals, OnPush change detection, Zone-less/light Zone), wrapped with `single-spa-angular`.
* **Route:** `/parking` (and default route `/`).
* **Key Components & Signals:**
  * `ParkingGridComponent`: Displays the 30-spot parking grid (P-01 to P-30). Spot cards are color-coded:
    * **Disponible:** Background `#ECFDF5`, text `#065F46`, border `1px solid #A7F3D0`, dot `#10B981`.
    * **Ocupado:** Background `#F3E8FF`, text `#4A1E9E`, border `1px solid #DDD6FE`, dot `#6C35DE`.
    * **Fuera de Servicio:** Background `#F1F5F9`, text `#475569`, border `1px solid #CBD5E1`, dot `#94A3B8`.
  * `ParkingEntryModalComponent`: Pop-up dialog with auto-formatting input mask for license plates (`ABC-123` -> `ABC123`), visitor name, and destination apartment.
  * `CheckoutDialogComponent`: Confirms vehicle departure, calculates elapsed time, and releases spot.
  * **State Management:** Angular Signals:
    ```typescript
    readonly parkingSpots = signal<ParkingSpot[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly activeFilter = signal<ParkingSpotStatus | null>(null);
    ```

### 2.3 Analytics & Predictive Demand MFE (`domonow-vue-analytics` - Port 9002)
* **Technology:** Vue.js 3+ (Composition API, `<script setup>`, Pinia store, Vite bundler), wrapped with `single-spa-vue`.
* **Route:** `/analytics`.
* **Key Features:**
  * **Demand Heatmap:** 24x7 grid showing visitor parking occupancy probabilities by hour and day of week.
  * **Average Turnaround Metric:** Visual gauge indicating average visitor stay duration.
  * **Peak Hour Forecaster:** Highlights anticipated congestion windows using historical trends.

---

## 3. Inter-MFE Communication (Decoupled Event Bus)

Microfrontends must remain completely decoupled. Cross-MFE notifications use the browser's native `CustomEvent` API with `window.dispatchEvent`:

```typescript
// Dispatched by Angular Parking MFE upon entry creation
window.dispatchEvent(new CustomEvent('domonow:spot-assigned', {
  detail: {
    spotNumber: 'P-15',
    licensePlate: 'ABC123',
    timestamp: new Date().toISOString()
  }
}));

// Dispatched by Angular Parking MFE upon checkout
window.dispatchEvent(new CustomEvent('domonow:spot-released', {
  detail: {
    spotNumber: 'P-15',
    durationMinutes: 120,
    timestamp: new Date().toISOString()
  }
}));

// Listened to by Vue Analytics MFE for real-time chart refresh
window.addEventListener('domonow:spot-assigned', (e) => {
  analyticsStore.recordImmediateEntry(e.detail);
});
```

---

## 4. Single-SPA Lifecycle Interface Contract

Each microfrontend must export the three mandatory lifecycle hooks:
```typescript
export async function bootstrap(props: any): Promise<void> { /* initialize dependencies */ }
export async function mount(props: any): Promise<void> { /* mount DOM root into container */ }
export async function unmount(props: any): Promise<void> { /* teardown DOM and subscriptions */ }
```
