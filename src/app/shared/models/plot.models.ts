// ========================================
// PLOT MODELS
// Modelos para gestión de lotes de cultivo
// ========================================

export interface PlotEntity {
  id?: string;
  farm_id: string; // Obligatorio: lotes pertenecen a una finca específica
  name: string;
  code?: string;
  area: number; // Área en hectáreas
  crop_type?: string; // Tipo de cultivo principal
  variety_id?: string; // Variedad específica del cultivo (opcional)
  planting_date?: string; // ISO date string - fecha de siembra
  last_renovation_date?: string; // ISO date string - fecha de última renovación
  status: PlotStatus;
  soil_type?: string; // Tipo de suelo (arcilloso, arenoso, franco, etc.)
  slope_percentage?: number; // Porcentaje de pendiente (0-100)
  irrigation_system?: string; // Sistema de riego (goteo, aspersión, natural, etc.)
  altitude?: number; // Altitud en metros sobre el nivel del mar
  coordinates?: PlotCoordinates; // JSONB field para coordenadas del polígono
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ========================================
// REQUEST INTERFACES
// ========================================

export interface CreatePlotRequest {
  farm_id: string;
  name: string;
  code?: string;
  area: number;
  crop_type?: string;
  variety_id?: string;
  planting_date?: string;
  last_renovation_date?: string;
  status: PlotStatus;
  soil_type?: string;
  slope_percentage?: number;
  irrigation_system?: string;
  altitude?: number;
  coordinates?: PlotCoordinates;
  notes?: string;
  is_active?: boolean;
}

export interface UpdatePlotRequest {
  id: string;
  farm_id: string;
  name: string;
  code?: string;
  area: number;
  crop_type?: string;
  variety_id?: string;
  planting_date?: string;
  last_renovation_date?: string;
  status: PlotStatus;
  soil_type?: string;
  slope_percentage?: number;
  irrigation_system?: string;
  altitude?: number;
  coordinates?: PlotCoordinates;
  notes?: string;
  is_active?: boolean;
}

// ========================================
// RESPONSE INTERFACES
// ========================================

export interface PlotListResponse {
  data: PlotEntity[];
  error?: {
    message: string;
    code?: string;
  };
}

export interface PlotResponse {
  data?: PlotEntity;
  error?: {
    message: string;
    code?: string;
  };
}

// ========================================
// TYPES AND ENUMS
// ========================================

export type PlotStatus = 
  | 'active'
  | 'preparation'
  | 'renovation'
  | 'resting'
  | 'abandoned';

export interface PlotCoordinates {
  type: 'Polygon';
  coordinates: number[][][]; // Array de arrays de [longitude, latitude]
}

// ========================================
// CONSTANTS AND OPTIONS
// ========================================

export const PLOT_STATUS_OPTIONS = [
  { value: 'active', label: 'Activo/Productivo', color: '#10b981', icon: 'eco' },
  { value: 'preparation', label: 'En Preparación', color: '#f59e0b', icon: 'construction' },
  { value: 'renovation', label: 'En Renovación', color: '#3b82f6', icon: 'build' },
  { value: 'resting', label: 'En Descanso', color: '#6b7280', icon: 'pause_circle' },
  { value: 'abandoned', label: 'Abandonado', color: '#ef4444', icon: 'warning' }
] as const;

export const CROP_TYPE_OPTIONS = [
  { value: 'coffee', label: 'Café' },
  { value: 'avocado', label: 'Aguacate' },
  { value: 'cocoa', label: 'Cacao' },
  { value: 'banana', label: 'Plátano' },
  { value: 'citrus', label: 'Cítricos' },
  { value: 'vegetables', label: 'Hortalizas' },
  { value: 'grains', label: 'Granos' },
  { value: 'other', label: 'Otro' }
] as const;

export const SOIL_TYPE_OPTIONS = [
  { value: 'clay', label: 'Arcilloso' },
  { value: 'sandy', label: 'Arenoso' },
  { value: 'loam', label: 'Franco' },
  { value: 'sandy_loam', label: 'Franco Arenoso' },
  { value: 'clay_loam', label: 'Franco Arcilloso' },
  { value: 'silt', label: 'Limoso' },
  { value: 'rocky', label: 'Rocoso' },
  { value: 'mixed', label: 'Mixto' }
] as const;

export const IRRIGATION_SYSTEM_OPTIONS = [
  { value: 'drip', label: 'Goteo' },
  { value: 'sprinkler', label: 'Aspersión' },
  { value: 'flood', label: 'Inundación' },
  { value: 'manual', label: 'Manual' },
  { value: 'rain_fed', label: 'Dependiente de lluvia' },
  { value: 'mixed', label: 'Mixto' }
] as const;

// ========================================
// CONSTRAINTS
// ========================================

export const PLOT_CONSTRAINTS = {
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZÀ-ÿ0-9\s\-._]+$/
  },
  description: {
    maxLength: 500
  },
  area: {
    min: 0.01, // Mínimo 10 metros cuadrados
    max: 10000 // Máximo 10,000 hectáreas
  },
  slope: {
    min: 0,
    max: 100
  },
  notes: {
    maxLength: 1000
  }
} as const; 