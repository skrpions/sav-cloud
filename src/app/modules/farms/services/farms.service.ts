import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { SupabaseService } from '@/app/shared/services/supabase.service';
import { 
  FarmEntity, 
  CreateFarmRequest, 
  UpdateFarmRequest, 
  FarmListResponse, 
  FarmResponse 
} from '@/app/shared/models/farm.models';

@Injectable({
  providedIn: 'root'
})
export class FarmsService {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly tableName = 'farms';

  // Lista de campos que queremos obtener de la base de datos
  private readonly fieldList = `
    id,
    owner_id,
    name,
    description,
    address,
    municipality,
    department,
    country,
    total_area,
    altitude_min,
    altitude_max,
    latitude,
    longitude,
    phone,
    email,
    established_date,
    certifications,
    is_active,
    created_at,
    updated_at
  `;

  /**
   * Obtiene todas las fincas del usuario actual
   */
  getAllFarms(): Observable<FarmListResponse> {
    console.log('🚜 FarmsService: getAllFarms called');
    
    return from(this._supabaseService.supabaseClient.auth.getUser()).pipe(
      switchMap(({ data: { user } }) => {
        if (!user) throw new Error('Usuario no autenticado');
        
        console.log('🚜 FarmsService: Getting farms for user ID:', user.id);
        
        return from(
          this._supabaseService.supabaseClient
            .from(this.tableName)
            .select(this.fieldList)
            .eq('owner_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
        );
      }),
      map(response => {
        console.log('🚜 FarmsService: getAllFarms raw response:', response);
        
        const mappedResponse = this.mapListResponse(response);
        
        console.log('🚜 FarmsService: getAllFarms mapped response:', mappedResponse);
        
        return mappedResponse;
      }),
      catchError(error => {
        console.error('🚜 FarmsService: getAllFarms error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Obtiene las fincas activas del usuario actual
   */
  getActiveFarms(): Observable<FarmListResponse> {
    console.log('🚜 FarmsService: getActiveFarms called');
    
    return from(this._supabaseService.supabaseClient.auth.getUser()).pipe(
      switchMap(({ data: { user } }) => {
        if (!user) throw new Error('Usuario no autenticado');
        
        console.log('🚜 FarmsService: Getting active farms for user ID:', user.id);
        
        return from(
          this._supabaseService.supabaseClient
            .from(this.tableName)
            .select(this.fieldList)
            .eq('owner_id', user.id)
            .eq('is_active', true)
            .order('name', { ascending: true })
        );
      }),
      map(response => {
        console.log('🚜 FarmsService: getActiveFarms raw response:', response);
        
        const mappedResponse = this.mapListResponse(response);
        
        console.log('🚜 FarmsService: getActiveFarms mapped response:', mappedResponse);
        
        return mappedResponse;
      }),
      catchError(error => {
        console.error('🚜 FarmsService: getActiveFarms error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Obtiene una finca por su ID
   */
  getFarmById(id: string): Observable<FarmResponse> {
    console.log('🚜 FarmsService: getFarmById called with ID:', id);
    
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .select(this.fieldList)
        .eq('id', id)
        .single()
    ).pipe(
      map(response => {
        console.log('🚜 FarmsService: getFarmById raw response:', response);
        
        const mappedResponse = this.mapSingleResponse(response);
        
        console.log('🚜 FarmsService: getFarmById mapped response:', mappedResponse);
        
        return mappedResponse;
      }),
      catchError(error => {
        console.error('🚜 FarmsService: getFarmById error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Crea una nueva finca
   */
  createFarm(request: CreateFarmRequest): Observable<FarmResponse> {
    // Debug: log the request
    console.log('🚜 FarmsService: createFarm called with request:', request);

    return from(this._supabaseService.supabaseClient.auth.getUser()).pipe(
      switchMap(({ data: { user } }) => {
        if (!user) throw new Error('Usuario no autenticado');
        
        const farmData = {
          ...request,
          owner_id: user.id,
          is_active: true,
          country: request.country || 'Colombia'
        };

        // Debug: log the data that will be sent to database
        console.log('🚜 FarmsService: farmData prepared for insert:', farmData);

        return from(
          this._supabaseService.supabaseClient
            .from(this.tableName)
            .insert([farmData])
            .select(this.fieldList)
            .single()
        );
      }),
      map(response => {
        // Debug: log the raw response
        console.log('🚜 FarmsService: createFarm raw response:', response);
        
        const mappedResponse = this.mapSingleResponse(response);
        
        // Debug: log the mapped response
        console.log('🚜 FarmsService: createFarm mapped response:', mappedResponse);
        
        return mappedResponse;
      }),
      catchError(error => {
        console.error('🚜 FarmsService: createFarm error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Actualiza una finca existente
   */
  updateFarm(request: UpdateFarmRequest): Observable<FarmResponse> {
    console.log('🚜 FarmsService: updateFarm called with request:', request);
    
    const updateData = {
      name: request.name,
      description: request.description,
      address: request.address,
      municipality: request.municipality,
      department: request.department,
      country: request.country || 'Colombia',
      total_area: request.total_area,
      altitude_min: request.altitude_min,
      altitude_max: request.altitude_max,
      latitude: request.latitude,
      longitude: request.longitude,
      phone: request.phone,
      email: request.email,
      established_date: request.established_date,
      certifications: request.certifications,
      is_active: request.is_active,
      updated_at: new Date().toISOString()
    };

    console.log('🚜 FarmsService: updateData prepared:', updateData);

    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update(updateData)
        .eq('id', request.id)
        .select(this.fieldList)
        .single()
    ).pipe(
      map(response => {
        console.log('🚜 FarmsService: updateFarm raw response:', response);
        
        const mappedResponse = this.mapSingleResponse(response);
        
        console.log('🚜 FarmsService: updateFarm mapped response:', mappedResponse);
        
        return mappedResponse;
      }),
      catchError(error => {
        console.error('🚜 FarmsService: updateFarm error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Desactiva una finca (soft delete)
   */
  deactivateFarm(id: string): Observable<FarmResponse> {
    console.log('🚜 FarmsService: deactivateFarm called with ID:', id);
    
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(this.fieldList)
        .single()
    ).pipe(
      map(response => {
        console.log('🚜 FarmsService: deactivateFarm raw response:', response);
        
        const mappedResponse = this.mapSingleResponse(response);
        
        console.log('🚜 FarmsService: deactivateFarm mapped response:', mappedResponse);
        
        return mappedResponse;
      }),
      catchError(error => {
        console.error('🚜 FarmsService: deactivateFarm error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Elimina una finca permanentemente (solo si no tiene datos relacionados)
   */
  deleteFarm(id: string): Observable<FarmResponse> {
    console.log('🚜 FarmsService: deleteFarm called with ID:', id);
    
    return from(
      this._supabaseService.supabaseClient
        .from(this.tableName)
        .delete()
        .eq('id', id)
    ).pipe(
      map(response => {
        console.log('🚜 FarmsService: deleteFarm raw response:', response);
        return { data: undefined };
      }),
      catchError(error => {
        console.error('🚜 FarmsService: deleteFarm error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Verifica si una finca tiene datos relacionados
   */
  checkFarmDependencies(farmId: string): Observable<{hasActivities: boolean, hasCollaborators: boolean, hasSettings: boolean}> {
    const supabase = this._supabaseService.supabaseClient;
    
    return from(Promise.all([
      supabase.from('activities').select('id').eq('farm_id', farmId).limit(1),
      supabase.from('collaborators').select('id').eq('farm_id', farmId).eq('is_active', true).limit(1),
      supabase.from('farm_settings').select('id').eq('farm_id', farmId).limit(1)
    ])).pipe(
      map(([activities, collaborators, settings]) => ({
        hasActivities: (activities.data?.length || 0) > 0,
        hasCollaborators: (collaborators.data?.length || 0) > 0,
        hasSettings: (settings.data?.length || 0) > 0
      })),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Mapea respuesta de lista desde Supabase
   */
  private mapListResponse(response: unknown): FarmListResponse {
    const typedResponse = response as { data?: unknown; error?: { message: string; code?: string } };
    
    if (typedResponse.error) {
      console.error('Supabase farms list error:', typedResponse.error);
      return {
        data: [],
        error: {
          message: typedResponse.error.message || 'Error al obtener las fincas',
          code: typedResponse.error.code
        }
      };
    }

    return {
      data: (typedResponse.data as FarmEntity[]) || []
    };
  }

  /**
   * Mapea respuesta individual desde Supabase
   */
  private mapSingleResponse(response: unknown): FarmResponse {
    const typedResponse = response as { data?: unknown; error?: { message: string; code?: string } };
    
    if (typedResponse.error) {
      console.error('Supabase farm single error:', typedResponse.error);
      return {
        error: {
          message: typedResponse.error.message || 'Error al procesar finca',
          code: typedResponse.error.code
        }
      };
    }

    return {
      data: typedResponse.data as FarmEntity
    };
  }

  /**
   * Maneja errores de forma consistente
   */
  private handleError(error: unknown): Observable<never> {
    console.error('FarmsService error:', error);
    
    let errorMessage = 'Error inesperado en el servicio de fincas';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as { message: string }).message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
} 