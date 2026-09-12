<script setup lang="ts">
import { useAnalyticsStore } from '../stores/analyticsStore';

const store = useAnalyticsStore();

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
        <h3 class="card-title">{{ store.t.heatmapTitle }}</h3>
        <p class="card-desc">{{ store.t.heatmapDesc }}</p>
      </div>
      <div class="legend">
        <span class="legend-label">{{ store.t.heatmapLow }}</span>
        <span class="legend-chip" style="background: #EDE9FE;"></span>
        <span class="legend-chip" style="background: #C4B5FD;"></span>
        <span class="legend-chip" style="background: #8B5CF6;"></span>
        <span class="legend-chip" style="background: #6C35DE;"></span>
        <span class="legend-chip" style="background: #4A1E9E;"></span>
        <span class="legend-label">{{ store.t.heatmapPeak }}</span>
      </div>
    </div>

    <div class="heatmap-table">
      <!-- Header Row -->
      <div class="heatmap-row header-row">
        <div class="day-cell header-cell">{{ store.t.dayHeader }}</div>
        <div v-for="(slot, i) in store.t.slots" :key="i" class="slot-header-cell">
          {{ slot }}
        </div>
      </div>

      <!-- Data Rows -->
      <div
        v-for="(row, rowIdx) in store.heatmapRows"
        :key="rowIdx"
        class="heatmap-row"
      >
        <div class="day-cell">{{ store.t.days[rowIdx] }}</div>
        <div
          v-for="(val, idx) in row.slots"
          :key="idx"
          class="heatmap-cell"
          :style="{
            backgroundColor: getSlotColor(val),
            color: getTextColor(val)
          }"
          :title="`${store.t.days[rowIdx]} (${store.t.slots[idx]}): ${val}%`"
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
