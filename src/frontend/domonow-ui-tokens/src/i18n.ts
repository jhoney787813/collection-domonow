/**
 * DomoNow PropTech Shared i18n Definitions
 */

export type SupportedLang = 'es' | 'en';

export interface CommonDictionary {
  statuses: {
    available: string;
    occupied: string;
    outOfService: string;
  };
  actions: {
    confirm: string;
    cancel: string;
    save: string;
    close: string;
    checkout: string;
    assign: string;
  };
}

export const commonI18n: Record<SupportedLang, CommonDictionary> = {
  es: {
    statuses: {
      available: 'Disponible',
      occupied: 'Ocupado',
      outOfService: 'Fuera de Servicio'
    },
    actions: {
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      save: 'Guardar',
      close: 'Cerrar',
      checkout: 'Registrar Salida',
      assign: 'Asignar Ingreso'
    }
  },
  en: {
    statuses: {
      available: 'Available',
      occupied: 'Occupied',
      outOfService: 'Out of Service'
    },
    actions: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      close: 'Close',
      checkout: 'Checkout',
      assign: 'Assign Entry'
    }
  }
};
