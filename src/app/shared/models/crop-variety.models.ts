// ========================================
// CROP VARIETY MODELS
// Modelos para variedades de cultivos
// ========================================

export interface CropVarietyEntity {
  id?: string;
  crop_type: string; // 'coffee', 'cacao', 'avocado', etc.
  name: string;
  scientific_name?: string;
  description?: string;
  characteristics?: Record<string, unknown>; // JSONB field
  maturation_months?: number; // Meses hasta primera cosecha
  productive_years?: number; // Años productivos
  plants_per_hectare?: number;
  harvest_seasons?: string[]; // Épocas de cosecha
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CropVarietyListResponse {
  data: CropVarietyEntity[];
  error?: {
    message: string;
    code?: string;
  };
}

export interface CropVarietyResponse {
  data?: CropVarietyEntity;
  error?: {
    message: string;
    code?: string;
  };
}

// ========================================
// CROP TYPE OPTIONS
// ========================================

export const CROP_TYPE_VARIETIES: Record<string, boolean> = {
  coffee: true,
  cacao: true,
  avocado: true,
  plantain: true,
  citrus: false,
  vegetables: false,
  grains: false,
  other: false
} as const; 