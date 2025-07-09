import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { SupabaseService } from '@/app/shared/services/supabase.service';
import { 
  CreateCollaboratorRequest, 
  UpdateCollaboratorRequest,
  CollaboratorResponse,
  CollaboratorListResponse,
  BankingInfo,
  CollaboratorEntity,
  ContractType
} from '@/app/shared/models/collaborator.models';

/**
 * Servicio para manejar colaboradores
 */
@Injectable({
  providedIn: 'root'
})
export class CollaboratorsService {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly tableName = 'collaborators';
  private readonly bankingInfoTable = 'banking_info';

  // Campos que queremos recuperar de la tabla collaborators
  private readonly fieldList = `
    id,
    farm_id,
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
    banking_info_id,
    specializations,
    is_active,
    notes,
    created_at,
    updated_at
  `;

  // Campos con información bancaria (join)
  private readonly fieldListWithBanking = `
    id,
    farm_id,
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
    banking_info_id,
    specializations,
    is_active,
    notes,
    created_at,
    updated_at,
    banking_info!inner(
      id,
      bank,
      product_type,
      account_number,
      use_phone_number
    )
  `;

  /**
   * Obtiene todos los colaboradores de una finca específica
   */
  getAllCollaborators(farmId?: string): Observable<CollaboratorListResponse> {
    const query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldListWithBanking)
      .order('created_at', { ascending: false });

    if (farmId) {
      query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response as any)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene solo los colaboradores activos de una finca específica
   */
  getActiveCollaborators(farmId?: string): Observable<CollaboratorListResponse> {
    const query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldListWithBanking)
      .eq('is_active', true)
      .order('first_name', { ascending: true });

    if (farmId) {
      query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response as any)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene un colaborador por su ID
   */
  getCollaboratorById(id: string): Observable<CollaboratorResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldListWithBanking)
        .eq('id', id)
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response as any)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crea un nuevo colaborador
   */
  createCollaborator(request: CreateCollaboratorRequest): Observable<CollaboratorResponse> {
    // Si hay información bancaria, crearla primero
    if (request.banking_info) {
      return this.createBankingInfo(request.banking_info).pipe(
        switchMap(bankingInfo => {
          const bankingInfoId = bankingInfo?.id;
          return this.createCollaboratorRecord(request, bankingInfoId);
        }),
        catchError(error => this.handleError(error))
      );
    } else {
      // Crear colaborador sin información bancaria
      return this.createCollaboratorRecord(request);
    }
  }

  /**
   * Actualiza un colaborador existente
   */
  updateCollaborator(request: UpdateCollaboratorRequest): Observable<CollaboratorResponse> {
    const { id, banking_info } = request;
    
    // Si hay información bancaria, actualizarla primero
    if (banking_info) {
      return this.updateBankingInfo(banking_info).pipe(
        switchMap(bankingInfo => {
          const bankingInfoId = bankingInfo?.id;
          return this.updateCollaboratorRecord(id, request, bankingInfoId);
        }),
        catchError(error => this.handleError(error))
      );
    } else {
      // Actualizar colaborador sin información bancaria
      return this.updateCollaboratorRecord(id, request);
    }
  }

  /**
   * Elimina (desactiva) un colaborador
   */
  deleteCollaborator(id: string): Observable<CollaboratorResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update({ is_active: false })
        .eq('id', id)
        .select(this.fieldList)
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response as any)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Busca colaboradores por término de búsqueda
   */
  searchCollaborators(searchTerm: string, farmId?: string): Observable<CollaboratorListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldListWithBanking)
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,identification.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('first_name', { ascending: true });

    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response as any)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crea información bancaria y retorna el ID
   */
  private createBankingInfo(bankingInfo: BankingInfo): Observable<BankingInfo | null> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.bankingInfoTable)
        .insert({
          bank: bankingInfo.bank,
          product_type: bankingInfo.product_type,
          account_number: bankingInfo.account_number,
          use_phone_number: bankingInfo.use_phone_number || false
        })
        .select('*')
        .single()
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response.data;
      })
    );
  }

  /**
   * Actualiza información bancaria existente
   */
  private updateBankingInfo(bankingInfo: BankingInfo): Observable<BankingInfo | null> {
    if (!bankingInfo.id) {
      // Si no tiene ID, crear nueva información bancaria
      return this.createBankingInfo(bankingInfo);
    }

    return from(
      this._supabaseService.supabaseClient
        .from(this.bankingInfoTable)
        .update({
          bank: bankingInfo.bank,
          product_type: bankingInfo.product_type,
          account_number: bankingInfo.account_number,
          use_phone_number: bankingInfo.use_phone_number || false
        })
        .eq('id', bankingInfo.id)
        .select('*')
        .single()
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response.data;
      })
    );
  }

  /**
   * Crea el registro del colaborador en la base de datos
   */
  private createCollaboratorRecord(request: CreateCollaboratorRequest, bankingInfoId?: string): Observable<CollaboratorResponse> {
    const collaboratorData = {
      farm_id: request.farm_id,
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
      banking_info_id: bankingInfoId || null,
      specializations: request.specializations || {},
      notes: request.notes || '',
      is_active: true
    };

    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .insert(collaboratorData)
        .select(this.fieldList)
        .single()
    ).pipe(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map(response => this.mapSingleResponse(response as any)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualiza el registro del colaborador en la base de datos
   */
  private updateCollaboratorRecord(id: string, collaboratorData: UpdateCollaboratorRequest, bankingInfoId?: string): Observable<CollaboratorResponse> {
    const updateData: {
      farm_id: string;
      first_name: string;
      last_name: string;
      identification: string;
      phone: string;
      address: string;
      email: string;
      birth_date: string;
      hire_date: string;
      contract_type: string;
      emergency_contact_name: string;
      emergency_contact_phone: string;
      specializations: Record<string, boolean> | undefined;
      notes: string | undefined;
      is_active: boolean | undefined;
      banking_info_id?: string | null;
    } = {
      farm_id: collaboratorData.farm_id,
      first_name: collaboratorData.first_name,
      last_name: collaboratorData.last_name,
      identification: collaboratorData.identification,
      phone: collaboratorData.phone,
      address: collaboratorData.address,
      email: collaboratorData.email,
      birth_date: collaboratorData.birth_date,
      hire_date: collaboratorData.hire_date,
      contract_type: this.mapContractTypeForDB(collaboratorData.contract_type),
      emergency_contact_name: collaboratorData.emergency_contact_name,
      emergency_contact_phone: collaboratorData.emergency_contact_phone,
      specializations: collaboratorData.specializations,
      notes: collaboratorData.notes,
      is_active: collaboratorData.is_active
    };

    // Solo actualizar banking_info_id si se proporciona
    if (bankingInfoId !== undefined) {
      updateData.banking_info_id = bankingInfoId;
    }

    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select(this.fieldList)
        .single()
    ).pipe(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map(response => this.mapSingleResponse(response as any)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Mapea la respuesta de lista de Supabase al formato de nuestra aplicación
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapListResponse(response: any): CollaboratorListResponse {
    if (response.error) {
      return {
        data: [],
        error: {
          message: response.error.message
        }
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collaborators = (response.data || []).map((collaborator: any) => ({
      ...collaborator,
      contract_type: this.mapContractTypeFromDB(collaborator.contract_type) as ContractType
    }));

    return {
      data: collaborators
    };
  }

  /**
   * Mapea la respuesta individual de Supabase al formato de nuestra aplicación
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapSingleResponse(response: any): CollaboratorResponse {
    if (response.error) {
      return {
        data: undefined,
        error: {
          message: response.error.message
        }
      };
    }

    if (!response.data) {
      return {
        data: undefined,
        error: {
          message: 'No collaborator found'
        }
      };
    }

    const collaborator = {
      ...response.data,
      contract_type: this.mapContractTypeFromDB(response.data.contract_type) as ContractType
    };

    return {
      data: collaborator
    };
  }

  /**
   * Mapea el tipo de contrato para la base de datos
   */
  private mapContractTypeForDB(contractType: ContractType): string {
    // Los tipos en la BD son los mismos que en la aplicación
    return contractType;
  }

  /**
   * Mapea el tipo de contrato desde la base de datos
   */
  private mapContractTypeFromDB(contractType: string): ContractType {
    // Los tipos en la BD son los mismos que en la aplicación
    return contractType as ContractType;
  }

  /**
   * Maneja errores de las operaciones
   */
  private handleError(error: unknown): Observable<never> {
    console.error('CollaboratorsService Error:', error);

    let errorMessage = 'Unknown error occurred';
    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return throwError(() => new Error(errorMessage));
  }
} 