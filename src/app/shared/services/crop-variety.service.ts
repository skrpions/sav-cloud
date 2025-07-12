// ========================================
// CROP VARIETY SERVICE
// Servicio para gestión de variedades de cultivos
// ========================================

import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SupabaseService } from './supabase.service';
import { 
  CropVarietyEntity, 
  CropVarietyListResponse, 
  CropVarietyResponse 
} from '@/app/shared/models/crop-variety.models';

@Injectable({
  providedIn: 'root'
})
export class CropVarietyService {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly tableName = 'crop_varieties';

  // Lista de campos para consultas
  private readonly fieldList = `
    id,
    crop_type,
    name,
    scientific_name,
    description,
    characteristics,
    maturation_months,
    productive_years,
    plants_per_hectare,
    harvest_seasons,
    is_active,
    created_at,
    updated_at
  `;

  // ========================================
  // MÉTODOS DE CONSULTA
  // ========================================

  /**
   * Obtener todas las variedades activas
   */
  getAllVarieties(): Observable<CropVarietyListResponse> {
    const query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('is_active', true)
      .order('crop_type', { ascending: true })
      .order('name', { ascending: true });

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener variedades por tipo de cultivo
   */
  getVarietiesByCropType(cropType: string): Observable<CropVarietyListResponse> {
    const query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('crop_type', cropType)
      .eq('is_active', true)
      .order('name', { ascending: true });

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener una variedad por ID
   */
  getVarietyById(id: string): Observable<CropVarietyResponse> {
    const query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('id', id)
      .single();

    return from(query).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(error => this.handleSingleError(error))
    );
  }

  // ========================================
  // MÉTODOS DE UTILIDAD PRIVADOS
  // ========================================

  private mapListResponse(response: any): CropVarietyListResponse {
    if (response.error) {
      return {
        data: [],
        error: {
          message: response.error.message || 'Error al cargar variedades',
          code: response.error.code
        }
      };
    }

    return {
      data: response.data || []
    };
  }

  private mapSingleResponse(response: any): CropVarietyResponse {
    if (response.error) {
      return {
        error: {
          message: response.error.message || 'Error al cargar variedad',
          code: response.error.code
        }
      };
    }

    return {
      data: response.data
    };
  }

  private handleError(error: any): Observable<CropVarietyListResponse> {
    console.error('CropVarietyService Error:', error);
    
    return from([{
      data: [],
      error: {
        message: error?.message || 'Error desconocido en el servicio de variedades',
        code: error?.code || 'UNKNOWN_ERROR'
      }
    }]);
  }

  private handleSingleError(error: any): Observable<CropVarietyResponse> {
    console.error('CropVarietyService Error:', error);
    
    return from([{
      error: {
        message: error?.message || 'Error desconocido en el servicio de variedades',
        code: error?.code || 'UNKNOWN_ERROR'
      }
    }]);
  }
} 