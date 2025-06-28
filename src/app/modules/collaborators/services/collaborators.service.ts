import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SupabaseService } from '@/app/shared/services/supabase.service';
import { 
  CollaboratorEntity, 
  CreateCollaboratorRequest, 
  UpdateCollaboratorRequest,
  CollaboratorResponse,
  CollaboratorListResponse 
} from '@/app/shared/models/collaborator.models';

@Injectable({
  providedIn: 'root'
})
export class CollaboratorsService {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly tableName = 'collaborators';
  private readonly fieldList = `
    id,
    first_name,
    last_name,
    identification,
    phone,
    address,
    email,
    birth_date,
    hire_date,
    contract_type,
    emergency_contact_name,
    emergency_contact_phone,
    bank_account,
    is_active,
    notes,
    created_at,
    updated_at
  `;

  /**
   * Obtiene todos los colaboradores
   */
  getAllCollaborators(): Observable<CollaboratorListResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldList)
        .order('created_at', { ascending: false })
    ).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene colaboradores activos
   */
  getActiveCollaborators(): Observable<CollaboratorListResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldList)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
    ).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene un colaborador por ID
   */
  getCollaboratorById(id: string): Observable<CollaboratorResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Crea un nuevo colaborador
   */
  createCollaborator(request: CreateCollaboratorRequest): Observable<CollaboratorResponse> {
    console.log('Original request contract_type:', request.contract_type);
    
    // Preparar solo los campos necesarios para la inserción
    const collaboratorData = {
      first_name: request.first_name,
      last_name: request.last_name,
      identification: request.identification,
      phone: request.phone,
      address: request.address,
      email: request.email,
      birth_date: request.birth_date,
      hire_date: request.hire_date,
      contract_type: this.mapContractTypeForDB(request.contract_type),
      emergency_contact_name: request.emergency_contact_name,
      emergency_contact_phone: request.emergency_contact_phone,
      bank_account: request.bank_account,
      notes: request.notes || null,
      is_active: true
      // No incluir created_at ni updated_at si la tabla los genera automáticamente
    };

    console.log('Final data being sent to Supabase:', collaboratorData);

    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .insert([collaboratorData])
        .select()
        .single()
    ).pipe(
      map(response => {
        console.log('Supabase insert response:', response);
        return this.mapSingleResponse(response);
      }),
      catchError((error) => {
        console.error('Detailed error from Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return this.handleError(error);
      })
    );
  }

  /**
   * Actualiza un colaborador existente
   */
  updateCollaborator(request: UpdateCollaboratorRequest): Observable<CollaboratorResponse> {
    const { id, ...updateData } = request;
    
    // Preparar solo los campos necesarios para la actualización
    const collaboratorData = {
      first_name: updateData.first_name,
      last_name: updateData.last_name,
      identification: updateData.identification,
      phone: updateData.phone,
      address: updateData.address,
      email: updateData.email,
      birth_date: updateData.birth_date,
      hire_date: updateData.hire_date,
      contract_type: this.mapContractTypeForDB(updateData.contract_type),
      emergency_contact_name: updateData.emergency_contact_name,
      emergency_contact_phone: updateData.emergency_contact_phone,
      bank_account: updateData.bank_account,
      notes: updateData.notes || null,
      is_active: updateData.is_active ?? true
      // No incluir updated_at si la tabla lo maneja automáticamente
    };

    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update(collaboratorData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Elimina un colaborador (soft delete - marca como inactivo)
   */
  deleteCollaborator(id: string): Observable<CollaboratorResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update({ 
          is_active: false
          // No incluir updated_at si la tabla lo maneja automáticamente
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Busca colaboradores por término
   */
  searchCollaborators(searchTerm: string): Observable<CollaboratorListResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldList)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,identification.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
    ).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Mapea la respuesta de lista de Supabase al formato de nuestra aplicación
   */
  private mapListResponse(response: any): CollaboratorListResponse {
    if (response.error) {
      return {
        data: [],
        error: {
          message: response.error.message || 'Error fetching collaborators',
          code: response.error.code
        }
      };
    }

    const collaborators = (response.data || []).map((collaborator: any) => ({
      ...collaborator,
      contract_type: this.mapContractTypeFromDB(collaborator.contract_type)
    }));

    return {
      data: collaborators
    };
  }

  /**
   * Mapea la respuesta individual de Supabase al formato de nuestra aplicación
   */
  private mapSingleResponse(response: any): CollaboratorResponse {
    if (response.error) {
      return {
        data: undefined,
        error: {
          message: response.error.message || 'Error processing collaborator',
          code: response.error.code
        }
      };
    }

    const collaborator = response.data ? {
      ...response.data,
      contract_type: this.mapContractTypeFromDB(response.data.contract_type)
    } : undefined;

    return {
      data: collaborator
    };
  }

  /**
   * Mapea los valores del enum de contrato al formato esperado por la base de datos
   * La DB usa: 'libre' (incluye comida) y 'grabado' (solo pago)
   */
  private mapContractTypeForDB(contractType: string): string {
    console.log('Mapping contract type to DB:', contractType);
    
    // Mapeo: 'contract' -> 'libre', 'full_time' -> 'grabado'
    const result = contractType === 'contract' ? 'libre' : 'grabado';
    
    console.log('Mapped to DB format:', result);
    return result;
  }

  /**
   * Mapea los valores del enum de contrato desde la base de datos al formato de la aplicación
   */
  private mapContractTypeFromDB(contractType: string): string {
    const mapping: Record<string, string> = {
      'libre': 'contract',      // libre -> contract (incluye comida)
      'grabado': 'full_time'    // grabado -> full_time (solo pago)
    };

    return mapping[contractType] || contractType;
  }

  /**
   * Maneja errores de las operaciones
   */
  private handleError(error: any): Observable<never> {
    console.error('CollaboratorsService Error:', error);

    let errorMessage = 'Unknown error occurred';
    let errorCode = 'UNKNOWN_ERROR';

    if (error?.message) {
      errorMessage = error.message;
    }

    if (error?.code) {
      errorCode = error.code;
    }

    // Manejar errores específicos de Supabase
    switch (error?.code) {
      case 'PGRST116':
        errorMessage = 'Collaborator not found';
        errorCode = 'NOT_FOUND';
        break;
      case '23505':
        errorMessage = 'A collaborator with this identification already exists';
        errorCode = 'DUPLICATE_IDENTIFICATION';
        break;
      default:
        break;
    }

    return throwError(() => ({
      message: errorMessage,
      code: errorCode
    }));
  }
} 