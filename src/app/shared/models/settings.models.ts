// Modelos para el módulo de farm settings (configuraciones por finca)

export interface FarmSettingsEntity {
  id?: string;
  farm_id: string; // Obligatorio: configuraciones pertenecen a una finca específica
  year: number;
  currency: string; // Default: 'COP'
  tax_percentage: number; // Porcentaje de impuestos
  crop_prices: Record<string, CropPriceConfig>; // JSONB: precios por tipo de cultivo
  daily_rate_libre: number; // Tarifa diaria para contrato libre (incluye comida)
  daily_rate_grabado: number; // Tarifa diaria para contrato grabado (solo pago)
  activity_rates?: Record<string, number>; // JSONB: tarifas por actividad específica
  quality_premiums?: Record<string, number>; // JSONB: premios por calidad
  is_active?: boolean; // Solo una configuración activa por finca/año
  created_at?: string;
  updated_at?: string;
}

// Configuración de precios por cultivo
export interface CropPriceConfig {
  price_per_kg?: number; // Para cultivos que se miden en kg (café, cacao)
  price_per_unit?: number; // Para cultivos que se miden en unidades (aguacate)
  unit: 'kg' | 'units' | 'tons' | 'pounds'; // Unidad de medida
}

export interface CreateFarmSettingsRequest {
  farm_id: string;
  year: number;
  currency: string;
  tax_percentage: number;
  crop_prices: Record<string, CropPriceConfig>;
  daily_rate_libre: number;
  daily_rate_grabado: number;
  activity_rates?: Record<string, number>;
  quality_premiums?: Record<string, number>;
}

export interface UpdateFarmSettingsRequest extends CreateFarmSettingsRequest {
  id: string;
  is_active?: boolean;
}

export interface FarmSettingsListResponse {
  data: FarmSettingsEntity[];
  error?: {
    message: string;
    code?: string;
  };
}

export interface FarmSettingsResponse {
  data?: FarmSettingsEntity;
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
  | 'harvesting'
  | 'soil_preparation'
  | 'pest_control'
  | 'irrigation'
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
    key: 'fertilization', 
    labelKey: 'settings.activities.fertilization',
    icon: 'eco'
  },
  { 
    key: 'fumigation', 
    labelKey: 'settings.activities.fumigation',
    icon: 'pest_control'
  },
  { 
    key: 'pruning', 
    labelKey: 'settings.activities.pruning',
    icon: 'content_cut'
  },
  { 
    key: 'weeding', 
    labelKey: 'settings.activities.weeding',
    icon: 'grass'
  },
  { 
    key: 'planting', 
    labelKey: 'settings.activities.planting',
    icon: 'local_florist'
  },
  { 
    key: 'maintenance', 
    labelKey: 'settings.activities.maintenance',
    icon: 'build'
  },
  { 
    key: 'other', 
    labelKey: 'settings.activities.other',
    icon: 'more_horiz'
  }
] as const;

// Configuración de tipos de cultivo para precios
export const CROP_TYPES_CONFIG = [
  {
    key: 'coffee',
    labelKey: 'settings.crops.coffee',
    defaultUnit: 'kg' as const,
    icon: 'local_cafe'
  },
  {
    key: 'cacao',
    labelKey: 'settings.crops.cacao',
    defaultUnit: 'kg' as const,
    icon: 'cake'
  },
  {
    key: 'avocado',
    labelKey: 'settings.crops.avocado',
    defaultUnit: 'units' as const,
    icon: 'eco'
  },
  {
    key: 'plantain',
    labelKey: 'settings.crops.plantain',
    defaultUnit: 'units' as const,
    icon: 'agriculture'
  }
] as const;

// Configuración de premios por calidad
export const QUALITY_PREMIUMS_CONFIG = [
  {
    key: 'premium',
    labelKey: 'settings.quality.premium',
    description: 'Bono por calidad premium'
  },
  {
    key: 'standard',
    labelKey: 'settings.quality.standard',
    description: 'Precio base estándar'
  },
  {
    key: 'low',
    labelKey: 'settings.quality.low',
    description: 'Descuento por calidad baja'
  }
] as const;

// Backward compatibility aliases
export type SettingsEntity = FarmSettingsEntity;
export type CreateSettingsRequest = CreateFarmSettingsRequest;
export type UpdateSettingsRequest = UpdateFarmSettingsRequest;
export type SettingsListResponse = FarmSettingsListResponse;
export type SettingsResponse = FarmSettingsResponse;
