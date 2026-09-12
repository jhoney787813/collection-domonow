<script setup lang="ts">
import { useAnalyticsStore } from '../stores/analyticsStore';

const store = useAnalyticsStore();
</script>

<template>
  <div class="forecaster-grid">
    <!-- Hourly Demand Bar Chart -->
    <div class="domo-card chart-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Curva de Demanda por Hora (Hoy)</h3>
          <p class="card-desc">Proyección estimada de ocupación entre las 06:00 y las 22:00</p>
        </div>
      </div>

      <div class="bar-chart-container">
        <div
          v-for="item in store.hourlyDemand"
          :key="item.hour"
          class="bar-column"
        >
          <div class="bar-wrapper">
            <span class="bar-tooltip">{{ item.rate }}%</span>
            <div
              class="bar-fill"
              :class="{ 'peak-bar': item.rate >= 80 }"
              :style="{ height: `${item.rate}%` }"
            ></div>
          </div>
          <span class="bar-label">{{ item.hour }}</span>
        </div>
      </div>
    </div>

    <!-- AI/ML Predictive Model Card -->
    <div class="domo-card ml-card">
      <div class="ml-badge-row">
        <span class="ml-badge">ML INFERENCE ENGINE</span>
        <span class="status-indicator">ONNX Runtime Active</span>
      </div>

      <h3 class="ml-title">Predicción de Saturación Inminente</h3>

      <div class="probability-metric">
        <span class="big-percent">94%</span>
        <div class="metric-meta">
          <span class="meta-title">Probabilidad de Pico Crítico</span>
          <span class="meta-sub">Ventana estimada: Hoy 18:00 - 20:30</span>
        </div>
      </div>

      <div class="ml-specs">
        <div class="spec-item">
          <span class="spec-k">Algoritmo:</span>
          <span class="spec-v">LightGBM Regressor + LSTM</span>
        </div>
        <div class="spec-item">
          <span class="spec-k">Latencia Inferencia:</span>
          <span class="spec-v">0.42 ms (In-Memory .NET 10)</span>
        </div>
        <div class="spec-item">
          <span class="spec-k">Deriva (PSI):</span>
          <span class="spec-v text-success">0.03 (Estable)</span>
        </div>
      </div>

      <div class="recommendation-box">
        <span class="rec-icon">💡</span>
        <div class="rec-text">
          <strong>Acción Recomendada para Portería:</strong>
          <span>Priorizar pre-autorización de visitantes para Torre 1 y mantener despejada bahía de desaceleración.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forecaster-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}
@media (max-width: 960px) {
  .forecaster-grid {
    grid-template-columns: 1fr;
  }
}
.chart-card {
  display: flex;
  flex-direction: column;
}
.card-header {
  margin-bottom: 20px;
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
.bar-chart-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 220px;
  padding-top: 20px;
  border-bottom: 1px solid #E2E8F0;
  gap: 12px;
}
.bar-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.bar-wrapper {
  position: relative;
  width: 100%;
  max-width: 38px;
  height: 100%;
  display: flex;
  align-items: flex-end;
}
.bar-fill {
  width: 100%;
  background: #EDE9FE;
  border-top: 3px solid #6C35DE;
  border-radius: 6px 6px 0 0;
  transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s;
}
.bar-fill.peak-bar {
  background: linear-gradient(180deg, #6C35DE 0%, #8B5CF6 100%);
  box-shadow: 0 4px 12px rgba(108, 53, 222, 0.3);
}
.bar-tooltip {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  font-weight: 700;
  color: #4A1E9E;
}
.bar-label {
  margin-top: 10px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
}

/* ML Card */
.ml-card {
  background: linear-gradient(145deg, #FAF5FF 0%, #FFFFFF 60%);
  border: 1px solid #DDD6FE;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.ml-badge-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.ml-badge {
  background: #6C35DE;
  color: #FFFFFF;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: 9999px;
}
.status-indicator {
  font-size: 0.75rem;
  color: #059669;
  font-weight: 600;
}
.ml-title {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0F172A;
}
.probability-metric {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #FFFFFF;
  border: 1px solid #EDE9FE;
  padding: 14px 18px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(108, 53, 222, 0.06);
}
.big-percent {
  font-size: 2.4rem;
  font-weight: 800;
  color: #6C35DE;
  line-height: 1;
}
.metric-meta {
  display: flex;
  flex-direction: column;
}
.meta-title {
  font-size: 0.825rem;
  font-weight: 700;
  color: #0F172A;
}
.meta-sub {
  font-size: 0.75rem;
  color: #64748B;
}
.ml-specs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  margin-bottom: 16px;
}
.spec-item {
  display: flex;
  justify-content: space-between;
}
.spec-k {
  color: #64748B;
}
.spec-v {
  color: #0F172A;
  font-weight: 600;
}
.text-success {
  color: #10B981;
}
.recommendation-box {
  background: #F8FAFC;
  border-left: 3px solid #6C35DE;
  padding: 10px 14px;
  border-radius: 0 8px 8px 0;
  display: flex;
  gap: 10px;
  font-size: 0.775rem;
  color: #334155;
  line-height: 1.4;
}
.rec-icon {
  font-size: 1rem;
}
</style>
