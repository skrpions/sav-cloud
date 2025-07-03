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
  private readonly fieldList = `
    id,
    collaborator_id,
    type,
    date,
    start_time,
    end_time,
    days,
    area_worked,
    payment_type,
    rate_per_day,
    total_cost,
    materials_used,
    weather_conditions,
    quality_rating,
    notes,
    created_at,
    updated_at
  `;

  /** Obtener todas las actividades */
  getAllActivities(): Observable<ActivityListResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldList)
        .order('date', { ascending: false })
    ).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /** Obtener actividades por colaborador */
  getActivitiesByCollaborator(collaboratorId: string): Observable<ActivityListResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldList)
        .eq('collaborator_id', collaboratorId)
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
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .insert([request])
        .select()
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /** Actualizar actividad */
  updateActivity(request: UpdateActivityRequest): Observable<ActivityResponse> {
    const { id, ...updateData } = request;
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
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
        .select()
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /** Mapeo de respuestas */
  private mapListResponse(response: any): ActivityListResponse {
    if (response.error) {
      return {
        data: [],
        error: {
          message: response.error.message || 'Error al obtener actividades',
          code: response.error.code
        }
      };
    }
    return { data: response.data || [] };
  }

  private mapSingleResponse(response: any): ActivityResponse {
    if (response.error) {
      return {
        error: {
          message: response.error.message || 'Error al procesar actividad',
          code: response.error.code
        }
      };
    }
    return { data: response.data };
  }

  private handleError(error: any): Observable<never> {
    throw {
      error: {
        message: error.message || 'Error inesperado en el servicio de actividades',
        code: error.code || 'UNKNOWN_ERROR'
      }
    };
  }
} 