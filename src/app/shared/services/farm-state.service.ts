import { Injectable, inject, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { FarmsService } from '@/app/modules/farms/services/farms.service';
import { FarmEntity } from '@/app/shared/models/farm.models';

@Injectable({
  providedIn: 'root'
})
export class FarmStateService {
  private _farmsService = inject(FarmsService);

  // Estado de las fincas
  private readonly _farms = signal<FarmEntity[]>([]);
  private readonly _currentFarm = signal<FarmEntity | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Claves para localStorage
  private readonly CURRENT_FARM_KEY = 'sav-cloud-current-farm';

  // Getters públicos como signals computados
  readonly farms = this._farms.asReadonly();
  readonly currentFarm = this._currentFarm.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed properties útiles
  readonly hasFarms = computed(() => this.farms().length > 0);
  readonly currentFarmId = computed(() => this.currentFarm()?.id || null);
  readonly currentFarmName = computed(() => this.currentFarm()?.name || 'Sin finca seleccionada');

  constructor() {
    this.loadInitialState();
  }

  /**
   * Carga el estado inicial: fincas del usuario y finca actual desde localStorage
   */
  private async loadInitialState(): Promise<void> {
    await this.loadFarms();
    this.loadCurrentFarmFromStorage();
  }

  /**
   * Carga todas las fincas del usuario actual
   */
  async loadFarms(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await this._farmsService.getActiveFarms().toPromise();
      
      if (response?.error) {
        throw new Error(response.error.message);
      }

      const farmsList = response?.data || [];
      this._farms.set(farmsList);

      // Si no hay finca actual pero hay fincas disponibles, seleccionar la primera
      if (!this._currentFarm() && farmsList.length > 0) {
        this.setCurrentFarm(farmsList[0]);
      }

      // Si la finca actual ya no está en la lista (eliminada), limpiar selección
      const currentFarmId = this._currentFarm()?.id;
      if (currentFarmId && !farmsList.find(f => f.id === currentFarmId)) {
        this.clearCurrentFarm();
      }

    } catch (error: unknown) {
      console.error('Error loading farms:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar las fincas';
      this._error.set(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Establece la finca actual
   */
  setCurrentFarm(farm: FarmEntity): void {
    this._currentFarm.set(farm);
    this.saveCurrentFarmToStorage(farm);
    this._error.set(null);
  }

  /**
   * Establece la finca actual por ID
   */
  setCurrentFarmById(farmId: string): void {
    const farm = this._farms().find(f => f.id === farmId);
    if (farm) {
      this.setCurrentFarm(farm);
    } else {
      console.warn(`Farm with ID ${farmId} not found in current farms list`);
    }
  }

  /**
   * Limpia la finca actual
   */
  clearCurrentFarm(): void {
    this._currentFarm.set(null);
    this.clearCurrentFarmFromStorage();
  }

  /**
   * Obtiene una finca por ID
   */
  getFarmById(farmId: string): FarmEntity | undefined {
    return this._farms().find(f => f.id === farmId);
  }

  /**
   * Verifica si hay una finca válida seleccionada
   */
  hasValidCurrentFarm(): boolean {
    const current = this._currentFarm();
    return current !== null && current.is_active !== false;
  }

  /**
   * Obtiene el ID de la finca actual o lanza error si no hay finca
   */
  getCurrentFarmIdOrDefault(): string {
    const currentId = this.currentFarmId();
    if (currentId) {
      return currentId;
    }
    
    throw new Error('No hay una finca seleccionada. Por favor, crea o selecciona una finca primero.');
  }

  /**
   * Actualiza una finca en la lista local (útil después de editar)
   */
  updateFarmInList(updatedFarm: FarmEntity): void {
    const farms = this._farms();
    const index = farms.findIndex(f => f.id === updatedFarm.id);
    
    if (index !== -1) {
      const newFarms = [...farms];
      newFarms[index] = updatedFarm;
      this._farms.set(newFarms);

      // Si es la finca actual, actualizarla también
      if (this._currentFarm()?.id === updatedFarm.id) {
        this._currentFarm.set(updatedFarm);
        this.saveCurrentFarmToStorage(updatedFarm);
      }
    }
  }

  /**
   * Agrega una nueva finca a la lista local
   */
  addFarmToList(newFarm: FarmEntity): void {
    const farms = this._farms();
    this._farms.set([...farms, newFarm]);

    // Si no hay finca actual, establecer esta como actual
    if (!this._currentFarm()) {
      this.setCurrentFarm(newFarm);
    }
  }

  /**
   * Elimina una finca de la lista local
   */
  removeFarmFromList(farmId: string): void {
    const farms = this._farms();
    const filteredFarms = farms.filter(f => f.id !== farmId);
    this._farms.set(filteredFarms);

    // Si era la finca actual, limpiar selección
    if (this._currentFarm()?.id === farmId) {
      // Si hay otras fincas, seleccionar la primera
      if (filteredFarms.length > 0) {
        this.setCurrentFarm(filteredFarms[0]);
      } else {
        this.clearCurrentFarm();
      }
    }
  }

  /**
   * Refresca las fincas desde el servidor
   */
  async refreshFarms(): Promise<void> {
    await this.loadFarms();
  }

  /**
   * Guarda la finca actual en localStorage
   */
  private saveCurrentFarmToStorage(farm: FarmEntity): void {
    try {
      localStorage.setItem(this.CURRENT_FARM_KEY, JSON.stringify({
        id: farm.id,
        name: farm.name,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Error saving current farm to localStorage:', error);
    }
  }

  /**
   * Carga la finca actual desde localStorage
   */
  private loadCurrentFarmFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.CURRENT_FARM_KEY);
      if (stored) {
        const { id, timestamp } = JSON.parse(stored);
        
        // Verificar que no sea muy antigua (7 días)
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (timestamp > weekAgo) {
          // Buscar la finca en la lista actual
          const farm = this._farms().find(f => f.id === id);
          if (farm) {
            this._currentFarm.set(farm);
          }
        } else {
          // Limpiar registro antiguo
          this.clearCurrentFarmFromStorage();
        }
      }
    } catch (error) {
      console.warn('Error loading current farm from localStorage:', error);
      this.clearCurrentFarmFromStorage();
    }
  }

  /**
   * Limpia la finca actual de localStorage
   */
  private clearCurrentFarmFromStorage(): void {
    try {
      localStorage.removeItem(this.CURRENT_FARM_KEY);
    } catch (error) {
      console.warn('Error clearing current farm from localStorage:', error);
    }
  }
} 