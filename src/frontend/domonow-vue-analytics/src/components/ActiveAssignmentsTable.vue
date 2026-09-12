<script setup lang="ts">
import { computed } from 'vue';
import { useAnalyticsStore } from '../stores/analyticsStore';

const store = useAnalyticsStore();

function formatTime(isoString: string): string {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatElapsed(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

const isEn = computed(() => store.currentLang === 'en');
</script>

<template>
  <div class="active-table-card" :class="{ 'card-error': store.apiError }">
    <!-- Card Header -->
    <div class="table-header">
      <div class="header-titles">
        <div class="header-pill" :class="{ 'pill-error': store.apiError }">
          <span class="live-dot" :class="{ 'dot-error': store.apiError }"></span>
          <span>
            {{ store.apiError 
                ? (isEn ? 'API OFFLINE / DISCONNECTED' : 'API DESCONECTADA / SIN DATOS') 
                : (isEn ? 'LIVE FROM .NET 10 API' : 'EN VIVO DESDE API .NET 10') }}
          </span>
        </div>
        <h3>{{ isEn ? 'Active Vehicles in Visitor Parking' : 'Vehículos Activos en Cupos de Visitantes' }}</h3>
        <p class="table-subtitle">
          {{ isEn 
              ? 'Real-time assignments queried from GET /api/parking-assignments/active' 
              : 'Asignaciones en tiempo real consultadas desde GET /api/parking-assignments/active' }}
        </p>
      </div>

      <div class="header-actions">
        <span class="count-badge" :class="{ 'badge-zero': store.activeAssignments.length === 0 }">
          {{ store.activeAssignments.length }} {{ isEn ? 'Vehicles' : 'Vehículos' }}
        </span>
        <button
          type="button"
          class="refresh-btn"
          :disabled="store.isLoadingAssignments"
          @click="store.fetchAnalyticsData()"
        >
          🔄 {{ store.isLoadingAssignments ? (isEn ? 'Syncing...' : 'Sincronizando...') : (isEn ? 'Refresh' : 'Recargar') }}
        </button>
      </div>
    </div>

    <!-- Case 1: Loading State -->
    <div v-if="store.isLoadingAssignments && store.activeAssignments.length === 0" class="loading-state">
      <div class="spinner"></div>
      <h4>{{ isEn ? 'Connecting to backend API at localhost:5050...' : 'Conectando con la API .NET 10 en localhost:5050...' }}</h4>
      <p>{{ isEn ? 'Fetching real-time active visitor parking assignments...' : 'Consultando asignaciones activas de visitantes en la base de datos PostgreSQL...' }}</p>
    </div>

    <!-- Case 2: Inline Error State (Replacing Table when API fails) -->
    <div v-else-if="store.apiError" class="inline-error-state">
      <div class="error-icon-bubble">
        <span>📡</span>
      </div>
      <h4 class="error-title">{{ store.apiError.title }}</h4>
      <p class="error-message">{{ store.apiError.message }}</p>

      <div class="diagnostic-box">
        <div class="diag-header">
          <span class="diag-label">{{ isEn ? 'Technical Diagnostic / Cause:' : 'Diagnóstico Técnico / Causa:' }}</span>
          <span class="http-tag">HTTP {{ store.apiError.statusCode || 500 }}</span>
        </div>
        <p class="diag-content">{{ store.apiError.detail }}</p>
      </div>

      <button
        type="button"
        class="domo-retry-btn"
        :disabled="store.isLoadingAssignments"
        @click="store.fetchAnalyticsData()"
      >
        <span *ngIf="store.isLoadingAssignments" class="btn-spinner"></span>
        <span>{{ isEn ? '🔄 Retry Connection with API' : '🔄 Reintentar Conexión con Servidor' }}</span>
      </button>
    </div>

    <!-- Case 3: Inline Empty State (Replacing Table when 0 active assignments) -->
    <div v-else-if="store.activeAssignments.length === 0" class="inline-empty-state">
      <div class="empty-icon-bubble">
        <span>🚗</span>
      </div>
      <h4 class="empty-title">{{ isEn ? 'No Active Visitor Vehicles' : 'Sin Asignaciones Activas en Este Momento' }}</h4>
      <p class="empty-message">
        {{ isEn 
            ? 'All visitor bays are currently available. When a visitor vehicle is checked in through the gatehouse, it will instantly appear in this table.' 
            : 'Todos los cupos para visitantes se encuentran actualmente desocupados. En cuanto se registre el ingreso de un vehículo en portería, aparecerá automáticamente en esta tabla.' }}
      </p>

      <div class="empty-info-pill">
        <span>ℹ️ {{ isEn ? 'Endpoint verified: GET /api/parking-assignments/active (0 active vehicles)' : 'Endpoint verificado: GET /api/parking-assignments/active (0 vehículos activos)' }}</span>
      </div>

      <button
        type="button"
        class="domo-empty-refresh-btn"
        :disabled="store.isLoadingAssignments"
        @click="store.fetchAnalyticsData()"
      >
        <span>{{ isEn ? '🔄 Check for New Arrivals' : '🔄 Comprobar Asignaciones' }}</span>
      </button>
    </div>

    <!-- Case 4: Table with Real Data -->
    <div v-else class="table-wrapper">
      <table class="domo-table">
        <thead>
          <tr>
            <th>{{ isEn ? 'Bay' : 'Cupo' }}</th>
            <th>{{ isEn ? 'Plate' : 'Placa' }}</th>
            <th>{{ isEn ? 'Visitor Name' : 'Visitante' }}</th>
            <th>{{ isEn ? 'Destination Unit' : 'Destino' }}</th>
            <th>{{ isEn ? 'Entry Time' : 'Hora Ingreso' }}</th>
            <th>{{ isEn ? 'Elapsed Time' : 'Tiempo Transcurrido' }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in store.activeAssignments" :key="item.id">
            <td>
              <span class="spot-badge">{{ item.spotNumber }}</span>
            </td>
            <td>
              <span class="plate-badge">{{ item.licensePlate }}</span>
            </td>
            <td>
              <div class="visitor-col">
                <span class="visitor-icon">👤</span>
                <span class="visitor-name">{{ item.visitorName }}</span>
              </div>
            </td>
            <td>
              <div class="unit-col">
                <span class="unit-icon">🏢</span>
                <span class="unit-text">{{ item.destinationUnit }}</span>
              </div>
            </td>
            <td>
              <span class="time-text">{{ formatTime(item.entryTime) }}</span>
            </td>
            <td>
              <span
                class="duration-chip"
                :class="{ 'chip-long': item.elapsedMinutes > 120, 'chip-medium': item.elapsedMinutes > 60 && item.elapsedMinutes <= 120 }"
              >
                ⏱️ {{ formatElapsed(item.elapsedMinutes) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.active-table-card {
  background: #FFFFFF;
  border: 1.5px solid #E2E8F0;
  border-radius: 18px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.03);
  transition: all 0.3s ease;
}
.active-table-card.card-error {
  border-color: #FECACA;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}
.header-titles h3 {
  margin: 6px 0 2px 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0F172A;
}
.table-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: #64748B;
}
.header-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #EDE9FE;
  color: #5825C6;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 9999px;
}
.header-pill.pill-error {
  background: #FEE2E2;
  color: #991B1B;
}
.live-dot {
  width: 6px;
  height: 6px;
  background: #10B981;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}
.live-dot.dot-error {
  background: #EF4444;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.count-badge {
  background: #FAF5FF;
  border: 1px solid #DDD6FE;
  color: #4A1E9E;
  font-size: 0.825rem;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 10px;
}
.count-badge.badge-zero {
  background: #F1F5F9;
  border-color: #CBD5E1;
  color: #64748B;
}
.refresh-btn {
  background: #6C35DE;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(108, 53, 222, 0.25);
  display: flex;
  align-items: center;
  gap: 6px;
}
.refresh-btn:hover:not(:disabled) {
  background: #5825C6;
  transform: translateY(-1px);
}
.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
}
.loading-state h4 {
  margin: 12px 0 4px 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0F172A;
}
.loading-state p {
  margin: 0;
  font-size: 0.86rem;
  color: #64748B;
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #EDE9FE;
  border-top-color: #6C35DE;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Inline Error State */
.inline-error-state {
  background: linear-gradient(180deg, #FFF5F5 0%, #FFFFFF 40%);
  border: 1px solid #FECACA;
  border-radius: 16px;
  padding: 36px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: 12px 0;
}
.error-icon-bubble {
  width: 64px;
  height: 64px;
  background: #FEE2E2;
  border: 1.5px solid #FCA5A5;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin-bottom: 14px;
}
.error-title {
  margin: 0 0 6px 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #991B1B;
}
.error-message {
  margin: 0 auto 18px auto;
  max-width: 540px;
  font-size: 0.9rem;
  color: #4B5563;
  line-height: 1.5;
}
.diagnostic-box {
  background: #FFFFFF;
  border: 1px solid #FCA5A5;
  border-left: 4px solid #DC2626;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
  max-width: 580px;
  width: 100%;
  text-align: left;
}
.diag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.diag-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #991B1B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.http-tag {
  background: #FEE2E2;
  color: #991B1B;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.diag-content {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  color: #1F2937;
  word-break: break-all;
}
.domo-retry-btn {
  background: #DC2626;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  padding: 10px 22px;
  font-size: 0.88rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}
.domo-retry-btn:hover:not(:disabled) {
  background: #B91C1C;
  transform: translateY(-1px);
}

/* Inline Empty State */
.inline-empty-state {
  background: linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 40%);
  border: 1px solid #DDD6FE;
  border-radius: 16px;
  padding: 36px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: 12px 0;
}
.empty-icon-bubble {
  width: 64px;
  height: 64px;
  background: #EDE9FE;
  border: 1.5px solid #C4B5FD;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin-bottom: 14px;
}
.empty-title {
  margin: 0 0 6px 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #4A1E9E;
}
.empty-message {
  margin: 0 auto 16px auto;
  max-width: 560px;
  font-size: 0.9rem;
  color: #4B5563;
  line-height: 1.55;
}
.empty-info-pill {
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 0.8rem;
  color: #4B5563;
  margin-bottom: 20px;
}
.domo-empty-refresh-btn {
  background: linear-gradient(135deg, #6C35DE 0%, #4A1E9E 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  padding: 10px 22px;
  font-size: 0.88rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(108, 53, 222, 0.25);
}
.domo-empty-refresh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(108, 53, 222, 0.35);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}
.domo-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  text-align: left;
}
.domo-table th {
  background: #F8FAFC;
  color: #64748B;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 1.5px solid #E2E8F0;
}
.domo-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #F1F5F9;
  color: #1E293B;
  vertical-align: middle;
}
.domo-table tbody tr:hover {
  background: #FAF5FF;
}
.spot-badge {
  font-weight: 800;
  font-size: 0.95rem;
  color: #0F172A;
}
.plate-badge {
  background: #EDE9FE;
  color: #4A1E9E;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #DDD6FE;
}
.visitor-col, .unit-col {
  display: flex;
  align-items: center;
  gap: 6px;
}
.visitor-name {
  font-weight: 600;
  color: #0F172A;
}
.unit-text {
  color: #475569;
}
.time-text {
  font-size: 0.85rem;
  color: #64748B;
  font-weight: 500;
}
.duration-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #F1F5F9;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
}
.chip-medium {
  background: #FEF3C7;
  color: #92400E;
}
.chip-long {
  background: #FEE2E2;
  color: #991B1B;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
