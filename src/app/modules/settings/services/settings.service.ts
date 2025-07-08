import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SupabaseService } from '@/app/shared/services/supabase.service';
import { 
  // Usando solo los aliases para compatibilidad hacia atrás
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
  private readonly tableName = 'farm_settings'; // Nueva tabla
  
  // Campos actualizados según nueva estructura de BD
  private readonly fieldList = `
    id,
    farm_id,
    year,
    currency,
    tax_percentage,
    crop_prices,
    daily_rate_libre,
    daily_rate_grabado,
    activity_rates,
    quality_premiums,
    is_active,
    created_at,
    updated_at
  `;

  /**
   * Obtiene todas las configuraciones de finca
   */
  getAllSettings(farmId?: string): Observable<SettingsListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .order('year', { ascending: false });

    // Filtrar por farm_id si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene la configuración activa por finca (solo debería haber una por finca/año)
   */
  getActiveSettings(farmId?: string): Observable<SettingsListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('is_active', true)
      .order('year', { ascending: false });

    // Filtrar por farm_id si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene configuración por año y finca
   */
  getSettingsByYear(year: number, farmId?: string): Observable<SettingsResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('year', year)
      .eq('is_active', true);

    // Filtrar por farm_id si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query.single()).pipe(
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
   * Crea nueva configuración de finca
   */
  createSettings(request: CreateSettingsRequest): Observable<SettingsResponse> {
    // Preparar los datos para la inserción con nueva estructura
    const farmSettingsData = {
      farm_id: request.farm_id,
      year: request.year,
      currency: request.currency || 'COP',
      tax_percentage: request.tax_percentage,
      crop_prices: request.crop_prices || {},
      daily_rate_libre: request.daily_rate_libre,
      daily_rate_grabado: request.daily_rate_grabado,
      activity_rates: request.activity_rates || {},
      quality_premiums: request.quality_premiums || {},
      is_active: true
    };

    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .insert([farmSettingsData])
        .select(this.fieldList)
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
    
    const farmSettingsData = {
      farm_id: updateData.farm_id,
      year: updateData.year,
      currency: updateData.currency || 'COP',
      tax_percentage: updateData.tax_percentage,
      crop_prices: updateData.crop_prices || {},
      daily_rate_libre: updateData.daily_rate_libre,
      daily_rate_grabado: updateData.daily_rate_grabado,
      activity_rates: updateData.activity_rates || {},
      quality_premiums: updateData.quality_premiums || {},
      is_active: updateData.is_active ?? true
    };

    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update(farmSettingsData)
        .eq('id', id)
        .select(this.fieldList)
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
        .select(this.fieldList)
        .single()
    ).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Desactiva todas las configuraciones de otros años para una finca específica
   */
  deactivateOtherSettings(currentId: string, year: number, farmId: string): Observable<SettingsListResponse> {
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update({ is_active: false })
        .eq('year', year)
        .eq('farm_id', farmId)
        .neq('id', currentId)
        .select(this.fieldList)
    ).pipe(
      map(response => this.mapListResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Mapea respuesta de lista desde Supabase
   */
  private mapListResponse(response: unknown): SettingsListResponse {
    const typedResponse = response as { data?: unknown[]; error?: { message: string; code?: string } };
    
    if (typedResponse.error) {
      console.error('Supabase list error:', typedResponse.error);
      return {
        data: [],
        error: {
          message: typedResponse.error.message || 'Error al obtener configuraciones',
          code: typedResponse.error.code
        }
      };
    }

    return {
      data: (typedResponse.data as SettingsEntity[]) || []
    };
  }

  /**
   * Mapea respuesta individual desde Supabase
   */
  private mapSingleResponse(response: unknown): SettingsResponse {
    const typedResponse = response as { data?: unknown; error?: { message: string; code?: string } };
    
    if (typedResponse.error) {
      // Manejar específicamente el error PGRST116 (no hay filas)
      if (typedResponse.error.code === 'PGRST116') {
        console.warn('No settings found for the given criteria');
        return {
          data: undefined, // No hay datos, pero no es un error crítico
          error: undefined
        };
      }
      
      console.error('Supabase single error:', typedResponse.error);
      return {
        error: {
          message: typedResponse.error.message || 'Error al procesar configuración',
          code: typedResponse.error.code
        }
      };
    }

    return {
      data: typedResponse.data as SettingsEntity
    };
  }

  /**
   * Maneja errores del servicio
   */
  private handleError(error: unknown): Observable<never> {
    const typedError = error as { message?: string; code?: string };
    
    console.error('Settings service error:', typedError);
    
    throw {
      error: {
        message: typedError.message || 'Error inesperado en el servicio de configuraciones',
        code: typedError.code || 'UNKNOWN_ERROR'
      }
    };
  }
}
