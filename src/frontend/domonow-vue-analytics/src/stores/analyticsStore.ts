import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type SupportedLang = 'es' | 'en';

export interface ActivityEvent {
  id: string;
  type: 'ASSIGNMENT' | 'CHECKOUT';
  spotNumber: string;
  licensePlate: string;
  details: string;
  timestamp: string;
}

const vueDictionaries = {
  es: {
    brandSub: 'ANALÍTICA PREDICTIVA & MACHINE LEARNING',
    title: 'Demanda y Turnaround de Visitantes',
    subtitle: 'Modelos de probabilidad de ocupación, rotación de bahías y previsión de picos',
    dateRange: '📅 Semana Actual: 08 - 14 Sep',
    kpiVisitsToday: 'Visitas Registradas Hoy',
    kpiVsAvg: '+14% vs. promedio semanal',
    kpiTurnaround: 'Tiempo Promedio de Estadía',
    kpiTurnover: 'Rotación: 2.8 visitas / cupo',
    kpiOccupancyRate: 'Tasa de Ocupación Actual',
    kpiZoneLabel: 'Zona de Carga Media-Alta',
    kpiNextPeak: 'Inferencia Próximo Pico',
    kpiProjectionWindow: 'Proyección 18:00 - 20:00',
    // Heatmap
    heatmapTitle: 'Matriz de Demanda Semanal (24x7)',
    heatmapDesc: 'Probabilidad de saturación de parqueaderos por franjas horarias y días',
    heatmapLow: 'Baja',
    heatmapPeak: 'Pico (95%+)',
    dayHeader: 'Día',
    days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    slots: ['06:00 - 10:00', '10:00 - 14:00', '14:00 - 18:00', '18:00 - 21:00 (Pico)', '21:00 - 00:00'],
    // Forecaster
    chartTitle: 'Curva de Demanda por Hora (Hoy)',
    chartDesc: 'Proyección estimada de ocupación entre las 06:00 y las 22:00',
    mlBadge: 'MOTOR DE INFERENCIA ML',
    onnxActive: 'ONNX Runtime Activo',
    mlTitle: 'Predicción de Saturación Inminente',
    probTitle: 'Probabilidad de Pico Crítico',
    probWindow: 'Ventana estimada: Hoy 18:00 - 20:30',
    algoLabel: 'Algoritmo:',
    latencyLabel: 'Latencia Inferencia:',
    driftLabel: 'Deriva (PSI):',
    recTitle: 'Acción Recomendada para Portería:',
    recText: 'Priorizar pre-autorización de visitantes para Torre 1 y mantener despejada bahía de desaceleración.',
    // Feed
    feedTitle: 'Feed de Eventos en Tiempo Real',
    busActive: 'Bus Inter-MFE: Activo',
    entryPrefix: 'Ingreso:',
    checkoutPrefix: 'Salida completada'
  },
  en: {
    brandSub: 'PREDICTIVE ANALYTICS & MACHINE LEARNING',
    title: 'Visitor Demand & Turnaround',
    subtitle: 'Occupancy probability models, bay turnaround, and surge forecasting',
    dateRange: '📅 Current Week: Sep 08 - 14',
    kpiVisitsToday: 'Visits Recorded Today',
    kpiVsAvg: '+14% vs. weekly average',
    kpiTurnaround: 'Average Turnaround Time',
    kpiTurnover: 'Turnaround: 2.8 visits / bay',
    kpiOccupancyRate: 'Current Occupancy Rate',
    kpiZoneLabel: 'Medium-High Load Zone',
    kpiNextPeak: 'Next Peak Inference',
    kpiProjectionWindow: 'Projection 18:00 - 20:00',
    // Heatmap
    heatmapTitle: 'Weekly Demand Matrix (24x7)',
    heatmapDesc: 'Parking saturation probability across time slots and days',
    heatmapLow: 'Low',
    heatmapPeak: 'Peak (95%+)',
    dayHeader: 'Day',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    slots: ['06:00 - 10:00', '10:00 - 14:00', '14:00 - 18:00', '18:00 - 21:00 (Peak)', '21:00 - 00:00'],
    // Forecaster
    chartTitle: 'Hourly Demand Curve (Today)',
    chartDesc: 'Estimated occupancy projection between 06:00 and 22:00',
    mlBadge: 'ML INFERENCE ENGINE',
    onnxActive: 'ONNX Runtime Active',
    mlTitle: 'Imminent Saturation Prediction',
    probTitle: 'Critical Peak Probability',
    probWindow: 'Estimated window: Today 18:00 - 20:30',
    algoLabel: 'Algorithm:',
    latencyLabel: 'Inference Latency:',
    driftLabel: 'Drift (PSI):',
    recTitle: 'Recommended Gatehouse Action:',
    recText: 'Prioritize visitor pre-authorization for Tower 1 and maintain deceleration bay clear.',
    // Feed
    feedTitle: 'Real-Time Event Feed',
    busActive: 'Inter-MFE Bus: Active',
    entryPrefix: 'Entry:',
    checkoutPrefix: 'Checkout completed'
  }
};

export const useAnalyticsStore = defineStore('analytics', () => {
  // Language State
  const currentLang = ref<SupportedLang>('es');
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('domonow-lang');
    if (saved === 'es' || saved === 'en') {
      currentLang.value = saved;
    }
  }

  const t = computed(() => vueDictionaries[currentLang.value]);

  function setLanguage(lang: SupportedLang) {
    if (lang === 'es' || lang === 'en') {
      currentLang.value = lang;
      localStorage.setItem('domonow-lang', lang);
    }
  }

  // Reactive Metrics State
  const totalVisitsToday = ref(47);
  const averageTurnaroundMinutes = ref(84); // 1h 24m
  const currentOccupancyRate = ref(68);
  const predictedNextHourSurge = ref(88);
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

  // Hourly demand curve
  const hourlyDemand = ref([
    { hour: '06:00', rate: 15 },
    { hour: '08:00', rate: 45 },
    { hour: '10:00', rate: 60 },
    { hour: '12:00', rate: 75 },
    { hour: '14:00', rate: 55 },
    { hour: '16:00', rate: 70 },
    { hour: '18:00', rate: 92 },
    { hour: '20:00', rate: 85 },
    { hour: '22:00', rate: 40 }
  ]);

  // Heatmap matrix raw slots (7 days x 5 slots)
  const heatmapRows = ref([
    { slots: [25, 45, 60, 85, 40] },
    { slots: [30, 50, 65, 80, 45] },
    { slots: [28, 48, 70, 88, 50] },
    { slots: [35, 55, 75, 92, 60] },
    { slots: [40, 65, 85, 96, 75] },
    { slots: [50, 75, 90, 85, 65] },
    { slots: [45, 60, 70, 65, 35] }
  ]);

  // Attach window event listeners for decoupled cross-MFE communication & i18n
  function initCrossMfeListener() {
    if (isListenerAttached.value || typeof window === 'undefined') return;

    // 1. Language change from custom event
    window.addEventListener('domonow:lang-changed', (e: any) => {
      if (e.detail?.lang) {
        setLanguage(e.detail.lang);
      }
    });

    // 2. Language change from postMessage (iframe parent)
    window.addEventListener('message', (e: any) => {
      if (e.data?.type === 'domonow:lang-changed' && e.data.lang) {
        setLanguage(e.data.lang);
      }
    });

    // 3. Operational events
    window.addEventListener('domonow:spot-assigned', (e: any) => {
      const detail = e.detail;
      totalVisitsToday.value++;
      const isEn = currentLang.value === 'en';
      activities.value.unshift({
        id: crypto.randomUUID(),
        type: 'ASSIGNMENT',
        spotNumber: detail.spotNumber,
        licensePlate: detail.licensePlate,
        details: `${isEn ? 'Entry:' : 'Ingreso:'} ${detail.visitorName || (isEn ? 'Visitor' : 'Visitante')} (${detail.destinationUnit || 'Unit'})`,
        timestamp: detail.entryTime || new Date().toISOString()
      });
      if (activities.value.length > 20) activities.value.pop();
    });

    window.addEventListener('domonow:spot-released', (e: any) => {
      const detail = e.detail;
      const isEn = currentLang.value === 'en';
      activities.value.unshift({
        id: crypto.randomUUID(),
        type: 'CHECKOUT',
        spotNumber: detail.spotNumber,
        licensePlate: detail.licensePlate,
        details: `${isEn ? 'Departure completed' : 'Salida completada'} (${detail.durationMinutes || 30} min)`,
        timestamp: detail.exitTime || new Date().toISOString()
      });
      if (activities.value.length > 20) activities.value.pop();
    });

    isListenerAttached.value = true;
  }

  return {
    currentLang,
    t,
    setLanguage,
    totalVisitsToday,
    averageTurnaroundMinutes,
    currentOccupancyRate,
    predictedNextHourSurge,
    activities,
    hourlyDemand,
    heatmapRows,
    initCrossMfeListener
  };
});
