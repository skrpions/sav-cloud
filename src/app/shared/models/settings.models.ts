// Modelos para el módulo de settings

export interface SettingsEntity {
  id?: string;
  year: number;
  harvest_price_per_kilogram: number;
  daily_rate_libre: number;
  daily_rate_grabado: number;
  activity_rate_fertilization?: number;
  activity_rate_fumigation?: number;
  activity_rate_pruning?: number;
  activity_rate_weeding?: number;
  activity_rate_planting?: number;
  activity_rate_maintenance?: number;
  activity_rate_other?: number;
  currency: string;
  tax_percentage: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSettingsRequest {
  year: number;
  harvest_price_per_kilogram: number;
  daily_rate_libre: number;
  daily_rate_grabado: number;
  activity_rate_fertilization?: number;
  activity_rate_fumigation?: number;
  activity_rate_pruning?: number;
  activity_rate_weeding?: number;
  activity_rate_planting?: number;
  activity_rate_maintenance?: number;
  activity_rate_other?: number;
  currency: string;
  tax_percentage: number;
}

export interface UpdateSettingsRequest extends CreateSettingsRequest {
  id: string;
  is_active?: boolean;
}

export interface SettingsListResponse {
  data: SettingsEntity[];
  error?: {
    message: string;
    code?: string;
  };
}

export interface SettingsResponse {
  data?: SettingsEntity;
  error?: {
    message: string;
    code?: string;
  };
}

// Tipos de actividad para las tarifas
export type ActivityType = 
  | 'fertilization'
  | 'fumigation'
  | 'pruning'
  | 'weeding'
  | 'planting'
  | 'maintenance'
  | 'other';

// Tipos de contrato
export type ContractType = 'libre' | 'grabado';

// Opciones de moneda
export const CURRENCY_OPTIONS = [
  { value: 'COP', label: 'Peso Colombiano (COP)' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' }
] as const;

// Configuración de actividades para el formulario
export const ACTIVITY_RATES_CONFIG = [
  { 
    key: 'activity_rate_fertilization' as keyof SettingsEntity, 
    labelKey: 'settings.activities.fertilization',
    icon: 'eco'
  },
  { 
    key: 'activity_rate_fumigation' as keyof SettingsEntity, 
    labelKey: 'settings.activities.fumigation',
    icon: 'pest_control'
  },
  { 
    key: 'activity_rate_pruning' as keyof SettingsEntity, 
    labelKey: 'settings.activities.pruning',
    icon: 'content_cut'
  },
  { 
    key: 'activity_rate_weeding' as keyof SettingsEntity, 
    labelKey: 'settings.activities.weeding',
    icon: 'grass'
  },
  { 
    key: 'activity_rate_planting' as keyof SettingsEntity, 
    labelKey: 'settings.activities.planting',
    icon: 'local_florist'
  },
  { 
    key: 'activity_rate_maintenance' as keyof SettingsEntity, 
    labelKey: 'settings.activities.maintenance',
    icon: 'build'
  },
  { 
    key: 'activity_rate_other' as keyof SettingsEntity, 
    labelKey: 'settings.activities.other',
    icon: 'more_horiz'
  }
] as const;
