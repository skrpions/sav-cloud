// Modelos para el módulo de cosechas (harvest)

export interface HarvestEntity {
  id?: string;
  farm_id: string; // Obligatorio: cosechas pertenecen a una finca específica
  collaborator_id: string;
  plot_id?: string; // Opcional: cosecha de lote específico
  variety_id?: string; // Opcional: variedad específica cosechada
  date: string; // ISO date
  start_time?: string; // HH:mm format
  end_time?: string; // HH:mm format
  quantity: number; // Cantidad cosechada (kg, unidades, etc.)
  unit_measure?: string; // kg, units, tons, etc. (default: 'kg')
  quality_grade: QualityGrade;
  price_per_unit: number; // Precio por unidad de medida
  total_payment: number;
  humidity_percentage?: number; // 0-100
  defects_percentage?: number; // 0-100
  area_harvested?: number; // hectares or meters squared
  weather_conditions?: string;
  processing_method?: string; // Lavado, natural, honey, fermentado, etc.
  is_sold?: boolean;
  batch_number?: string; // Número de lote para trazabilidad
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateHarvestRequest {
  farm_id: string;
  collaborator_id: string;
  plot_id?: string;
  variety_id?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  quantity: number;
  unit_measure?: string;
  quality_grade: QualityGrade;
  price_per_unit: number;
  total_payment: number;
  humidity_percentage?: number;
  defects_percentage?: number;
  area_harvested?: number;
  weather_conditions?: string;
  processing_method?: string;
  batch_number?: string;
  notes?: string;
}

export interface UpdateHarvestRequest extends CreateHarvestRequest {
  id: string;
  is_sold?: boolean;
}

export interface HarvestListResponse {
  data: HarvestEntity[];
  error?: {
    message: string;
    code?: string;
  };
}

export interface HarvestResponse {
  data?: HarvestEntity;
  error?: {
    message: string;
    code?: string;
  };
}

// Tipos de calidad del cultivo
export type QualityGrade = 'premium' | 'standard' | 'low';

// Opciones para el select de calidad
export const QUALITY_GRADE_OPTIONS = [
  { value: 'premium', labelKey: 'harvest.qualityGrades.premium', color: '#4caf50' },
  { value: 'standard', labelKey: 'harvest.qualityGrades.standard', color: '#ff9800' },
  { value: 'low', labelKey: 'harvest.qualityGrades.low', color: '#f44336' }
] as const;

// Condiciones climáticas predefinidas
export const WEATHER_CONDITIONS_OPTIONS = [
  { value: 'sunny', labelKey: 'harvest.weather.sunny' },
  { value: 'cloudy', labelKey: 'harvest.weather.cloudy' },
  { value: 'rainy', labelKey: 'harvest.weather.rainy' },
  { value: 'windy', labelKey: 'harvest.weather.windy' },
  { value: 'humid', labelKey: 'harvest.weather.humid' },
  { value: 'dry', labelKey: 'harvest.weather.dry' }
] as const;

// Métodos de procesamiento (principalmente para café)
export const PROCESSING_METHOD_OPTIONS = [
  { value: 'washed', labelKey: 'harvest.processing.washed' },
  { value: 'natural', labelKey: 'harvest.processing.natural' },
  { value: 'honey', labelKey: 'harvest.processing.honey' },
  { value: 'fermented', labelKey: 'harvest.processing.fermented' },
  { value: 'other', labelKey: 'harvest.processing.other' }
] as const;

// Unidades de medida
export const UNIT_MEASURE_OPTIONS = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'units', label: 'Unidades' },
  { value: 'tons', label: 'Toneladas' },
  { value: 'pounds', label: 'Libras' }
] as const;

// Helper function para obtener el color de la calidad
export function getQualityGradeColor(grade: QualityGrade): string {
  const gradeOption = QUALITY_GRADE_OPTIONS.find(option => option.value === grade);
  return gradeOption?.color || '#9e9e9e';
}

// Helper function para obtener el label de la calidad
export function getQualityGradeLabel(grade: QualityGrade): string {
  const labels = {
    premium: 'Premium',
    standard: 'Estándar',
    low: 'Baja'
  };
  return labels[grade] || grade;
} 