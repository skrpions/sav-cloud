// Modelos para el módulo de colaboradores

// Nuevos tipos para información bancaria avanzada
export type BankType = 'bancolombia' | 'nequi' | 'daviplata' | 'banco_bogota' | 'banco_popular' | 'bbva' | 'scotiabank' | 'otro';

export type BancolombiaProductType = 'ahorros' | 'corriente' | 'bancolombia_a_la_mano';
export type GenericProductType = 'ahorros' | 'corriente';

// Información bancaria como tabla separada
export interface BankingInfo {
  id?: string;
  bank: BankType;
  product_type: BancolombiaProductType | GenericProductType;
  account_number: string;
  // Para Nequi: si usa el mismo número del teléfono
  use_phone_number?: boolean; // Solo para Nequi
  created_at?: string;
  updated_at?: string;
}

export interface CollaboratorEntity {
  id?: string;
  farm_id: string; // Obligatorio: colaboradores pertenecen a una finca específica
  first_name: string;
  last_name: string;
  identification: string;
  phone: string;
  address: string;
  email: string;
  birth_date: string; // ISO date string
  hire_date: string; // ISO date string
  contract_type: ContractType;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  banking_info_id?: string; // Foreign key a tabla banking_info (opcional)
  banking_info?: BankingInfo; // Información bancaria (para responses con join)
  specializations?: Record<string, boolean>; // JSONB field para especializaciones
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCollaboratorRequest {
  farm_id: string;
  first_name: string;
  last_name: string;
  identification: string;
  phone: string;
  address: string;
  email: string;
  birth_date: string;
  hire_date: string;
  contract_type: ContractType;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  banking_info?: BankingInfo; // Opcional: se creará en tabla separada si se proporciona
  specializations?: Record<string, boolean>;
  notes?: string;
}

export interface UpdateCollaboratorRequest extends CreateCollaboratorRequest {
  id: string;
  is_active?: boolean;
}

export type ContractType = 'libre' | 'grabado';

export interface CollaboratorListResponse {
  data: CollaboratorEntity[];
  error?: {
    message: string;
    code?: string;
  };
}

export interface CollaboratorResponse {
  data?: CollaboratorEntity;
  error?: {
    message: string;
    code?: string;
  };
}

// Opciones para el select de tipo de contrato
export const CONTRACT_TYPE_OPTIONS = [
  { value: 'libre', labelKey: 'collaborators.contractTypes.libre' },
  { value: 'grabado', labelKey: 'collaborators.contractTypes.grabado' }
] as const;

// Opciones para bancos
export const BANK_OPTIONS = [
  { value: 'bancolombia', label: 'Bancolombia' },
  { value: 'nequi', label: 'Nequi' },
  { value: 'daviplata', label: 'Daviplata' },
  { value: 'banco_bogota', label: 'Banco de Bogotá' },
  { value: 'banco_popular', label: 'Banco Popular' },
  { value: 'bbva', label: 'BBVA' },
  { value: 'scotiabank', label: 'Scotiabank' },
  { value: 'otro', label: 'Otro banco' }
] as const;

// Opciones para tipos de producto de Bancolombia
export const BANCOLOMBIA_PRODUCT_OPTIONS = [
  { value: 'ahorros', label: 'Cuenta de Ahorros' },
  { value: 'corriente', label: 'Cuenta Corriente' },
  { value: 'bancolombia_a_la_mano', label: 'Bancolombia a la mano' }
] as const;

// Opciones para tipos de producto genéricos
export const GENERIC_PRODUCT_OPTIONS = [
  { value: 'ahorros', label: 'Cuenta de Ahorros' },
  { value: 'corriente', label: 'Cuenta Corriente' }
] as const; 