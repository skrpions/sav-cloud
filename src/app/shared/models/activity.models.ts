// Modelos para el módulo de actividades

export interface ActivityEntity {
  id?: string;
  farm_id: string; // Obligatorio: actividades pertenecen a una finca específica
  collaborator_id: string;
  plot_id?: string; // Opcional: actividad en lote específico
  type: ActivityType;
  date: string; // ISO date
  days: number;
  area_worked?: number;
  payment_type: ContractType;
  rate_per_day: number;
  total_cost: number;
  materials_used?: string;
  weather_conditions?: string;
  quality_rating?: number; // 1-5 scale
  supervisor_id?: string; // Referencia a otro colaborador
  equipment_used?: Record<string, unknown>; // JSONB field para equipos utilizados
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateActivityRequest {
  farm_id: string;
  collaborator_id: string;
  plot_id?: string;
  type: ActivityType;
  date: string;
  days: number;
  area_worked?: number;
  payment_type: ContractType;
  rate_per_day: number;
  total_cost: number;
  materials_used?: string;
  weather_conditions?: string;
  quality_rating?: number;
  supervisor_id?: string;
  equipment_used?: Record<string, unknown>;
  notes?: string;
}

export interface UpdateActivityRequest extends CreateActivityRequest {
  id: string;
}

export interface ActivityListResponse {
  data: ActivityEntity[];
  error?: {
    message: string;
    code?: string;
  };
}

export interface ActivityResponse {
  data?: ActivityEntity;
  error?: {
    message: string;
    code?: string;
  };
}

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

export type ContractType = 'libre' | 'grabado';

// Opciones para el select de tipo de actividad
export const ACTIVITY_TYPE_OPTIONS = [
  { value: 'fertilization', labelKey: 'activities.types.fertilization', icon: 'eco' },
  { value: 'fumigation', labelKey: 'activities.types.fumigation', icon: 'pest_control' },
  { value: 'pruning', labelKey: 'activities.types.pruning', icon: 'content_cut' },
  { value: 'weeding', labelKey: 'activities.types.weeding', icon: 'grass' },
  { value: 'planting', labelKey: 'activities.types.planting', icon: 'local_florist' },
  { value: 'maintenance', labelKey: 'activities.types.maintenance', icon: 'build' },
  { value: 'harvesting', labelKey: 'activities.types.harvesting', icon: 'agriculture' },
  { value: 'soil_preparation', labelKey: 'activities.types.soil_preparation', icon: 'landscape' },
  { value: 'pest_control', labelKey: 'activities.types.pest_control', icon: 'bug_report' },
  { value: 'irrigation', labelKey: 'activities.types.irrigation', icon: 'water_drop' },
  { value: 'other', labelKey: 'activities.types.other', icon: 'more_horiz' }
] as const; 