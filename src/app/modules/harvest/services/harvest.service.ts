import { Injectable, inject } from '@angular/core';
import { Observable, from, catchError, map } from 'rxjs';

import { SupabaseService } from '@/app/shared/services/supabase.service';
import {
  HarvestEntity,
  CreateHarvestRequest,
  UpdateHarvestRequest,
  HarvestListResponse,
  HarvestResponse
} from '@/app/shared/models/harvest.models';

@Injectable({
  providedIn: 'root'
})
export class HarvestService {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly tableName = 'harvests';
  private readonly fieldList = `
    id,
    collaborator_id,
    date,
    start_time,
    end_time,
    kilograms,
    quality_grade,
    price_per_kilogram,
    total_payment,
    humidity_percentage,
    defects_percentage,
    area_harvested,
    weather_conditions,
    is_sold,
    notes,
    created_at,
    updated_at
  `;

  /**
   * Obtener todas las cosechas con información del colaborador
   */
  getAllHarvests(): Observable<HarvestListResponse> {
    const query = from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(`
          ${this.fieldList},
          collaborator:collaborators(id, first_name, last_name)
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
    );

    return query.pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener cosechas por colaborador
   */
  getHarvestsByCollaborator(collaboratorId: string): Observable<HarvestListResponse> {
    const query = from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(`
          ${this.fieldList},
          collaborator:collaborators(id, first_name, last_name)
        `)
        .eq('collaborator_id', collaboratorId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
    );

    return query.pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener una cosecha por ID
   */
  getHarvestById(id: string): Observable<HarvestResponse> {
    const query = from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(`
          ${this.fieldList},
          collaborator:collaborators(id, first_name, last_name)
        `)
        .eq('id', id)
        .single()
    );

    return query.pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crear una nueva cosecha
   */
  createHarvest(request: CreateHarvestRequest): Observable<HarvestResponse> {
    // Limpiar campos de tiempo vacíos
    const cleanedRequest = { ...request };
    if (cleanedRequest.start_time === '') cleanedRequest.start_time = undefined;
    if (cleanedRequest.end_time === '') cleanedRequest.end_time = undefined;

    const query = from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .insert(cleanedRequest)
        .select(this.fieldList)
        .single()
    );

    return query.pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualizar una cosecha existente
   */
  updateHarvest(request: UpdateHarvestRequest): Observable<HarvestResponse> {
    const { id, ...updateData } = request;
    
    // Limpiar campos de tiempo vacíos
    if (updateData.start_time === '') updateData.start_time = undefined;
    if (updateData.end_time === '') updateData.end_time = undefined;

    const query = from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select(this.fieldList)
        .single()
    );

    return query.pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Eliminar una cosecha
   */
  deleteHarvest(id: string): Observable<HarvestResponse> {
    const query = from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .select(this.fieldList)
        .single()
    );

    return query.pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener cosechas disponibles para venta (no vendidas)
   */
  getAvailableHarvests(): Observable<HarvestListResponse> {
    const query = from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(`
          ${this.fieldList},
          collaborator:collaborators(id, first_name, last_name)
        `)
        .eq('is_sold', false)
        .order('date', { ascending: false })
    );

    return query.pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Buscar cosechas por criterios
   */
  searchHarvests(searchTerm: string): Observable<HarvestListResponse> {
    // Buscar en notas, condiciones climáticas y nombres de colaboradores
    const query = from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(`
          ${this.fieldList},
          collaborator:collaborators(id, first_name, last_name)
        `)
        .or(`notes.ilike.%${searchTerm}%, weather_conditions.ilike.%${searchTerm}%`)
        .order('date', { ascending: false })
    );

    return query.pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Mapear respuesta de lista desde Supabase
   */
  private mapListResponse(response: any): HarvestListResponse {
    if (response.error) {
      return {
        data: [],
        error: {
          message: response.error.message || 'Error al obtener las cosechas',
          code: response.error.code
        }
      };
    }

    return {
      data: response.data || []
    };
  }

  /**
   * Mapear respuesta individual desde Supabase
   */
  private mapSingleResponse(response: any): HarvestResponse {
    if (response.error) {
      return {
        error: {
          message: response.error.message || 'Error al procesar la cosecha',
          code: response.error.code
        }
      };
    }

    return {
      data: response.data || undefined
    };
  }

  /**
   * Manejar errores
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en HarvestService:', error);
    throw error;
  }
} 