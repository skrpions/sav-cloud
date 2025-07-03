// Modelos para el módulo de actividades

export interface ActivityEntity {
  id?: string;
  collaborator_id: string;
  type: ActivityType;
  date: string; // ISO date
  start_time?: string; // HH:mm
  end_time?: string; // HH:mm
  days: number;
  area_worked?: number;
  payment_type: ContractType;
  rate_per_day: number;
  total_cost: number;
  materials_used?: string;
  weather_conditions?: string;
  quality_rating?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateActivityRequest {
  collaborator_id: string;
  type: ActivityType;
  date: string;
  start_time?: string;
  end_time?: string;
  days: number;
  area_worked?: number;
  payment_type: ContractType;
  rate_per_day: number;
  total_cost: number;
  materials_used?: string;
  weather_conditions?: string;
  quality_rating?: number;
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
  | 'other';

export type ContractType = 'libre' | 'grabado'; 