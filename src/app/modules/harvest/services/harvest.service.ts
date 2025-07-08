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
  
  // Campos actualizados según nueva estructura de BD
  private readonly fieldList = `
    id,
    farm_id,
    collaborator_id,
    plot_id,
    variety_id,
    date,
    start_time,
    end_time,
    quantity,
    unit_measure,
    quality_grade,
    price_per_unit,
    total_payment,
    humidity_percentage,
    defects_percentage,
    area_harvested,
    weather_conditions,
    processing_method,
    is_sold,
    batch_number,
    notes,
    created_at,
    updated_at
  `;

  /**
   * Obtener todas las cosechas con información del colaborador
   */
  getAllHarvests(farmId?: string): Observable<HarvestListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(`
        ${this.fieldList},
        collaborator:collaborators(id, first_name, last_name)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // Filtrar por farm_id si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener cosechas por colaborador
   */
  getHarvestsByCollaborator(collaboratorId: string, farmId?: string): Observable<HarvestListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(`
        ${this.fieldList},
        collaborator:collaborators(id, first_name, last_name)
      `)
      .eq('collaborator_id', collaboratorId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // Filtrar por farm_id si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener cosechas por lote/parcela
   */
  getHarvestsByPlot(plotId: string): Observable<HarvestListResponse> {
    const query = from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(`
          ${this.fieldList},
          collaborator:collaborators(id, first_name, last_name)
        `)
        .eq('plot_id', plotId)
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
    // Preparar datos de cosecha con campos actualizados
    const harvestData = {
      farm_id: request.farm_id,
      collaborator_id: request.collaborator_id,
      plot_id: request.plot_id || null,
      variety_id: request.variety_id || null,
      date: request.date,
      start_time: request.start_time || null,
      end_time: request.end_time || null,
      quantity: request.quantity,
      unit_measure: request.unit_measure || 'kg',
      quality_grade: request.quality_grade,
      price_per_unit: request.price_per_unit,
      total_payment: request.total_payment,
      humidity_percentage: request.humidity_percentage || null,
      defects_percentage: request.defects_percentage || null,
      area_harvested: request.area_harvested || null,
      weather_conditions: request.weather_conditions || null,
      processing_method: request.processing_method || null,
      batch_number: request.batch_number || null,
      notes: request.notes || null,
      is_sold: false
    };

    const query = from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .insert(harvestData)
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
    const { id, ...requestData } = request;
    
    // Preparar datos de cosecha con campos actualizados
    const harvestData = {
      farm_id: requestData.farm_id,
      collaborator_id: requestData.collaborator_id,
      plot_id: requestData.plot_id || null,
      variety_id: requestData.variety_id || null,
      date: requestData.date,
      start_time: requestData.start_time || null,
      end_time: requestData.end_time || null,
      quantity: requestData.quantity,
      unit_measure: requestData.unit_measure || 'kg',
      quality_grade: requestData.quality_grade,
      price_per_unit: requestData.price_per_unit,
      total_payment: requestData.total_payment,
      humidity_percentage: requestData.humidity_percentage || null,
      defects_percentage: requestData.defects_percentage || null,
      area_harvested: requestData.area_harvested || null,
      weather_conditions: requestData.weather_conditions || null,
      processing_method: requestData.processing_method || null,
      batch_number: requestData.batch_number || null,
      notes: requestData.notes || null,
      is_sold: requestData.is_sold ?? false
    };

    const query = from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update(harvestData)
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
  getAvailableHarvests(farmId?: string): Observable<HarvestListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(`
        ${this.fieldList},
        collaborator:collaborators(id, first_name, last_name)
      `)
      .eq('is_sold', false)
      .order('date', { ascending: false });

    // Filtrar por farm_id si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Buscar cosechas por criterios
   */
  searchHarvests(searchTerm: string, farmId?: string): Observable<HarvestListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(`
        ${this.fieldList},
        collaborator:collaborators(id, first_name, last_name)
      `)
      .or(`notes.ilike.%${searchTerm}%,weather_conditions.ilike.%${searchTerm}%,batch_number.ilike.%${searchTerm}%`)
      .order('date', { ascending: false });

    // Filtrar por farm_id si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  // Métodos de mapeo y manejo de errores...
  private mapListResponse(response: unknown): HarvestListResponse {
    const typedResponse = response as { data?: HarvestEntity[]; error?: { message: string; code?: string } };
    
    if (typedResponse.error) {
      return {
        data: [],
        error: {
          message: typedResponse.error.message || 'Error al obtener cosechas',
          code: typedResponse.error.code
        }
      };
    }
    return { data: typedResponse.data || [] };
  }

  private mapSingleResponse(response: unknown): HarvestResponse {
    const typedResponse = response as { data?: HarvestEntity; error?: { message: string; code?: string } };
    
    if (typedResponse.error) {
      return {
        error: {
          message: typedResponse.error.message || 'Error al procesar cosecha',
          code: typedResponse.error.code
        }
      };
    }
    return { data: typedResponse.data };
  }

  private handleError(error: unknown): Observable<never> {
    const typedError = error as { message?: string; code?: string };
    
    throw {
      error: {
        message: typedError.message || 'Error inesperado en el servicio de cosechas',
        code: typedError.code || 'UNKNOWN_ERROR'
      }
    };
  }
} 