import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SupabaseService } from '@/app/shared/services/supabase.service';
import { 
  SettingsEntity, 
  CreateSettingsRequest, 
  UpdateSettingsRequest,
  SettingsResponse,
  SettingsListResponse 
} from '@/app/shared/models/settings.models';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly tableName = 'settings';
  private readonly fieldList = `
    id,
    year,
    harvest_price_per_kilogram,
    daily_rate_libre,
    daily_rate_grabado,
    activity_rate_fertilization,
    activity_rate_fumigation,
    activity_rate_pruning,
    activity_rate_weeding,
    activity_rate_planting,
    activity_rate_maintenance,
    activity_rate_other,
    currency,
    tax_percentage,
    is_active,
    created_at,
    updated_at
  `;

  /**
   * Obtiene todas las configuraciones
   */
  getAllSettings(): Observable<SettingsListResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldList)
        .order('year', { ascending: false })
    ).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene la configuración activa (solo debería haber una por año)
   */
  getActiveSettings(): Observable<SettingsListResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldList)
        .eq('is_active', true)
        .order('year', { ascending: false })
    ).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene configuración por año
   */
  getSettingsByYear(year: number): Observable<SettingsResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldList)
        .eq('year', year)
        .eq('is_active', true)
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene configuración por ID
   */
  getSettingsById(id: string): Observable<SettingsResponse> {
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

  /**
   * Crea nueva configuración
   */
  createSettings(request: CreateSettingsRequest): Observable<SettingsResponse> {
    // Preparar los datos para la inserción
    const settingsData = {
      year: request.year,
      harvest_price_per_kilogram: request.harvest_price_per_kilogram,
      daily_rate_libre: request.daily_rate_libre,
      daily_rate_grabado: request.daily_rate_grabado,
      activity_rate_fertilization: request.activity_rate_fertilization || null,
      activity_rate_fumigation: request.activity_rate_fumigation || null,
      activity_rate_pruning: request.activity_rate_pruning || null,
      activity_rate_weeding: request.activity_rate_weeding || null,
      activity_rate_planting: request.activity_rate_planting || null,
      activity_rate_maintenance: request.activity_rate_maintenance || null,
      activity_rate_other: request.activity_rate_other || null,
      currency: request.currency,
      tax_percentage: request.tax_percentage,
      is_active: true
    };

    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .insert([settingsData])
        .select()
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Actualiza configuración existente
   */
  updateSettings(request: UpdateSettingsRequest): Observable<SettingsResponse> {
    const { id, ...updateData } = request;
    
    const settingsData = {
      year: updateData.year,
      harvest_price_per_kilogram: updateData.harvest_price_per_kilogram,
      daily_rate_libre: updateData.daily_rate_libre,
      daily_rate_grabado: updateData.daily_rate_grabado,
      activity_rate_fertilization: updateData.activity_rate_fertilization || null,
      activity_rate_fumigation: updateData.activity_rate_fumigation || null,
      activity_rate_pruning: updateData.activity_rate_pruning || null,
      activity_rate_weeding: updateData.activity_rate_weeding || null,
      activity_rate_planting: updateData.activity_rate_planting || null,
      activity_rate_maintenance: updateData.activity_rate_maintenance || null,
      activity_rate_other: updateData.activity_rate_other || null,
      currency: updateData.currency,
      tax_percentage: updateData.tax_percentage,
      is_active: updateData.is_active ?? true
    };

    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update(settingsData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Elimina configuración (soft delete - marca como inactiva)
   */
  deleteSettings(id: string): Observable<SettingsResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Desactiva todas las configuraciones de otros años para activar la nueva
   */
  deactivateOtherSettings(currentId: string, year: number): Observable<SettingsListResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update({ is_active: false })
        .eq('year', year)
        .neq('id', currentId)
        .select()
    ).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Mapea la respuesta de lista de Supabase
   */
  private mapListResponse(response: any): SettingsListResponse {
    if (response.error) {
      console.error('Supabase list error:', response.error);
      return {
        data: [],
        error: {
          message: response.error.message || 'Error al obtener configuraciones',
          code: response.error.code
        }
      };
    }

    return {
      data: response.data || []
    };
  }

  /**
   * Mapea la respuesta única de Supabase
   */
  private mapSingleResponse(response: any): SettingsResponse {
    if (response.error) {
      console.error('Supabase single error:', response.error);
      return {
        error: {
          message: response.error.message || 'Error al procesar configuración',
          code: response.error.code
        }
      };
    }

    return {
      data: response.data
    };
  }

  /**
   * Maneja errores comunes
   */
  private handleError(error: any): Observable<never> {
    console.error('Settings service error:', error);
    
    let errorMessage = 'Error inesperado en el servicio de configuraciones';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    throw {
      error: {
        message: errorMessage,
        code: error.code || 'UNKNOWN_ERROR'
      }
    };
  }
}
