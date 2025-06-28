// Modelos para el módulo de colaboradores

export interface CollaboratorEntity {
  id?: string;
  // user_id?: string; // Commented out to avoid policy conflicts
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
  bank_account: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCollaboratorRequest {
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
  bank_account: string;
  notes?: string;
}

export interface UpdateCollaboratorRequest extends CreateCollaboratorRequest {
  id: string;
  is_active?: boolean;
}

export type ContractType = 'full_time' | 'contract';

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
// Simplificado para coincidir con los valores reales de la DB: 'free' y 'taxed'
export const CONTRACT_TYPE_OPTIONS = [
  { value: 'full_time', labelKey: 'collaborators.contractTypes.fullTime' }, // Se mapea a 'taxed'
  { value: 'contract', labelKey: 'collaborators.contractTypes.contract' }   // Se mapea a 'free'
] as const; 