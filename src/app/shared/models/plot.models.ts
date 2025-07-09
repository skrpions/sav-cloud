// ========================================
// PLOT MODELS
// Modelos para gestión de lotes de cultivo
// ========================================

export interface PlotEntity {
  id?: string;
  farm_id: string; // Obligatorio: lotes pertenecen a una finca específica
  name: string;
  description?: string;
  area: number; // Área en hectáreas
  crop_type?: string; // Tipo de cultivo principal
  planting_date?: string; // ISO date string - fecha de siembra
  expected_harvest_date?: string; // ISO date string - fecha estimada de cosecha
  status: PlotStatus;
  soil_type?: string; // Tipo de suelo (arcilloso, arenoso, franco, etc.)
  slope_percentage?: number; // Porcentaje de pendiente (0-100)
  irrigation_type?: string; // Tipo de riego (goteo, aspersión, natural, etc.)
  coordinates?: PlotCoordinates; // JSONB field para coordenadas del polígono
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PlotCoordinates {
  type: 'Polygon';
  coordinates: number[][][]; // GeoJSON format for polygon
}

export interface CreatePlotRequest {
  farm_id: string;
  name: string;
  description?: string;
  area: number;
  crop_type?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  status: PlotStatus;
  soil_type?: string;
  slope_percentage?: number;
  irrigation_type?: string;
  coordinates?: PlotCoordinates;
  notes?: string;
}

export interface UpdatePlotRequest extends CreatePlotRequest {
  id: string;
  is_active?: boolean;
}

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
  | 'preparation' 
  | 'planted' 
  | 'growing' 
  | 'ready_harvest' 
  | 'harvested' 
  | 'resting' 
  | 'maintenance';

// ========================================
// CONSTANTS AND OPTIONS
// ========================================

export const PLOT_STATUS_OPTIONS = [
  { value: 'preparation', label: 'Preparación', color: '#f59e0b', icon: 'construction' },
  { value: 'planted', label: 'Sembrado', color: '#10b981', icon: 'eco' },
  { value: 'growing', label: 'Crecimiento', color: '#3b82f6', icon: 'trending_up' },
  { value: 'ready_harvest', label: 'Listo para Cosecha', color: '#f97316', icon: 'agriculture' },
  { value: 'harvested', label: 'Cosechado', color: '#8b5cf6', icon: 'check_circle' },
  { value: 'resting', label: 'En Descanso', color: '#6b7280', icon: 'pause_circle' },
  { value: 'maintenance', label: 'Mantenimiento', color: '#ef4444', icon: 'build' }
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

export const IRRIGATION_TYPE_OPTIONS = [
  { value: 'drip', label: 'Goteo' },
  { value: 'sprinkler', label: 'Aspersión' },
  { value: 'flood', label: 'Inundación' },
  { value: 'natural', label: 'Natural (lluvia)' },
  { value: 'manual', label: 'Manual' },
  { value: 'none', label: 'Sin riego' }
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

// ========================================
// UTILITY FUNCTIONS
// ========================================

export function getPlotStatusConfig(status: PlotStatus) {
  return PLOT_STATUS_OPTIONS.find(option => option.value === status) || PLOT_STATUS_OPTIONS[0];
}

export function formatPlotArea(area?: number): string {
  if (!area || area === 0) return 'Sin especificar';
  
  if (area < 1) {
    // Convertir a metros cuadrados para áreas pequeñas
    const sqMeters = area * 10000;
    return `${sqMeters.toFixed(0)} m²`;
  }
  
  return `${area.toFixed(2)} ha`;
}

export function calculatePlotProductionCycle(plantingDate?: string, expectedHarvestDate?: string): {
  daysSincePlanting?: number;
  daysToHarvest?: number;
  cycleLength?: number;
} {
  if (!plantingDate) return {};
  
  const planted = new Date(plantingDate);
  const today = new Date();
  const daysSincePlanting = Math.floor((today.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  
  if (!expectedHarvestDate) {
    return { daysSincePlanting };
  }
  
  const expectedHarvest = new Date(expectedHarvestDate);
  const daysToHarvest = Math.floor((expectedHarvest.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const cycleLength = Math.floor((expectedHarvest.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    daysSincePlanting,
    daysToHarvest,
    cycleLength
  };
}

export function getPlotHealthScore(plot: PlotEntity): {
  score: number;
  factors: string[];
} {
  let score = 100;
  const factors: string[] = [];
  
  // Verificar fechas
  if (plot.planting_date && plot.expected_harvest_date) {
    const cycle = calculatePlotProductionCycle(plot.planting_date, plot.expected_harvest_date);
    
    if (cycle.daysToHarvest && cycle.daysToHarvest < 0) {
      score -= 20;
      factors.push('Cosecha tardía');
    }
  }
  
  // Verificar pendiente
  if (plot.slope_percentage && plot.slope_percentage > 45) {
    score -= 15;
    factors.push('Pendiente muy pronunciada');
  }
  
  // Verificar área vs tipo de cultivo
  if (plot.area && plot.area < 0.1) {
    score -= 10;
    factors.push('Área muy pequeña');
  }
  
  // Verificar estado
  if (plot.status === 'maintenance') {
    score -= 25;
    factors.push('En mantenimiento');
  }
  
  return {
    score: Math.max(0, score),
    factors
  };
} 