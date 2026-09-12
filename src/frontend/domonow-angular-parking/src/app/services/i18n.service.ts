import { Injectable, signal, computed } from '@angular/core';

export type SupportedLang = 'es' | 'en';

export interface AngularTranslations {
  // Header
  brandSub: string;
  title: string;
  subtitle: string;
  concurrencyBtn: string;
  // KPIs
  kpiTotalSpots: string;
  kpiMaxCapacity: string;
  kpiAvailable: string;
  kpiReadyToAssign: string;
  kpiOccupied: string;
  kpiOccupancyRate: string;
  kpiOutOfService: string;
  kpiMaintenance: string;
  // Toolbar
  filterLabel: string;
  filterAll: string;
  // Spot Card
  statusAvailable: string;
  statusOccupied: string;
  statusOutOfService: string;
  freeSpot: string;
  outOfServiceNotice: string;
  assignBtn: string;
  checkoutBtn: string;
  disabledTag: string;
  // Entry Modal
  entryModalTitle: string;
  licensePlateLabel: string;
  licensePlatePlaceholder: string;
  plateValidHint: string;
  plateInvalidHint: string;
  plateHelper: string;
  visitorLabel: string;
  visitorPlaceholder: string;
  unitLabel: string;
  unitPlaceholder: string;
  cancelBtn: string;
  submitEntryBtn: string;
  // Checkout Modal
  checkoutModalTitle: string;
  plateLabel: string;
  visitorNameLabel: string;
  destinationLabel: string;
  entryTimeLabel: string;
  elapsedTimeLabel: string;
  checkoutPolicy: string;
  confirmCheckoutBtn: string;
  // Concurrency message
  concurrencyRunning: string;
  concurrencyResult: string;
}

const dictionaries: Record<SupportedLang, AngularTranslations> = {
  es: {
    brandSub: 'OPERACIONES EN VIVO',
    title: 'Control de Parqueadero de Visitantes',
    subtitle: 'Monitoreo y asignación en tiempo real para portería y guardias de seguridad',
    concurrencyBtn: '⚡ Simular Ráfaga Concurrente (P-15)',
    kpiTotalSpots: 'Total Cupos',
    kpiMaxCapacity: 'Capacidad Máxima',
    kpiAvailable: 'Disponibles',
    kpiReadyToAssign: 'Listos para Asignar',
    kpiOccupied: 'Ocupados',
    kpiOccupancyRate: '% de Ocupación',
    kpiOutOfService: 'Fuera de Servicio',
    kpiMaintenance: 'Mantenimiento',
    filterLabel: 'Filtrar por:',
    filterAll: 'Todos',
    statusAvailable: 'Disponible',
    statusOccupied: 'Ocupado',
    statusOutOfService: 'Fuera de Servicio',
    freeSpot: 'Cupo Libre',
    outOfServiceNotice: 'Mantenimiento / Bloqueado',
    assignBtn: '+ Asignar Ingreso',
    checkoutBtn: 'Registrar Salida',
    disabledTag: 'No disponible',
    entryModalTitle: 'Registrar Ingreso de Visitante',
    licensePlateLabel: 'Placa Vehicular',
    licensePlatePlaceholder: 'Ej. ABC-123 o ABC123',
    plateValidHint: 'Formato Válido',
    plateInvalidHint: '5-8 Caracteres Alfanuméricos',
    plateHelper: 'Normalización automática: mayúsculas sin guiones ni espacios.',
    visitorLabel: 'Nombre del Conductor / Visitante',
    visitorPlaceholder: 'Ej. Juan Pérez',
    unitLabel: 'Unidad de Destino (Apartamento/Casa)',
    unitPlaceholder: 'Ej. Torre 2 - Apt 402',
    cancelBtn: 'Cancelar',
    submitEntryBtn: 'Registrar Asignación',
    checkoutModalTitle: 'Registrar Salida / Checkout',
    plateLabel: 'Placa:',
    visitorNameLabel: 'Visitante:',
    destinationLabel: 'Destino:',
    entryTimeLabel: 'Hora de Ingreso:',
    elapsedTimeLabel: 'Tiempo Transcurrido:',
    checkoutPolicy: 'Al registrar la salida, el cupo volverá a estar automáticamente Disponible para otros visitantes.',
    confirmCheckoutBtn: 'Confirmar Salida y Liberar Cupo',
    concurrencyRunning: 'Simulando 10 peticiones concurrentes simultáneas hacia el cupo P-15...',
    concurrencyResult: 'Resultado de Concurrencia para P-15: ¡1 Asignación Exitosa (201 Created) y 9 Rechazadas por Conflicto (409 Conflict)! Invariante uq_parking_active_assignment preservado.'
  },
  en: {
    brandSub: 'LIVE OPERATIONS',
    title: 'Visitor Parking Management',
    subtitle: 'Real-time allocation and monitoring for gatehouse and security guards',
    concurrencyBtn: '⚡ Simulate Concurrent Burst (P-15)',
    kpiTotalSpots: 'Total Bays',
    kpiMaxCapacity: 'Max Capacity',
    kpiAvailable: 'Available',
    kpiReadyToAssign: 'Ready to Assign',
    kpiOccupied: 'Occupied',
    kpiOccupancyRate: '% Occupancy Rate',
    kpiOutOfService: 'Out of Service',
    kpiMaintenance: 'Under Maintenance',
    filterLabel: 'Filter by:',
    filterAll: 'All',
    statusAvailable: 'Available',
    statusOccupied: 'Occupied',
    statusOutOfService: 'Out of Service',
    freeSpot: 'Available Bay',
    outOfServiceNotice: 'Maintenance / Locked',
    assignBtn: '+ Assign Entry',
    checkoutBtn: 'Register Departure',
    disabledTag: 'Unavailable',
    entryModalTitle: 'Register Visitor Entry',
    licensePlateLabel: 'License Plate',
    licensePlatePlaceholder: 'e.g. ABC-123 or ABC123',
    plateValidHint: 'Valid Format',
    plateInvalidHint: '5-8 Alphanumeric Characters',
    plateHelper: 'Automatic normalization: uppercase with hyphens and spaces removed.',
    visitorLabel: 'Driver / Visitor Name',
    visitorPlaceholder: 'e.g. John Doe',
    unitLabel: 'Destination Unit (Apartment/House)',
    unitPlaceholder: 'e.g. Tower 2 - Apt 402',
    cancelBtn: 'Cancel',
    submitEntryBtn: 'Register Assignment',
    checkoutModalTitle: 'Register Departure / Checkout',
    plateLabel: 'Plate:',
    visitorNameLabel: 'Visitor:',
    destinationLabel: 'Destination:',
    entryTimeLabel: 'Entry Time:',
    elapsedTimeLabel: 'Elapsed Duration:',
    checkoutPolicy: 'Upon registering departure, this bay will automatically be marked Available for other visitors.',
    confirmCheckoutBtn: 'Confirm Departure & Release Bay',
    concurrencyRunning: 'Simulating 10 concurrent requests targeting bay P-15...',
    concurrencyResult: 'Concurrency Result for P-15: 1 Successful Allocation (201 Created) and 9 Rejected as Conflict (409 Conflict)! Invariant uq_parking_active_assignment preserved.'
  }
};

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly _currentLang = signal<SupportedLang>(this.detectInitialLang());

  readonly currentLang = this._currentLang.asReadonly();
  readonly t = computed(() => dictionaries[this._currentLang()]);

  constructor() {
    this.initListeners();
  }

  setLang(lang: SupportedLang): void {
    if (lang !== 'es' && lang !== 'en') return;
    this._currentLang.set(lang);
    localStorage.setItem('domonow-lang', lang);
  }

  private detectInitialLang(): SupportedLang {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('domonow-lang');
      if (stored === 'es' || stored === 'en') return stored;
    }
    return 'es';
  }

  private initListeners(): void {
    if (typeof window === 'undefined') return;

    // 1. Listen to CustomEvent on window
    window.addEventListener('domonow:lang-changed', (e: any) => {
      if (e.detail?.lang) {
        this.setLang(e.detail.lang);
      }
    });

    // 2. Listen to postMessage from parent iframe
    window.addEventListener('message', (e: any) => {
      if (e.data?.type === 'domonow:lang-changed' && e.data.lang) {
        this.setLang(e.data.lang);
      }
    });
  }
}
