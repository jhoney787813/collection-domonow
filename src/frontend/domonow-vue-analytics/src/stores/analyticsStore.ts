import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface ActivityEvent {
  id: string;
  type: 'ASSIGNMENT' | 'CHECKOUT';
  spotNumber: string;
  licensePlate: string;
  details: string;
  timestamp: string;
}

export const useAnalyticsStore = defineStore('analytics', () => {
  // Reactive State
  const totalVisitsToday = ref(47);
  const averageTurnaroundMinutes = ref(84); // 1h 24m
  const currentOccupancyRate = ref(68);
  const predictedNextHourSurge = ref(88); // 88% probability
  const isListenerAttached = ref(false);

  const activities = ref<ActivityEvent[]>([
    {
      id: 'act-1',
      type: 'ASSIGNMENT',
      spotNumber: 'P-12',
      licensePlate: 'XYZ789',
      details: 'Ingreso a Torre 2 - Apt 901',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString()
    },
    {
      id: 'act-2',
      type: 'CHECKOUT',
      spotNumber: 'P-05',
      licensePlate: 'ABC123',
      details: 'Salida completada (Duración: 65 min)',
      timestamp: new Date(Date.now() - 28 * 60000).toISOString()
    },
    {
      id: 'act-3',
      type: 'ASSIGNMENT',
      spotNumber: 'P-08',
      licensePlate: 'DKM334',
      details: 'Ingreso a Torre 3 - Apt 502',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString()
    }
  ]);

  // Hourly demand curve (06:00 to 22:00)
  const hourlyDemand = ref([
    { hour: '06:00', rate: 15 },
    { hour: '08:00', rate: 45 },
    { hour: '10:00', rate: 60 },
    { hour: '12:00', rate: 75 },
    { hour: '14:00', rate: 55 },
    { hour: '16:00', rate: 70 },
    { hour: '18:00', rate: 92 }, // Peak
    { hour: '20:00', rate: 85 },
    { hour: '22:00', rate: 40 }
  ]);

  // Heatmap matrix (7 days x 5 time slots)
  const heatmapData = ref([
    { day: 'Lun', slots: [25, 45, 60, 85, 40] },
    { day: 'Mar', slots: [30, 50, 65, 80, 45] },
    { day: 'Mié', slots: [28, 48, 70, 88, 50] },
    { day: 'Jue', slots: [35, 55, 75, 92, 60] },
    { day: 'Vie', slots: [40, 65, 85, 96, 75] }, // Highest peak
    { day: 'Sáb', slots: [50, 75, 90, 85, 65] },
    { day: 'Dom', slots: [45, 60, 70, 65, 35] }
  ]);

  // Attach window event listeners for decoupled cross-MFE communication
  function initCrossMfeListener() {
    if (isListenerAttached.value || typeof window === 'undefined') return;

    window.addEventListener('domonow:spot-assigned', (e: any) => {
      const detail = e.detail;
      totalVisitsToday.value++;
      activities.value.unshift({
        id: crypto.randomUUID(),
        type: 'ASSIGNMENT',
        spotNumber: detail.spotNumber,
        licensePlate: detail.licensePlate,
        details: `Ingreso: ${detail.visitorName || 'Visitante'} (${detail.destinationUnit || 'Torre'})`,
        timestamp: detail.entryTime || new Date().toISOString()
      });
      if (activities.value.length > 20) activities.value.pop();
    });

    window.addEventListener('domonow:spot-released', (e: any) => {
      const detail = e.detail;
      activities.value.unshift({
        id: crypto.randomUUID(),
        type: 'CHECKOUT',
        spotNumber: detail.spotNumber,
        licensePlate: detail.licensePlate,
        details: `Salida completada (${detail.durationMinutes || 30} min)`,
        timestamp: detail.exitTime || new Date().toISOString()
      });
      if (activities.value.length > 20) activities.value.pop();
    });

    isListenerAttached.value = true;
  }

  return {
    totalVisitsToday,
    averageTurnaroundMinutes,
    currentOccupancyRate,
    predictedNextHourSurge,
    activities,
    hourlyDemand,
    heatmapData,
    initCrossMfeListener
  };
});
