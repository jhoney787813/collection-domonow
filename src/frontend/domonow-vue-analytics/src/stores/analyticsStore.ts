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

export interface ActiveAssignmentDto {
  id: string;
  parkingSpotId: string;
  spotNumber: string;
  licensePlate: string;
  visitorName: string;
  destinationUnit: string;
  entryTime: string;
  elapsedMinutes: number;
}

export interface DialogData {
  title: string;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  statusCode?: number | string;
  detail?: string;
  confirmText?: string;
  onConfirm?: () => void;
}

const vueDictionaries = {
  es: {
    brandSub: 'ANALÍTICA PREDICTIVA & MACHINE LEARNING',
    title: 'Demanda y Turnaround de Visitantes',
    subtitle: 'Modelos de probabilidad de ocupación, rotación de bahías y previsión de picos',
    dateRange: '📅 Datos en Tiempo Real (API .NET 10)',
    kpiVisitsToday: 'Asignaciones Activas en BD',
    kpiVsAvg: 'Sincronizado vía PostgreSQL',
    kpiTurnaround: 'Tiempo Promedio de Estadía',
    kpiTurnover: 'Cálculo dinámico en vivo',
    kpiOccupancyRate: 'Tasa de Ocupación Real',
    kpiZoneLabel: 'Capacidad en Vivo',
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
    dateRange: '📅 Real-Time Data (.NET 10 API)',
    kpiVisitsToday: 'Active Assignments in DB',
    kpiVsAvg: 'Synced via PostgreSQL',
    kpiTurnaround: 'Average Turnaround Time',
    kpiTurnover: 'Live Dynamic Calculation',
    kpiOccupancyRate: 'Real Occupancy Rate',
    kpiZoneLabel: 'Live Capacity',
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
  const API_BASE = 'http://localhost:5050/api';

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
  const totalVisitsToday = ref(0);
  const averageTurnaroundMinutes = ref(0);
  const currentOccupancyRate = ref(0);
  const predictedNextHourSurge = ref(88);
  const isListenerAttached = ref(false);

  // Active Assignments from API
  const activeAssignments = ref<ActiveAssignmentDto[]>([]);
  const isLoadingAssignments = ref(false);
  const apiError = ref<{ title: string; message: string; detail?: string; statusCode?: number } | null>(null);

  // Dialog State
  const activeDialog = ref<DialogData | null>(null);

  function openDialog(data: DialogData) {
    activeDialog.value = data;
  }

  function closeDialog() {
    activeDialog.value = null;
  }

  const activities = ref<ActivityEvent[]>([]);

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

  /**
   * Fetch Active Assignments and Spot Capacity from .NET 10 API
   */
  async function fetchAnalyticsData() {
    isLoadingAssignments.value = true;
    apiError.value = null;
    try {
      const [resAssignments, resSpots] = await Promise.all([
        fetch(`${API_BASE}/parking-assignments/active`),
        fetch(`${API_BASE}/parking-spots`)
      ]);

      if (!resAssignments.ok) {
        throw new Error(`Assignments API error: HTTP ${resAssignments.status}`);
      }
      if (!resSpots.ok) {
        throw new Error(`Spots API error: HTTP ${resSpots.status}`);
      }

      const assignmentsData: ActiveAssignmentDto[] = await resAssignments.json();
      const spotsData: any[] = await resSpots.json();

      activeAssignments.value = assignmentsData;
      totalVisitsToday.value = assignmentsData.length;

      // Calculate Occupancy %
      const totalCapacity = spotsData.length || 30;
      const occupiedCount = spotsData.filter((s: any) => s.status === 2 || s.statusName === 'Occupied').length;
      currentOccupancyRate.value = Math.round((occupiedCount / totalCapacity) * 100);

      // Calculate Average Turnaround (Stay time)
      if (assignmentsData.length > 0) {
        const totalMinutes = assignmentsData.reduce((acc, curr) => acc + (curr.elapsedMinutes || 0), 0);
        averageTurnaroundMinutes.value = Math.round(totalMinutes / assignmentsData.length);
      } else {
        averageTurnaroundMinutes.value = 0;
      }

      // Populate recent activities if empty
      if (activities.value.length === 0 && assignmentsData.length > 0) {
        activities.value = assignmentsData.slice(0, 5).map(a => ({
          id: a.id,
          type: 'ASSIGNMENT',
          spotNumber: a.spotNumber,
          licensePlate: a.licensePlate,
          details: `Ingreso: ${a.visitorName} (${a.destinationUnit})`,
          timestamp: a.entryTime
        }));
      }

      apiError.value = null;
    } catch (err: any) {
      console.error('[AnalyticsStore] Failed to fetch live data:', err);
      activeAssignments.value = [];
      apiError.value = {
        title: 'Error de Comunicación con API .NET 10',
        message: 'No fue posible sincronizar las asignaciones activas ni las métricas desde el servidor.',
        detail: err.message || 'Verifique que el backend esté accesible en http://localhost:5050/api.',
        statusCode: 500
      };
    } finally {
      isLoadingAssignments.value = false;
    }
  }

  // Attach window event listeners for decoupled cross-MFE communication & i18n
  function initCrossMfeListener() {
    if (isListenerAttached.value || typeof window !== 'undefined') {
      fetchAnalyticsData();
    }

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

    // 3. Operational events dispatched by Angular MFE
    window.addEventListener('domonow:spot-assigned', (e: any) => {
      const detail = e.detail;
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

      // Automatically refresh live data from .NET 10 API
      fetchAnalyticsData();
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

      // Automatically refresh live data from .NET 10 API
      fetchAnalyticsData();
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
    activeAssignments,
    isLoadingAssignments,
    apiError,
    activeDialog,
    openDialog,
    closeDialog,
    activities,
    hourlyDemand,
    heatmapRows,
    fetchAnalyticsData,
    initCrossMfeListener
  };
});
