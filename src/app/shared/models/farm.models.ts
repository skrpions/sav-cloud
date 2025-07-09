// Modelos para el módulo de fincas (farms)

export interface FarmEntity {
  id?: string;
  owner_id: string; // ID del propietario de la finca
  name: string;
  description?: string;
  address?: string;
  municipality?: string;
  department?: string;
  country?: string;
  total_area?: number; // Hectáreas totales
  altitude_min?: number; // Metros sobre el nivel del mar mínimo
  altitude_max?: number; // Metros sobre el nivel del mar máximo
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  established_date?: string; // ISO date string
  certifications?: Record<string, boolean>; // JSONB field {organic: true, fair_trade: false, etc.}
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFarmRequest {
  name: string;
  description?: string;
  address?: string;
  municipality?: string;
  department?: string;
  country?: string;
  total_area?: number;
  altitude_min?: number;
  altitude_max?: number;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  established_date?: string;
  certifications?: Record<string, boolean>;
}

export interface UpdateFarmRequest extends CreateFarmRequest {
  id: string;
  is_active?: boolean;
}

export interface FarmListResponse {
  data: FarmEntity[];
  error?: {
    message: string;
    code?: string;
  };
}

export interface FarmResponse {
  data?: FarmEntity;
  error?: {
    message: string;
    code?: string;
  };
}

// Opciones para departamentos de Colombia (los más comunes en caficultura)
export const DEPARTMENT_OPTIONS = [
  { value: 'Antioquia', label: 'Antioquia' },
  { value: 'Caldas', label: 'Caldas' },
  { value: 'Quindío', label: 'Quindío' },
  { value: 'Risaralda', label: 'Risaralda' },
  { value: 'Valle del Cauca', label: 'Valle del Cauca' },
  { value: 'Cauca', label: 'Cauca' },
  { value: 'Huila', label: 'Huila' },
  { value: 'Tolima', label: 'Tolima' },
  { value: 'Cundinamarca', label: 'Cundinamarca' },
  { value: 'Boyacá', label: 'Boyacá' },
  { value: 'Nariño', label: 'Nariño' },
  { value: 'Santander', label: 'Santander' },
  { value: 'Norte de Santander', label: 'Norte de Santander' },
  { value: 'Magdalena', label: 'Magdalena' },
  { value: 'César', label: 'César' },
  { value: 'Otro', label: 'Otro' }
] as const;

// Opciones para certificaciones comunes
export const CERTIFICATION_OPTIONS = [
  { key: 'organic', label: 'Orgánico', description: 'Certificación orgánica' },
  { key: 'specialty_coffee', label: 'Café de Especialidad', description: 'Calidad premium' },
  { key: '4c_association', label: '4C Association', description: 'Código común para la comunidad cafetera' }
] as const;

// Utilidades para validación
export const FARM_CONSTRAINTS = {
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZñÑáéíóúüÁÉÍÓÚÜ0-9\s-_.]+$/
  },
  description: {
    maxLength: 500
  },
  address: {
    maxLength: 200
  },
  municipality: {
    maxLength: 100
  },
  department: {
    maxLength: 100
  },
  totalArea: {
    min: 0.1,
    max: 10000 // 10,000 hectáreas máximo
  },
  altitude: {
    min: 0,
    max: 4000 // 4,000 metros máximo
  },
  coordinates: {
    latitudeMin: -90,
    latitudeMax: 90,
    longitudeMin: -180,
    longitudeMax: 180
  },
  phone: {
    minLength: 10,
    maxLength: 15,
    pattern: /^[+]?[0-9\s-()]+$/
  },
  email: {
    maxLength: 100,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  }
};

// Función para validar coordenadas de Colombia (aproximadas)
export function isValidColombianCoordinates(lat?: number, lng?: number): boolean {
  if (!lat || !lng) return true; // Opcional
  
  // Colombia aproximadamente: Latitud 12°N a -4°S, Longitud -67°W a -82°W
  const colombianBounds = {
    north: 12.5,
    south: -4.2,
    east: -66.8,
    west: -82.0
  };
  
  return (
    lat >= colombianBounds.south && lat <= colombianBounds.north &&
    lng >= colombianBounds.west && lng <= colombianBounds.east
  );
}

// Función para formatear área
export function formatArea(area?: number): string {
  if (!area) return '0 ha';
  
  if (area < 1) {
    return `${(area * 10000).toFixed(0)} m²`;
  } else {
    return `${area.toFixed(2)} ha`;
  }
}

// Función para formatear rango de altitud
export function formatAltitudeRange(min?: number, max?: number): string {
  if (!min && !max) return 'No especificada';
  if (min && !max) return `${min} m.s.n.m.`;
  if (!min && max) return `Hasta ${max} m.s.n.m.`;
  if (min === max) return `${min} m.s.n.m.`;
  return `${min} - ${max} m.s.n.m.`;
} 