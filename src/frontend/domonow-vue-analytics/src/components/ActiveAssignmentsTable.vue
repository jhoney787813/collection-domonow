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
  <div class="active-table-card">
    <div class="table-header">
      <div class="header-titles">
        <div class="header-pill">
          <span class="live-dot"></span>
          <span>{{ isEn ? 'LIVE FROM .NET 10 API' : 'EN VIVO DESDE API .NET 10' }}</span>
        </div>
        <h3>{{ isEn ? 'Active Vehicles in Visitor Parking' : 'Vehículos Activos en Cupos de Visitantes' }}</h3>
        <p class="table-subtitle">
          {{ isEn 
              ? 'Real-time assignments queried from GET /api/parking-assignments/active' 
              : 'Asignaciones en tiempo real consultadas desde GET /api/parking-assignments/active' }}
        </p>
      </div>

      <div class="header-actions">
        <span class="count-badge">
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

    <!-- Loading State -->
    <div v-if="store.isLoadingAssignments" class="loading-state">
      <div class="spinner"></div>
      <p>{{ isEn ? 'Connecting to backend API at localhost:5050...' : 'Conectando con la API del backend en localhost:5050...' }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="store.activeAssignments.length === 0" class="empty-state">
      <span class="empty-icon">🅿️</span>
      <p>{{ isEn ? 'No active vehicle assignments at this moment.' : 'No hay vehículos activos registrados en este momento.' }}</p>
    </div>

    <!-- Table -->
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
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
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
.live-dot {
  width: 6px;
  height: 6px;
  background: #10B981;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
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
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #64748B;
  font-size: 0.9rem;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #EDE9FE;
  border-top-color: #6C35DE;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
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
