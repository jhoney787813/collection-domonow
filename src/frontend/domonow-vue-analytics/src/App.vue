<script setup lang="ts">
import { onMounted } from 'vue';
import { useAnalyticsStore } from './stores/analyticsStore';
import DemandHeatmap from './components/DemandHeatmap.vue';
import PeakHourForecaster from './components/PeakHourForecaster.vue';
import ActivityFeed from './components/ActivityFeed.vue';

const store = useAnalyticsStore();

onMounted(() => {
  store.initCrossMfeListener();
});
</script>

<template>
  <div class="analytics-container">
    <!-- Subproject Visual Header -->
    <header class="mfe-header">
      <div class="header-left">
        <div class="brand-pill">
          <span class="brand-sub">ANALÍTICA PREDICTIVA & MACHINE LEARNING</span>
        </div>
        <h2>Demanda y Turnaround de Visitantes</h2>
        <p class="subtitle">Modelos de probabilidad de ocupación, rotación de bahías y previsión de picos</p>
      </div>

      <div class="header-right">
        <div class="date-range-badge">
          <span>📅 Semana Actual: 08 - 14 Sep</span>
        </div>
      </div>
    </header>

    <!-- Top KPI Row -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-title">Visitas Registradas Hoy</span>
        <span class="kpi-value">{{ store.totalVisitsToday }}</span>
        <span class="kpi-tag positive">+14% vs. promedio semanal</span>
      </div>

      <div class="kpi-card">
        <span class="kpi-title">Tiempo Promedio de Estadía</span>
        <span class="kpi-value">{{ Math.floor(store.averageTurnaroundMinutes / 60) }}h {{ store.averageTurnaroundMinutes % 60 }}m</span>
        <span class="kpi-tag">Rotación: 2.8 visitas / cupo</span>
      </div>

      <div class="kpi-card">
        <span class="kpi-title">Tasa de Ocupación Actual</span>
        <span class="kpi-value">{{ store.currentOccupancyRate }}%</span>
        <span class="kpi-tag warning">Zona de Carga Media-Alta</span>
      </div>

      <div class="kpi-card ml-kpi">
        <span class="kpi-title">Inferencia Próximo Pico</span>
        <span class="kpi-value">{{ store.predictedNextHourSurge }}%</span>
        <span class="kpi-tag ml-tag">Proyección 18:00 - 20:00</span>
      </div>
    </div>

    <!-- Core Forecasting & Heatmap Components -->
    <DemandHeatmap />
    <PeakHourForecaster />
    <ActivityFeed />
  </div>
</template>

<style scoped>
.analytics-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
}
.mfe-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.brand-pill {
  display: inline-block;
  margin-bottom: 6px;
}
.brand-sub {
  background: #EDE9FE;
  color: #5825C6;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: 9999px;
}
.mfe-header h2 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.02em;
}
.subtitle {
  margin: 4px 0 0 0;
  color: #64748B;
  font-size: 0.9rem;
}
.date-range-badge {
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.825rem;
  font-weight: 600;
  color: #334155;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.kpi-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.kpi-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748B;
}
.kpi-value {
  font-size: 2rem;
  font-weight: 800;
  color: #0F172A;
  margin: 4px 0;
  line-height: 1.1;
}
.kpi-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748B;
}
.kpi-tag.positive {
  color: #10B981;
}
.kpi-tag.warning {
  color: #F59E0B;
}
.ml-kpi {
  border-color: #DDD6FE;
  background: linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%);
}
.ml-tag {
  color: #6C35DE;
}
</style>
