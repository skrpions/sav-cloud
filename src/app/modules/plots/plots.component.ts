import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarComponent } from '@/app/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '@/app/shared/components/header/header.component';
import { ActionButtonComponent } from '@/app/shared/components/action-button/action-button.component';
import { PlotsService } from './services/plots.service';
import { CropVarietyService } from '@/app/shared/services/crop-variety.service';
import { FarmStateService } from '@/app/shared/services/farm-state.service';
import { 
  PlotEntity, 
  CreatePlotRequest, 
  UpdatePlotRequest,
  PlotStatus,
  PLOT_STATUS_OPTIONS,
  CROP_TYPE_OPTIONS,
  SOIL_TYPE_OPTIONS,
  IRRIGATION_SYSTEM_OPTIONS,
  PLOT_CONSTRAINTS
} from '@/app/shared/models/plot.models';
import { CropVarietyEntity, CROP_TYPE_VARIETIES } from '@/app/shared/models/crop-variety.models';
import { FarmEntity } from '@/app/shared/models/farm.models';
import { 
  formatPlotArea,
  getPlotStatusConfig,
  calculatePlotProductionCycle,
  getPlotHealthScore
} from '@/app/shared/utils/plot.utils';
import { SidebarItem } from '@/app/shared/models/ui.models';

export type ViewMode = 'list' | 'cards';

@Component({
  selector: 'app-plots',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    TranslateModule,
    SidebarComponent,
    HeaderComponent,
    ActionButtonComponent
  ],
  templateUrl: './plots.component.html',
  styleUrl: './plots.component.scss'
})
export class PlotsComponent implements OnInit {
  private _plotsService = inject(PlotsService);
  private _cropVarietyService = inject(CropVarietyService);
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _translateService = inject(TranslateService);
  private _cdr = inject(ChangeDetectorRef);
  
  // Farm state service para obtener la finca actual
  protected readonly farmStateService = inject(FarmStateService);

  // Signals para el estado del componente
  plots = signal<PlotEntity[]>([]);
  cropVarieties = signal<CropVarietyEntity[]>([]);
  isLoading = signal(false);
  showSidePanel = signal(false);
  isEditMode = signal(false);
  selectedPlot = signal<PlotEntity | null>(null);
  isSidebarCollapsed = signal(false);

  // Vista y paginación
  viewMode = signal<ViewMode>('list');
  currentPage = signal(0);
  pageSize = signal(8);
  totalPages = signal(0);

  // Filtros
  filterFarm = '';
  filterStatus = '';
  filterCropType = '';
  searchTerm = '';

  // Formulario reactivo
  plotForm: FormGroup;

  // Opciones para el template
  statusOptions = PLOT_STATUS_OPTIONS;
  cropTypeOptions = CROP_TYPE_OPTIONS;
  soilTypeOptions = SOIL_TYPE_OPTIONS;
  irrigationSystemOptions = IRRIGATION_SYSTEM_OPTIONS;
  constraints = PLOT_CONSTRAINTS;
  cropTypeVarieties = CROP_TYPE_VARIETIES;

  constructor() {
    this.plotForm = this.createPlotForm();
  }

  async ngOnInit(): Promise<void> {
    // Inicializar farm state service si no está ya inicializado
    if (!this.farmStateService.hasFarms()) {
      await this.farmStateService.initialize();
    }
    
    await this.loadPlots();
    this.updatePagination();
  }

  private createPlotForm(): FormGroup {
    const form = this._formBuilder.group({
      farm_id: [null, Validators.required],
      name: ['', [
        Validators.required,
        Validators.minLength(this.constraints.name.minLength),
        Validators.maxLength(this.constraints.name.maxLength),
        Validators.pattern(this.constraints.name.pattern)
      ]],
      code: ['', [Validators.maxLength(50)]],
      area: [null, [
        Validators.required,
        Validators.min(this.constraints.area.min),
        Validators.max(this.constraints.area.max)
      ]],
      crop_type: [''],
      variety_id: [null], // Opcional, se habilita cuando se selecciona un cultivo con variedades
      planting_date: [null],
      last_renovation_date: [null],
      status: ['active', Validators.required],
      soil_type: [''],
      slope_percentage: [null, [
        Validators.min(this.constraints.slope.min),
        Validators.max(this.constraints.slope.max)
      ]],
      irrigation_system: [''],
      altitude: [null],
      notes: ['', [Validators.maxLength(this.constraints.notes.maxLength)]]
    });

    // Listener para cambios en el tipo de cultivo
    form.get('crop_type')?.valueChanges.subscribe(cropType => {
      if (cropType) {
        this.onCropTypeChange(cropType);
      } else {
        this.cropVarieties.set([]);
        this.plotForm.patchValue({ variety_id: null });
      }
    });

    return form;
  }

  async loadPlots(): Promise<void> {
    this.isLoading.set(true);

    try {
      const currentFarmId = this.farmStateService.getCurrentFarmIdOrDefault();
      const response = await this._plotsService.getAllPlots(currentFarmId).toPromise();

      if (response?.error) {
        throw new Error(response.error.message);
      }

      const plotsList = response?.data || [];
      this.plots.set(plotsList);
      this.updatePagination();

    } catch (error: unknown) {
      console.error('Error loading plots:', error);

      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los lotes';
      toast.error('Error', {
        description: errorMessage,
        duration: 4000
      });

    } finally {
      this.isLoading.set(false);
    }
  }

  // Callback para cuando cambia el tipo de cultivo
  async onCropTypeChange(cropType: string): Promise<void> {
    if (cropType && this.cropTypeVarieties[cropType]) {
      // Si el cultivo tiene variedades, cargarlas
      await this.loadCropVarieties(cropType);
    } else {
      // Si no tiene variedades, limpiar la lista y el campo
      this.cropVarieties.set([]);
      this.plotForm.patchValue({ variety_id: null });
    }
  }

  async loadCropVarieties(cropType: string): Promise<void> {
    try {
      const response = await this._cropVarietyService.getVarietiesByCropType(cropType).toPromise();
      
      if (response?.error) {
        console.error('Error loading crop varieties:', response.error);
        this.cropVarieties.set([]);
        return;
      }

      this.cropVarieties.set(response?.data || []);
      console.log(`Variedades de ${cropType} cargadas:`, this.cropVarieties().length);
      
    } catch (error) {
      console.error('Error in loadCropVarieties:', error);
      this.cropVarieties.set([]);
    }
  }

  // Métodos de vista y paginación
  switchView(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.currentPage.set(0);
    this.updatePagination();
  }

  public updatePagination(): void {
    const filteredCount = this.filteredPlots.length;
    const pages = Math.ceil(filteredCount / this.pageSize());
    this.totalPages.set(pages);

    // Ajustar la página actual si es necesario
    if (this.currentPage() >= pages && pages > 0) {
      this.currentPage.set(pages - 1);
    }
  }

  changePage(page: number): void {
    this.currentPage.set(page);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  openSidePanel(plot?: PlotEntity): void {
    if (plot) {
      // Modo edición
      this.selectedPlot.set(plot);
      this.isEditMode.set(true);

      // Cargar variedades si el cultivo las tiene
      if (plot.crop_type && this.cropTypeVarieties[plot.crop_type]) {
        this.loadCropVarieties(plot.crop_type);
      }

      // Cargar datos en el formulario
      this.plotForm.patchValue({
        farm_id: plot.farm_id,
        name: plot.name,
        code: plot.code || '',
        area: plot.area,
        crop_type: plot.crop_type || '',
        variety_id: plot.variety_id || null,
        planting_date: plot.planting_date ? new Date(plot.planting_date) : null,
        last_renovation_date: plot.last_renovation_date ? new Date(plot.last_renovation_date) : null,
        status: plot.status,
        soil_type: plot.soil_type || '',
        slope_percentage: plot.slope_percentage || null,
        irrigation_system: plot.irrigation_system || '',
        altitude: plot.altitude || null,
        notes: plot.notes || ''
      });
    } else {
      // Modo creación
      this.selectedPlot.set(null);
      this.isEditMode.set(false);
      
      // Limpiar variedades
      this.cropVarieties.set([]);
      
      // Preseleccionar la finca actual
      const currentFarmId = this.farmStateService.getCurrentFarmIdOrDefault();
      this.plotForm.reset({
        farm_id: currentFarmId,
        status: 'active',
        variety_id: null
      });
    }

    this.showSidePanel.set(true);
  }

  closeSidePanel(): void {
    this.showSidePanel.set(false);
    this.selectedPlot.set(null);
    this.isEditMode.set(false);
    this.cropVarieties.set([]);
    this.plotForm.reset({
      status: 'active'
    });
  }

  async onSavePlot(): Promise<void> {
    if (this.plotForm.invalid) {
      this.markFormGroupTouched(this.plotForm);
      toast.error('Formulario inválido', {
        description: 'Por favor revisa los campos marcados en rojo.'
      });
      return;
    }

    this.isLoading.set(true);

    try {
      const formData = this.plotForm.value;

      // Formatear fechas de manera segura
      if (formData.planting_date) {
        const plantingDate = formData.planting_date instanceof Date 
          ? formData.planting_date 
          : new Date(formData.planting_date);
        formData.planting_date = plantingDate.toISOString().split('T')[0];
      }
      if (formData.last_renovation_date) {
        const renovationDate = formData.last_renovation_date instanceof Date 
          ? formData.last_renovation_date 
          : new Date(formData.last_renovation_date);
        formData.last_renovation_date = renovationDate.toISOString().split('T')[0];
      }

      if (this.isEditMode() && this.selectedPlot()?.id) {
        // Actualizar lote existente
        const updateRequest: UpdatePlotRequest = {
          id: this.selectedPlot()!.id!,
          ...formData
        };

        const response = await this._plotsService.updatePlot(updateRequest).toPromise();

        if (response?.error) {
          throw new Error(response.error.message);
        }

        toast.success('Lote actualizado', {
          description: 'La información del lote se ha actualizado exitosamente.'
        });

      } else {
        // Crear nuevo lote
        const createRequest: CreatePlotRequest = formData;

        const response = await this._plotsService.createPlot(createRequest).toPromise();

        if (response?.error) {
          throw new Error(response.error.message);
        }

        toast.success('Lote creado', {
          description: 'El nuevo lote se ha registrado exitosamente.'
        });
      }

      // Cerrar panel y recargar lista
      this.closeSidePanel();
      await this.loadPlots();

    } catch (error: unknown) {
      console.error('Error saving plot:', error);

      const errorMessage = error instanceof Error ? error.message : 'Error al procesar el lote';
      toast.error('Error', {
        description: errorMessage,
        duration: 4000
      });

    } finally {
      this.isLoading.set(false);
    }
  }

  async onDeletePlot(plot: PlotEntity): Promise<void> {
    if (!plot.id) return;

    // Verificar si el lote tiene datos relacionados
    try {
      const dependencies = await this._plotsService.checkPlotDependencies(plot.id).toPromise();

      if (dependencies?.hasActivities || dependencies?.hasHarvests || dependencies?.hasPlantInventory) {
        toast.warning('No se puede eliminar', {
          description: 'Este lote tiene datos relacionados. Primero debes eliminar actividades, cosechas e inventario de plantas.'
        });
        return;
      }

      if (confirm(`¿Estás seguro de eliminar el lote "${plot.name}"? Esta acción no se puede deshacer.`)) {
        this.isLoading.set(true);

        const response = await this._plotsService.deletePlot(plot.id).toPromise();

        if (response?.error) {
          throw new Error(response.error.message);
        }

        toast.success('Lote eliminado', {
          description: 'El lote se ha eliminado exitosamente.'
        });

        await this.loadPlots();
      }

    } catch (error: unknown) {
      console.error('Error deleting plot:', error);

      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el lote';
      toast.error('Error', {
        description: errorMessage,
        duration: 4000
      });

    } finally {
      this.isLoading.set(false);
    }
  }

  onSearchChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchTerm = target?.value || '';
    this.searchTerm = searchTerm;
    this.currentPage.set(0);
    this.updatePagination();
  }

  onSidebarItemClicked(item: SidebarItem): void {
    if (item.route) {
      this._router.navigate([item.route]);
    }
  }

  onSidebarCollapseChanged(isCollapsed: boolean): void {
    this.isSidebarCollapsed.set(isCollapsed);
  }

  clearFilters(): void {
    this.filterFarm = '';
    this.filterStatus = '';
    this.filterCropType = '';
    this.searchTerm = '';
    this.currentPage.set(0);
    this.updatePagination();
  }

  hasFilters(): boolean {
    return !!(this.filterFarm || this.filterStatus || this.filterCropType || this.searchTerm);
  }

  get filteredPlots(): PlotEntity[] {
    let filtered = this.plots();

    // Filtro por término de búsqueda
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(plot =>
        plot.name.toLowerCase().includes(search) ||
        plot.notes?.toLowerCase().includes(search) ||
        plot.crop_type?.toLowerCase().includes(search) ||
        plot.soil_type?.toLowerCase().includes(search)
      );
    }

    // Filtro por finca
    if (this.filterFarm) {
      filtered = filtered.filter(plot => plot.farm_id === this.filterFarm);
    }

    // Filtro por estado
    if (this.filterStatus) {
      filtered = filtered.filter(plot => plot.status === this.filterStatus);
    }

    // Filtro por tipo de cultivo
    if (this.filterCropType) {
      filtered = filtered.filter(plot => plot.crop_type === this.filterCropType);
    }

    return filtered;
  }

  get paginatedPlots(): PlotEntity[] {
    const filtered = this.filteredPlots;
    const startIndex = this.currentPage() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return filtered.slice(startIndex, endIndex);
  }

  // Métodos de utilidad para el template
  formatPlotArea = formatPlotArea;
  getPlotStatusConfig = getPlotStatusConfig;
  
  getStatusLabel(status: PlotStatus): string {
    const config = getPlotStatusConfig(status);
    return config.label;
  }

  getStatusColor(status: PlotStatus): string {
    const config = getPlotStatusConfig(status);
    return config.color;
  }

  getStatusIcon(status: PlotStatus): string {
    const config = getPlotStatusConfig(status);
    return config.icon;
  }

  getCropTypeLabel(cropType?: string): string {
    if (!cropType) return 'Sin especificar';
    const option = this.cropTypeOptions.find(opt => opt.value === cropType);
    return option?.label || cropType;
  }

  getSoilTypeLabel(soilType?: string): string {
    if (!soilType) return 'Sin especificar';
    const option = this.soilTypeOptions.find(opt => opt.value === soilType);
    return option?.label || soilType;
  }

  getIrrigationSystemLabel(irrigation_system: string): string {
    const option = this.irrigationSystemOptions.find(opt => opt.value === irrigation_system);
    return option ? option.label : irrigation_system;
  }

  getVarietyName(varietyId?: string): string {
    if (!varietyId) return 'Sin variedad específica';
    const variety = this.cropVarieties().find(v => v.id === varietyId);
    return variety ? variety.name : 'Variedad no encontrada';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No especificada';

    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  getProductionCycleInfo(plot: PlotEntity): string {
    if (!plot.planting_date) {
      return 'Sin información de siembra';
    }

    const cycle = calculatePlotProductionCycle(plot.planting_date, plot.last_renovation_date);
    
    if (cycle.daysSincePlanting !== undefined) {
      const days = cycle.daysSincePlanting;
      if (days < 30) {
        return `${days} días desde siembra`;
      } else if (days < 365) {
        const months = Math.floor(days / 30);
        return `${months} ${months === 1 ? 'mes' : 'meses'} desde siembra`;
      } else {
        const years = Math.floor(days / 365);
        return `${years} ${years === 1 ? 'año' : 'años'} desde siembra`;
      }
    }

    return 'Sin información disponible';
  }

  getPlotHealthScore(plot: PlotEntity): number {
    return getPlotHealthScore(plot).score;
  }

  getPlotHealthFactors(plot: PlotEntity): string[] {
    return getPlotHealthScore(plot).factors;
  }

  // Getters para el template
  get availableFarms(): FarmEntity[] {
    return this.farmStateService.farms();
  }

  get availableCropVarieties(): CropVarietyEntity[] {
    return this.cropVarieties();
  }

  // Verificar si el cultivo seleccionado tiene variedades
  cropHasVarieties(cropType?: string): boolean {
    return !!(cropType && this.cropTypeVarieties[cropType]);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  trackByPlotId(index: number, item: PlotEntity): string {
    return item.id || index.toString();
  }
} 