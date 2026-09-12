<script setup lang="ts">
import { useAnalyticsStore } from '../stores/analyticsStore';

const store = useAnalyticsStore();

function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoStr;
  }
}
</script>

<template>
  <div class="domo-card feed-card">
    <div class="card-header">
      <div class="title-with-pulse">
        <span class="pulse-dot"></span>
        <h3 class="card-title">Feed de Eventos en Tiempo Real</h3>
      </div>
      <span class="bus-tag">Inter-MFE Bus: Active</span>
    </div>

    <div class="activity-list">
      <div
        v-for="event in store.activities"
        :key="event.id"
        class="activity-item"
        :class="event.type.toLowerCase()"
      >
        <div class="item-icon">
          <span v-if="event.type === 'ASSIGNMENT'">📥</span>
          <span v-else>📤</span>
        </div>

        <div class="item-content">
          <div class="item-line1">
            <span class="spot-tag">{{ event.spotNumber }}</span>
            <span class="plate-pill">{{ event.licensePlate }}</span>
            <span class="event-time">{{ formatTime(event.timestamp) }}</span>
          </div>
          <div class="item-line2">
            {{ event.details }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-card {
  margin-top: 24px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.title-with-pulse {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #10B981;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse 2s infinite;
}
.card-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0F172A;
}
.bus-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: #6C35DE;
  background: #F3E8FF;
  padding: 3px 8px;
  border-radius: 9999px;
  border: 1px solid #DDD6FE;
}
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;
}
.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  transition: all 0.2s ease;
}
.activity-item:hover {
  background: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.activity-item.assignment {
  border-left: 3px solid #6C35DE;
}
.activity-item.checkout {
  border-left: 3px solid #10B981;
}
.item-icon {
  font-size: 1.1rem;
  line-height: 1;
  margin-top: 2px;
}
.item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.item-line1 {
  display: flex;
  align-items: center;
  gap: 8px;
}
.spot-tag {
  font-weight: 800;
  font-size: 0.85rem;
  color: #0F172A;
}
.plate-pill {
  background: #EDE9FE;
  color: #4A1E9E;
  font-family: monospace;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 1px 6px;
  border-radius: 4px;
}
.event-time {
  margin-left: auto;
  font-size: 0.72rem;
  color: #94A3B8;
  font-weight: 500;
}
.item-line2 {
  font-size: 0.78rem;
  color: #475569;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
  70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}
</style>
