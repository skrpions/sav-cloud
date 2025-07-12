// ========================================
// PLOTS SERVICE
// Servicio para gestión de lotes de cultivo
// ========================================

import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SupabaseService } from '@/app/shared/services/supabase.service';
import { 
  PlotEntity, 
  PlotListResponse, 
  PlotResponse, 
  CreatePlotRequest, 
  UpdatePlotRequest 
} from '@/app/shared/models/plot.models';

@Injectable({
  providedIn: 'root'
})
export class PlotsService {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly tableName = 'plots';

  // Lista de campos para consultas
  private readonly fieldList = `
    id,
    farm_id,
    name,
    code,
    area,
    crop_type,
    planting_date,
    last_renovation_date,
    status,
    soil_type,
    slope_percentage,
    irrigation_system,
    coordinates,
    notes,
    altitude,
    is_active,
    created_at,
    updated_at
  `;

  // ========================================
  // MÉTODOS DE CONSULTA
  // ========================================

  getAllPlots(farmId?: string): Observable<PlotListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Filtrar por finca si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  getActivePlots(farmId?: string): Observable<PlotListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('is_active', true)
      .neq('status', 'resting')
      .order('name', { ascending: true });

    // Filtrar por finca si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  getPlotsByStatus(status: string, farmId?: string): Observable<PlotListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('is_active', true)
      .eq('status', status)
      .order('name', { ascending: true });

    // Filtrar por finca si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  getPlotsByCropType(cropType: string, farmId?: string): Observable<PlotListResponse> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('is_active', true)
      .eq('crop_type', cropType)
      .order('name', { ascending: true });

    // Filtrar por finca si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  getPlotById(id: string): Observable<PlotResponse> {
    const query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('id', id)
      .single();

    return from(query).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  // ========================================
  // MÉTODOS DE MODIFICACIÓN
  // ========================================

  createPlot(request: CreatePlotRequest): Observable<PlotResponse> {
    const plotData = {
      farm_id: request.farm_id,
      name: request.name?.trim(),
      code: request.code?.trim() || null,
      area: request.area,
      crop_type: request.crop_type || null,
      planting_date: request.planting_date || null,
      last_renovation_date: request.last_renovation_date || null,
      status: request.status,
      soil_type: request.soil_type || null,
      slope_percentage: request.slope_percentage || null,
      irrigation_system: request.irrigation_system || null,
      altitude: request.altitude || null,
      coordinates: request.coordinates || null,
      notes: request.notes?.trim() || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .insert(plotData)
      .select(this.fieldList)
      .single();

    return from(query).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  updatePlot(request: UpdatePlotRequest): Observable<PlotResponse> {
    const plotData = {
      name: request.name.trim(),
      code: request.code?.trim() || null,
      area: request.area,
      crop_type: request.crop_type || null,
      planting_date: request.planting_date || null,
      last_renovation_date: request.last_renovation_date || null,
      status: request.status,
      soil_type: request.soil_type || null,
      slope_percentage: request.slope_percentage || null,
      irrigation_system: request.irrigation_system || null,
      altitude: request.altitude || null,
      coordinates: request.coordinates || null,
      notes: request.notes?.trim() || null,
      is_active: request.is_active !== undefined ? request.is_active : true,
      updated_at: new Date().toISOString()
    };

    const query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .update(plotData)
      .eq('id', request.id)
      .select(this.fieldList)
      .single();

    return from(query).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  deactivatePlot(id: string): Observable<PlotResponse> {
    const query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(this.fieldList)
      .single();

    return from(query).pipe(
      map(response => this.mapSingleResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  deletePlot(id: string): Observable<PlotResponse> {
    const query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .delete()
      .eq('id', id);

    return from(query).pipe(
      map(() => ({ data: undefined })),
      catchError(error => this.handleError(error))
    );
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA Y FILTROS
  // ========================================

  searchPlots(searchTerm: string, farmId?: string): Observable<PlotListResponse> {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select(this.fieldList)
      .eq('is_active', true)
      .or(`name.ilike.${searchPattern},notes.ilike.${searchPattern},crop_type.ilike.${searchPattern}`)
      .order('name', { ascending: true });

    // Filtrar por finca si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => this.mapListResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  // ========================================
  // MÉTODOS ESTADÍSTICOS
  // ========================================

  getPlotStatistics(farmId?: string): Observable<{
    totalPlots: number;
    totalArea: number;
    plotsByStatus: Record<string, number>;
    plotsByCropType: Record<string, number>;
    averageArea: number;
  }> {
    let query = this._supabaseService.supabaseClient
      .from(this.tableName)
      .select('status, crop_type, area')
      .eq('is_active', true);

    // Filtrar por finca si se proporciona
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    return from(query).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message);
        }

        const plots = response.data || [];
        const totalPlots = plots.length;
        const totalArea = plots.reduce((sum, plot) => sum + (plot.area || 0), 0);
        
        const plotsByStatus: Record<string, number> = {};
        const plotsByCropType: Record<string, number> = {};

        plots.forEach(plot => {
          // Contar por estado
          plotsByStatus[plot.status] = (plotsByStatus[plot.status] || 0) + 1;
          
          // Contar por tipo de cultivo
          if (plot.crop_type) {
            plotsByCropType[plot.crop_type] = (plotsByCropType[plot.crop_type] || 0) + 1;
          }
        });

        return {
          totalPlots,
          totalArea,
          plotsByStatus,
          plotsByCropType,
          averageArea: totalPlots > 0 ? totalArea / totalPlots : 0
        };
      }),
      catchError(error => this.handleError(error))
    );
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  checkPlotDependencies(plotId: string): Observable<{
    hasActivities: boolean;
    hasHarvests: boolean;
    hasPlantInventory: boolean;
  }> {
    const checksPromises = [
      // Verificar actividades
      this._supabaseService.supabaseClient
        .from('activities')
        .select('id')
        .eq('plot_id', plotId)
        .limit(1),
      
      // Verificar cosechas
      this._supabaseService.supabaseClient
        .from('harvests')
        .select('id')
        .eq('plot_id', plotId)
        .limit(1),
      
      // Verificar inventario de plantas
      this._supabaseService.supabaseClient
        .from('plant_inventory')
        .select('id')
        .eq('plot_id', plotId)
        .limit(1)
    ];

    return from(Promise.all(checksPromises)).pipe(
      map(([activitiesRes, harvestsRes, inventoryRes]) => ({
        hasActivities: (activitiesRes.data?.length || 0) > 0,
        hasHarvests: (harvestsRes.data?.length || 0) > 0,
        hasPlantInventory: (inventoryRes.data?.length || 0) > 0
      })),
      catchError(error => this.handleError(error))
    );
  }

  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================

  private mapListResponse(response: unknown): PlotListResponse {
    const supabaseResponse = response as { data: any[] | null, error: any | null };
    
    if (supabaseResponse.error) {
      return {
        data: [],
        error: {
          message: supabaseResponse.error.message,
          code: supabaseResponse.error.code
        }
      };
    }

    return {
      data: supabaseResponse.data || []
    };
  }

  private mapSingleResponse(response: unknown): PlotResponse {
    const supabaseResponse = response as { data: any | null, error: any | null };
    
    if (supabaseResponse.error) {
      return {
        data: undefined,
        error: {
          message: supabaseResponse.error.message,
          code: supabaseResponse.error.code
        }
      };
    }

    return {
      data: supabaseResponse.data || undefined
    };
  }

  private handleError(error: unknown): Observable<never> {
    console.error('PlotsService Error:', error);
    return throwError(() => error);
  }
} 