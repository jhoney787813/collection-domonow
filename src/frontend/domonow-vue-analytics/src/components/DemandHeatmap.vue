<script setup lang="ts">
import { useAnalyticsStore } from '../stores/analyticsStore';

const store = useAnalyticsStore();

const timeSlotLabels = ['06:00 - 10:00', '10:00 - 14:00', '14:00 - 18:00', '18:00 - 21:00 (Pico)', '21:00 - 00:00'];

function getSlotColor(rate: number): string {
  if (rate >= 90) return '#4A1E9E'; // Deepest Purple
  if (rate >= 75) return '#6C35DE'; // Domo Primary
  if (rate >= 55) return '#8B5CF6'; // Violet
  if (rate >= 35) return '#C4B5FD'; // Soft Lavender
  return '#EDE9FE'; // Lightest
}

function getTextColor(rate: number): string {
  return rate >= 65 ? '#FFFFFF' : '#4A1E9E';
}
</script>

<template>
  <div class="domo-card heatmap-card">
    <div class="card-header">
      <div>
        <h3 class="card-title">Matriz de Demanda Semanal (24x7)</h3>
        <p class="card-desc">Probabilidad de saturación de parqueaderos por franjas horarias y días</p>
      </div>
      <div class="legend">
        <span class="legend-label">Baja</span>
        <span class="legend-chip" style="background: #EDE9FE;"></span>
        <span class="legend-chip" style="background: #C4B5FD;"></span>
        <span class="legend-chip" style="background: #8B5CF6;"></span>
        <span class="legend-chip" style="background: #6C35DE;"></span>
        <span class="legend-chip" style="background: #4A1E9E;"></span>
        <span class="legend-label">Pico (95%+)</span>
      </div>
    </div>

    <div class="heatmap-table">
      <!-- Header Row -->
      <div class="heatmap-row header-row">
        <div class="day-cell header-cell">Día</div>
        <div v-for="(slot, i) in timeSlotLabels" :key="i" class="slot-header-cell">
          {{ slot }}
        </div>
      </div>

      <!-- Data Rows -->
      <div
        v-for="row in store.heatmapData"
        :key="row.day"
        class="heatmap-row"
      >
        <div class="day-cell">{{ row.day }}</div>
        <div
          v-for="(val, idx) in row.slots"
          :key="idx"
          class="heatmap-cell"
          :style="{
            backgroundColor: getSlotColor(val),
            color: getTextColor(val)
          }"
          :title="`${row.day} (${timeSlotLabels[idx]}): ${val}% de probabilidad de ocupación`"
        >
          <span class="cell-val">{{ val }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heatmap-card {
  margin-bottom: 24px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 12px;
}
.card-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0F172A;
}
.card-desc {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: #64748B;
}
.legend {
  display: flex;
  align-items: center;
  gap: 4px;
}
.legend-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  padding: 0 4px;
}
.legend-chip {
  width: 16px;
  height: 12px;
  border-radius: 3px;
}
.heatmap-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-x: auto;
}
.heatmap-row {
  display: grid;
  grid-template-columns: 60px repeat(5, 1fr);
  gap: 8px;
  align-items: center;
}
.header-row {
  margin-bottom: 4px;
}
.day-cell {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
  text-align: center;
}
.header-cell {
  color: #64748B;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.slot-header-cell {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748B;
  text-align: center;
}
.heatmap-cell {
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.825rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.heatmap-cell:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 12px rgba(108, 53, 222, 0.2);
  z-index: 2;
}
.cell-val {
  user-select: none;
}
</style>
