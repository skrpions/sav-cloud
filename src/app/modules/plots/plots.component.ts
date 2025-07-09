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
import { FarmStateService } from '@/app/shared/services/farm-state.service';
import { 
  PlotEntity, 
  CreatePlotRequest, 
  UpdatePlotRequest,
  PlotStatus,
  PLOT_STATUS_OPTIONS,
  CROP_TYPE_OPTIONS,
  SOIL_TYPE_OPTIONS,
  IRRIGATION_TYPE_OPTIONS,
  PLOT_CONSTRAINTS,
  formatPlotArea,
  getPlotStatusConfig,
  calculatePlotProductionCycle,
  getPlotHealthScore
} from '@/app/shared/models/plot.models';
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
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _translateService = inject(TranslateService);
  private _cdr = inject(ChangeDetectorRef);
  
  // Farm state service para obtener la finca actual
  protected readonly farmStateService = inject(FarmStateService);

  // Signals para el estado del componente
  plots = signal<PlotEntity[]>([]);
  isLoading = signal(false);
  showSidePanel = signal(false);
  isEditMode = signal(false);
  selectedPlot = signal<PlotEntity | null>(null);
  isSidebarCollapsed = signal(false);

  // Vista y paginación
  viewMode = signal<ViewMode>('cards');
  currentPage = signal(0);
  pageSize = signal(8);
  totalPages = signal(0);

  // Filtros
  filterStatus = '';
  filterCropType = '';
  searchTerm = '';

  // Formulario reactivo
  plotForm: FormGroup;

  // Opciones para el template
  statusOptions = PLOT_STATUS_OPTIONS;
  cropTypeOptions = CROP_TYPE_OPTIONS;
  soilTypeOptions = SOIL_TYPE_OPTIONS;
  irrigationTypeOptions = IRRIGATION_TYPE_OPTIONS;
  constraints = PLOT_CONSTRAINTS;

  constructor() {
    this.plotForm = this.createPlotForm();
  }

  async ngOnInit(): Promise<void> {
    await this.loadPlots();
    this.updatePagination();
  }

  private createPlotForm(): FormGroup {
    return this._formBuilder.group({
      name: ['', [
        Validators.required,
        Validators.minLength(this.constraints.name.minLength),
        Validators.maxLength(this.constraints.name.maxLength),
        Validators.pattern(this.constraints.name.pattern)
      ]],
      description: ['', [Validators.maxLength(this.constraints.description.maxLength)]],
      area: [null, [
        Validators.required,
        Validators.min(this.constraints.area.min),
        Validators.max(this.constraints.area.max)
      ]],
      crop_type: [''],
      planting_date: [null],
      expected_harvest_date: [null],
      status: ['preparation', Validators.required],
      soil_type: [''],
      slope_percentage: [null, [
        Validators.min(this.constraints.slope.min),
        Validators.max(this.constraints.slope.max)
      ]],
      irrigation_type: [''],
      notes: ['', [Validators.maxLength(this.constraints.notes.maxLength)]]
    });
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

      // Cargar datos en el formulario
      this.plotForm.patchValue({
        name: plot.name,
        description: plot.description || '',
        area: plot.area,
        crop_type: plot.crop_type || '',
        planting_date: plot.planting_date ? new Date(plot.planting_date) : null,
        expected_harvest_date: plot.expected_harvest_date ? new Date(plot.expected_harvest_date) : null,
        status: plot.status,
        soil_type: plot.soil_type || '',
        slope_percentage: plot.slope_percentage || null,
        irrigation_type: plot.irrigation_type || '',
        notes: plot.notes || ''
      });
    } else {
      // Modo creación
      this.selectedPlot.set(null);
      this.isEditMode.set(false);
      this.plotForm.reset({
        status: 'preparation'
      });
    }

    this.showSidePanel.set(true);
  }

  closeSidePanel(): void {
    this.showSidePanel.set(false);
    this.selectedPlot.set(null);
    this.isEditMode.set(false);
    this.plotForm.reset({
      status: 'preparation'
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
      const currentFarmId = this.farmStateService.getCurrentFarmIdOrDefault();

      // Formatear fechas
      if (formData.planting_date) {
        formData.planting_date = formData.planting_date.toISOString().split('T')[0];
      }
      if (formData.expected_harvest_date) {
        formData.expected_harvest_date = formData.expected_harvest_date.toISOString().split('T')[0];
      }

      if (this.isEditMode() && this.selectedPlot()?.id) {
        // Actualizar lote existente
        const updateRequest: UpdatePlotRequest = {
          id: this.selectedPlot()!.id!,
          farm_id: currentFarmId,
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
        const createRequest: CreatePlotRequest = {
          farm_id: currentFarmId,
          ...formData
        };

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
    this.filterStatus = '';
    this.filterCropType = '';
    this.searchTerm = '';
    this.currentPage.set(0);
    this.updatePagination();
  }

  hasFilters(): boolean {
    return !!(this.filterStatus || this.filterCropType || this.searchTerm);
  }

  get filteredPlots(): PlotEntity[] {
    let filtered = this.plots();

    // Filtro por término de búsqueda
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(plot =>
        plot.name.toLowerCase().includes(search) ||
        plot.description?.toLowerCase().includes(search) ||
        plot.crop_type?.toLowerCase().includes(search) ||
        plot.soil_type?.toLowerCase().includes(search)
      );
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

  getIrrigationTypeLabel(irrigationType?: string): string {
    if (!irrigationType) return 'Sin especificar';
    const option = this.irrigationTypeOptions.find(opt => opt.value === irrigationType);
    return option?.label || irrigationType;
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
    const cycle = calculatePlotProductionCycle(plot.planting_date, plot.expected_harvest_date);
    
    if (!cycle.daysSincePlanting) return '';
    
    if (cycle.daysToHarvest !== undefined) {
      if (cycle.daysToHarvest > 0) {
        return `${cycle.daysToHarvest} días para cosecha`;
      } else if (cycle.daysToHarvest === 0) {
        return 'Listo para cosecha';
      } else {
        return `Cosecha tardía (${Math.abs(cycle.daysToHarvest)} días)`;
      }
    }
    
    return `${cycle.daysSincePlanting} días desde siembra`;
  }

  getPlotHealthScore(plot: PlotEntity): number {
    return getPlotHealthScore(plot).score;
  }

  getPlotHealthFactors(plot: PlotEntity): string[] {
    return getPlotHealthScore(plot).factors;
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