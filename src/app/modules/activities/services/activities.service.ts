import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SupabaseService } from '@/app/shared/services/supabase.service';
import {
  ActivityEntity,
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityResponse,
  ActivityListResponse
} from '@/app/shared/models/activity.models';

@Injectable({
  providedIn: 'root'
})
export class ActivitiesService {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly tableName = 'activities';
  
  // Campos actualizados según nueva estructura de BD
  private readonly fieldList = `
    id,
    farm_id,
    collaborator_id,
    plot_id,
    type,
    date,
    days,
    area_worked,
    payment_type,
    rate_per_day,
    total_cost,
    materials_used,
    weather_conditions,
    quality_rating,
    supervisor_id,
    equipment_used,
    notes,
    created_at,
    updated_at
  `;

  /** Obtener todas las actividades */
  getAllActivities(farmId?: string): Observable<ActivityListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .order('date', { ascending: false });

    // Filtrar por farm_id si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /** Obtener actividades por colaborador */
  getActivitiesByCollaborator(collaboratorId: string, farmId?: string): Observable<ActivityListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('collaborator_id', collaboratorId)
      .order('date', { ascending: false });

    // Filtrar por farm_id si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /** Obtener actividades por lote/parcela */
  getActivitiesByPlot(plotId: string): Observable<ActivityListResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldList)
        .eq('plot_id', plotId)
        .order('date', { ascending: false })
    ).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /** Obtener actividad por ID */
  getActivityById(id: string): Observable<ActivityResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldList)
        .eq('id', id)
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /** Crear nueva actividad */
  createActivity(request: CreateActivityRequest): Observable<ActivityResponse> {
    const activityData = {
      farm_id: request.farm_id,
      collaborator_id: request.collaborator_id,
      plot_id: request.plot_id || null,
      type: request.type,
      date: request.date,
      days: request.days,
      area_worked: request.area_worked || null,
      payment_type: request.payment_type,
      rate_per_day: request.rate_per_day,
      total_cost: request.total_cost,
      materials_used: request.materials_used || null,
      weather_conditions: request.weather_conditions || null,
      quality_rating: request.quality_rating || null,
      supervisor_id: request.supervisor_id || null,
      equipment_used: request.equipment_used || null,
      notes: request.notes || null
    };

    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .insert([activityData])
        .select(this.fieldList)
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /** Actualizar actividad */
  updateActivity(request: UpdateActivityRequest): Observable<ActivityResponse> {
    const { id, ...requestData } = request;
    
    const activityData = {
      farm_id: requestData.farm_id,
      collaborator_id: requestData.collaborator_id,
      plot_id: requestData.plot_id || null,
      type: requestData.type,
      date: requestData.date,
      days: requestData.days,
      area_worked: requestData.area_worked || null,
      payment_type: requestData.payment_type,
      rate_per_day: requestData.rate_per_day,
      total_cost: requestData.total_cost,
      materials_used: requestData.materials_used || null,
      weather_conditions: requestData.weather_conditions || null,
      quality_rating: requestData.quality_rating || null,
      supervisor_id: requestData.supervisor_id || null,
      equipment_used: requestData.equipment_used || null,
      notes: requestData.notes || null
    };

    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update(activityData)
        .eq('id', id)
        .select(this.fieldList)
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /** Eliminar actividad (soft delete: podría marcar como inactiva si se prefiere) */
  deleteActivity(id: string): Observable<ActivityResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .select(this.fieldList)
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /** Mapeo de respuestas */
  private mapListResponse(response: unknown): ActivityListResponse {
    const typedResponse = response as { data?: ActivityEntity[]; error?: { message: string; code?: string } };
    
    if (typedResponse.error) {
      return {
        data: [],
        error: {
          message: typedResponse.error.message || 'Error al obtener actividades',
          code: typedResponse.error.code
        }
      };
    }
    return { data: typedResponse.data || [] };
  }

  private mapSingleResponse(response: unknown): ActivityResponse {
    const typedResponse = response as { data?: ActivityEntity; error?: { message: string; code?: string } };
    
    if (typedResponse.error) {
      return {
        error: {
          message: typedResponse.error.message || 'Error al procesar actividad',
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
        message: typedError.message || 'Error inesperado en el servicio de actividades',
        code: typedError.code || 'UNKNOWN_ERROR'
      }
    };
  }
} 