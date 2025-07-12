import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';
import { format, isValid, parseISO } from 'date-fns';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarComponent } from '@/app/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '@/app/shared/components/header/header.component';
import { ActionButtonComponent } from '@/app/shared/components/action-button/action-button.component';
import { HarvestService } from './services/harvest.service';
import { HarvestEntity, QualityGrade, QUALITY_GRADE_OPTIONS, WEATHER_CONDITIONS_OPTIONS, getQualityGradeColor, getQualityGradeLabel } from '@/app/shared/models/harvest.models';
import { CollaboratorsService } from '../collaborators/services/collaborators.service';
import { CollaboratorEntity } from '@/app/shared/models/collaborator.models';
import { PlotsService } from '../plots/services/plots.service';
import { PlotEntity } from '@/app/shared/models/plot.models';
import { SettingsService } from '../settings/services/settings.service';
import { SettingsEntity } from '@/app/shared/models/settings.models';
import { CropVarietyService } from '@/app/shared/services/crop-variety.service';
import { CropVarietyEntity, CROP_TYPE_VARIETIES } from '@/app/shared/models/crop-variety.models';
import { DateUtils } from '@/app/shared/utils/validators';
import { SidebarItem } from '@/app/shared/models/ui.models';
import { FarmStateService } from '@/app/shared/services/farm-state.service';
import { FarmEntity } from '@/app/shared/models/farm.models';

// Tipos para las vistas
export type ViewMode = 'list' | 'cards';

@Component({
  selector: 'app-harvest',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    SidebarComponent,
    HeaderComponent,
    ActionButtonComponent
  ],
  templateUrl: './harvest.component.html',
  styleUrl: './harvest.component.scss'
})
export class HarvestComponent implements OnInit {
  private _harvestService = inject(HarvestService);
  private _collaboratorsService = inject(CollaboratorsService);
  private _plotsService = inject(PlotsService);
  private _settingsService = inject(SettingsService);
  private _cropVarietyService = inject(CropVarietyService);
  private _formBuilder = inject(FormBuilder);
  private _translateService = inject(TranslateService);
  private _cdr = inject(ChangeDetectorRef);
  
  // Farm state service para obtener la finca actual
  protected readonly farmStateService = inject(FarmStateService);

  // Signals para el estado
  harvests = signal<HarvestEntity[]>([]);
  collaborators = signal<CollaboratorEntity[]>([]);
  plots = signal<PlotEntity[]>([]);
  cropVarieties = signal<CropVarietyEntity[]>([]);
  settings = signal<SettingsEntity | undefined>(undefined);
  isLoading = signal(false);
  showSidePanel = signal(false);
  isEditMode = signal(false);
  selectedHarvest = signal<HarvestEntity | null>(null);
  isSidebarCollapsed = signal(false);

  // Vista y paginación
  viewMode = signal<ViewMode>('list');
  currentPage = signal(0);
  pageSize = signal(7);
  totalPages = signal(0);

  // Filtros
  filterCollaborator = '';
  filterQualityGrade = '';
  filterDate = '';
  filterIsSold = '';
  filterPlot = '';

  // Formulario
  harvestForm: FormGroup;

  // Opciones para selects
  qualityGradeOptions = QUALITY_GRADE_OPTIONS;
  weatherConditionsOptions = WEATHER_CONDITIONS_OPTIONS;
  cropTypeVarieties = CROP_TYPE_VARIETIES;

  constructor() {
    this.harvestForm = this.createHarvestForm();
  }

  async ngOnInit(): Promise<void> {
    // Inicializar farm state service si no está ya inicializado
    if (!this.farmStateService.hasFarms()) {
      await this.farmStateService.initialize();
    }
    
    // Cargar datos necesarios
    await this.loadCollaborators();
    await this.loadPlots();
    await this.loadSettings();
    await this.loadHarvests();
  }

  private createHarvestForm(): FormGroup {
    const today = new Date();
    const form = this._formBuilder.group({
      farm_id: [null, Validators.required],
      collaborator_id: ['', Validators.required],
      plot_id: [null], // Opcional
      variety_id: [null], // Opcional
      date: [today, Validators.required],
      start_time: [''],
      end_time: [''],
      quantity: [0, [Validators.required, Validators.min(0.1)]],
      quality_grade: ['standard', Validators.required],
      price_per_unit: [0, [Validators.required, Validators.min(0)]],
      total_payment: [0, [Validators.required, Validators.min(0)]],
      humidity_percentage: [null, [Validators.min(0), Validators.max(100)]],
      defects_percentage: [null, [Validators.min(0), Validators.max(100)]],
      area_harvested: [null, [Validators.min(0)]],
      weather_conditions: [''],
      notes: ['']
    });

    // Listener para cambios en el lote seleccionado
    form.get('plot_id')?.valueChanges.subscribe(plotId => {
      if (plotId) {
        this.onPlotChange(plotId);
      } else {
        this.cropVarieties.set([]);
        this.harvestForm.patchValue({ variety_id: null });
      }
    });

    // Watchers para cálculo automático
    const fieldsToWatch = ['quantity', 'price_per_unit'];
    fieldsToWatch.forEach(fieldName => {
      form.get(fieldName)?.valueChanges.subscribe(() => {
        this.calculateTotalPayment();
      });
    });

    return form;
  }

  async loadHarvests(): Promise<void> {
    try {
      this.isLoading.set(true);
      
      const currentFarmId = this.farmStateService.getCurrentFarmIdOrDefault();
      const response = await this._harvestService.getAllHarvests(currentFarmId).toPromise();
      
      if (response?.error) {
        console.error('Error loading harvests:', response.error);
        toast.error('Error al cargar las cosechas');
        return;
      }

      this.harvests.set(response?.data || []);
      this.updatePagination();
      console.log('Cosechas cargadas:', this.harvests().length);
      
    } catch (error) {
      console.error('Error in loadHarvests:', error);
      toast.error('Error al cargar las cosechas');
    } finally {
      this.isLoading.set(false);
      this._cdr.detectChanges();
    }
  }

  async loadCollaborators(): Promise<void> {
    try {
      // Usar getCurrentFarmIdOrDefault en lugar de TEMP_FARM_CONSTANTS
      const currentFarmId = this.farmStateService.getCurrentFarmIdOrDefault();
      const response = await this._collaboratorsService.getAllCollaborators(currentFarmId).toPromise();
      
      if (response?.error) {
        console.error('Error loading collaborators:', response.error);
        return;
      }

      // Filtrar solo colaboradores activos
      const activeCollaborators = (response?.data || []).filter(collaborator => collaborator.is_active);
      this.collaborators.set(activeCollaborators);
      console.log('Colaboradores cargados para cosechas:', this.collaborators().length);
      
    } catch (error) {
      console.error('Error in loadCollaborators:', error);
    }
  }

  async loadPlots(): Promise<void> {
    try {
      const currentFarmId = this.farmStateService.getCurrentFarmIdOrDefault();
      const response = await this._plotsService.getAllPlots(currentFarmId).toPromise();
      
      if (response?.error) {
        console.error('Error loading plots:', response.error);
        return;
      }

      this.plots.set(response?.data || []);
      console.log('Lotes cargados para cosechas:', this.plots().length);
      
    } catch (error) {
      console.error('Error in loadPlots:', error);
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();
      const currentFarmId = this.farmStateService.getCurrentFarmIdOrDefault();
      const response = await this._settingsService.getSettingsByYear(currentYear, currentFarmId).toPromise();
      
      if (response?.error) {
        console.warn('No settings found (this is normal for new installations):', response.error);
        this.settings.set(undefined);
        return;
      }

      this.settings.set(response?.data);
      
      // Actualizar el precio por unidad en el formulario si hay configuración de café
      const settingsData = response?.data;
      if (settingsData?.crop_prices?.['coffee']?.price_per_kg) {
        this.harvestForm.patchValue({
          price_per_unit: settingsData.crop_prices['coffee'].price_per_kg
        });
        this.calculateTotalPayment();
      }
      
    } catch (error) {
      console.warn('No settings available (normal for first-time setup):', error);
      this.settings.set(undefined);
    }
  }

  // Métodos de vista y paginación
  switchView(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.currentPage.set(0);
    this.updatePagination();
  }

  public updatePagination(): void {
    const filtered = this.filteredHarvests;
    const total = Math.ceil(filtered.length / this.pageSize());
    this.totalPages.set(total);
    
    // Asegurar que la página actual sea válida
    if (this.currentPage() >= total && total > 0) {
      this.currentPage.set(total - 1);
    }
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
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

  openSidePanel(harvest?: HarvestEntity): void {
    this.showSidePanel.set(true);
    if (harvest && harvest.id) {
      // Modo edición
      this.isEditMode.set(true);
      this.selectedHarvest.set(harvest);
      
      // Preparar datos de la cosecha
      const harvestData: Record<string, unknown> = {
        farm_id: harvest.farm_id || this.farmStateService.getCurrentFarmIdOrDefault(),
        collaborator_id: harvest.collaborator_id || '',
        plot_id: harvest.plot_id || null,
        variety_id: harvest.variety_id || null,
        date: harvest.date ? DateUtils.formatForDatepicker(harvest.date) : new Date(),
        start_time: harvest.start_time || '',
        end_time: harvest.end_time || '',
        quantity: harvest.quantity || 0,
        quality_grade: harvest.quality_grade || 'standard',
        price_per_unit: harvest.price_per_unit || 0,
        total_payment: harvest.total_payment || 0,
        humidity_percentage: harvest.humidity_percentage || null,
        defects_percentage: harvest.defects_percentage || null,
        area_harvested: harvest.area_harvested || null,
        weather_conditions: harvest.weather_conditions || '',
        notes: harvest.notes || ''
      };
      this.harvestForm.patchValue(harvestData);
      
      // Cargar plots de la finca si es diferente a la actual
      if (harvest.farm_id !== this.farmStateService.getCurrentFarmIdOrDefault()) {
        this.loadPlotsByFarm(harvest.farm_id);
      }

      // Cargar variedades si el lote tiene un tipo de cultivo con variedades
      if (harvest.plot_id) {
        const selectedPlot = this.plots().find(p => p.id === harvest.plot_id);
        if (selectedPlot && selectedPlot.crop_type && this.cropTypeVarieties[selectedPlot.crop_type]) {
          this.loadCropVarieties(selectedPlot.crop_type);
        }
      }
    } else {
      // Modo creación
      this.isEditMode.set(false);
      this.selectedHarvest.set(null);
      
      // Limpiar variedades
      this.cropVarieties.set([]);
      
      // Valores por defecto
      const currentSettings = this.settings();
      const defaultPricePerUnit = currentSettings?.crop_prices?.['coffee']?.price_per_kg || 0;
      const currentFarmId = this.farmStateService.getCurrentFarmIdOrDefault();
      const defaultData = { 
        farm_id: currentFarmId,
        collaborator_id: '',
        plot_id: null,
        variety_id: null,
        date: new Date(),
        start_time: '',
        end_time: '',
        quantity: 0,
        quality_grade: 'standard',
        price_per_unit: defaultPricePerUnit,
        total_payment: 0,
        humidity_percentage: null,
        defects_percentage: null,
        area_harvested: null,
        weather_conditions: '',
        notes: ''
      };
      this.harvestForm.patchValue(defaultData);
    }
  }

  closeSidePanel(): void {
    this.showSidePanel.set(false);
    this.isEditMode.set(false);
    this.selectedHarvest.set(null);
    this.cropVarieties.set([]);
    this.harvestForm.reset();
    
    // Restaurar valores por defecto
    const today = new Date();
    const currentSettings = this.settings();
    const defaultPricePerUnit = currentSettings?.crop_prices?.['coffee']?.price_per_kg || 0;
    const currentFarmId = this.farmStateService.getCurrentFarmIdOrDefault();
    this.harvestForm.patchValue({
      farm_id: currentFarmId,
      date: today,
      quality_grade: 'standard',
      price_per_unit: defaultPricePerUnit,
      quantity: 0,
      total_payment: 0,
      variety_id: null
    });
  }

  async onSaveHarvest(): Promise<void> {
    if (this.harvestForm.invalid) {
      this.markFormGroupTouched(this.harvestForm);
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      this.isLoading.set(true);
      const formData = { 
        ...this.harvestForm.value
      };
      
      // Formatear la fecha para el backend
      if (formData.date) {
        formData.date = DateUtils.formatForBackend(formData.date);
      }

      // Limpiar campos opcionales vacíos
      if (formData.start_time === '') formData.start_time = undefined;
      if (formData.end_time === '') formData.end_time = undefined;
      if (formData.weather_conditions === '') formData.weather_conditions = undefined;
      if (formData.notes === '') formData.notes = undefined;
      if (!formData.variety_id) formData.variety_id = undefined;

      let response;
      if (this.isEditMode()) {
        // Actualizar cosecha existente
        const harvestId = this.selectedHarvest()?.id;
        if (!harvestId) {
          toast.error('Error: No se pudo obtener el ID de la cosecha');
          return;
        }
        response = await this._harvestService.updateHarvest({ ...formData, id: harvestId }).toPromise();
      } else {
        // Crear nueva cosecha
        response = await this._harvestService.createHarvest(formData).toPromise();
      }

      if (response?.error) {
        console.error('Error saving harvest:', response.error);
        toast.error(`Error al ${this.isEditMode() ? 'actualizar' : 'crear'} la cosecha`);
        return;
      }

      // Éxito
      toast.success(`Cosecha ${this.isEditMode() ? 'actualizada' : 'creada'} exitosamente`);
      await this.loadHarvests();
      this.closeSidePanel();
      
    } catch (error) {
      console.error('Error in onSaveHarvest:', error);
      toast.error(`Error al ${this.isEditMode() ? 'actualizar' : 'crear'} la cosecha`);
    } finally {
      this.isLoading.set(false);
    }
  }

  onEditHarvest(harvest: HarvestEntity): void {
    this.openSidePanel(harvest);
  }

  onViewHarvest(harvest: HarvestEntity): void {
    // Implementar vista de solo lectura si es necesario
    this.openSidePanel(harvest);
  }

  async onDeleteHarvest(harvest: HarvestEntity): Promise<void> {
    if (!harvest.id) {
      toast.error('Error: No se pudo obtener el ID de la cosecha');
      return;
    }

    if (!confirm('¿Está seguro de que desea eliminar esta cosecha? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      this.isLoading.set(true);
      const response = await this._harvestService.deleteHarvest(harvest.id).toPromise();
      
      if (response?.error) {
        console.error('Error deleting harvest:', response.error);
        toast.error('Error al eliminar la cosecha');
        return;
      }

      toast.success('Cosecha eliminada exitosamente');
      await this.loadHarvests();
      
    } catch (error) {
      console.error('Error in onDeleteHarvest:', error);
      toast.error('Error al eliminar la cosecha');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Eventos del header y sidebar
  onSearchChanged(searchTerm: string): void {
    console.log('Search term changed:', searchTerm);
    // Implementar búsqueda si es necesario
  }

  onSidebarItemClicked(item: SidebarItem): void {
    console.log('Sidebar item clicked:', item);
  }

  onSidebarCollapseChanged(isCollapsed: boolean): void {
    this.isSidebarCollapsed.set(isCollapsed);
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      this.closeSidePanel();
    }
  }

  // Callback para actualizar lotes cuando cambia la finca
  onFarmChange(farmId: string): void {
    if (farmId) {
      this.loadPlotsByFarm(farmId);
      // Limpiar selección de lote y variedad
      this.harvestForm.patchValue({ plot_id: null, variety_id: null });
      this.cropVarieties.set([]);
    }
  }

  // Callback para cuando cambia el lote seleccionado
  async onPlotChange(plotId: string): Promise<void> {
    if (plotId) {
      const selectedPlot = this.plots().find(p => p.id === plotId);
      if (selectedPlot && selectedPlot.crop_type && this.cropTypeVarieties[selectedPlot.crop_type]) {
        // Si el lote tiene un tipo de cultivo con variedades, cargarlas
        await this.loadCropVarieties(selectedPlot.crop_type);
      } else {
        // Si no tiene variedades, limpiar la lista
        this.cropVarieties.set([]);
        this.harvestForm.patchValue({ variety_id: null });
      }
    }
  }

  // Cargar variedades de cultivo por tipo
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

  private async loadPlotsByFarm(farmId: string): Promise<void> {
    try {
      const response = await this._plotsService.getAllPlots(farmId).toPromise();
      if (response?.error) throw new Error(response.error.message);
      this.plots.set(response?.data || []);
    } catch (error: unknown) {
      console.error('Error loading plots by farm:', error);
      this.plots.set([]);
    }
  }

  // Filtros
  clearFilters(): void {
    this.filterCollaborator = '';
    this.filterQualityGrade = '';
    this.filterDate = '';
    this.filterIsSold = '';
    this.filterPlot = '';
    this.currentPage.set(0);
    this.updatePagination();
  }

  hasFilters(): boolean {
    return !!(this.filterCollaborator || this.filterQualityGrade || this.filterDate || this.filterIsSold || this.filterPlot);
  }

  get filteredHarvests(): HarvestEntity[] {
    let filtered = this.harvests();

    if (this.filterCollaborator) {
      filtered = filtered.filter(h => h.collaborator_id === this.filterCollaborator);
    }

    if (this.filterQualityGrade) {
      filtered = filtered.filter(h => h.quality_grade === this.filterQualityGrade);
    }

    if (this.filterPlot) {
      filtered = filtered.filter(h => h.plot_id === this.filterPlot);
    }

    if (this.filterDate) {
      // Asegurar que tratamos el filterDate como fecha local sin zona horaria
      const filterDate = DateUtils.formatToLocalDate(new Date(this.filterDate));
      filtered = filtered.filter(h => {
        // Extraer solo la parte de fecha de la cosecha (sin hora)
        const harvestDate = h.date.split('T')[0]; // Extraer YYYY-MM-DD
        return harvestDate === filterDate;
      });
    }

    if (this.filterIsSold) {
      const isSold = this.filterIsSold === 'true';
      filtered = filtered.filter(h => h.is_sold === isSold);
    }

    return filtered;
  }

  get paginatedHarvests(): HarvestEntity[] {
    const filtered = this.filteredHarvests;
    
    if (this.viewMode() === 'cards') {
      return filtered; // Sin paginación en vista de tarjetas
    }
    
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  }

  // Utilidades
  getCollaboratorName(collaboratorId: string): string {
    const collaborator = this.collaborators().find(c => c.id === collaboratorId);
    return collaborator ? `${collaborator.first_name} ${collaborator.last_name}` : 'Colaborador no encontrado';
  }

  getPlotName(plotId?: string): string {
    if (!plotId) return 'Sin lote específico';
    const plot = this.plots().find(p => p.id === plotId);
    return plot ? plot.name : 'Lote no encontrado';
  }

  formatDate(dateString: string): string {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd/MM/yyyy') : 'Fecha inválida';
    } catch {
      return 'Fecha inválida';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  }

  getQualityGradeColor(grade: QualityGrade): string {
    return getQualityGradeColor(grade);
  }

  getQualityGradeLabel(grade: QualityGrade): string {
    return getQualityGradeLabel(grade);
  }

  // Cálculos automáticos
  calculateTotalPayment(): void {
    const quantityControl = this.harvestForm.get('quantity');
    const priceControl = this.harvestForm.get('price_per_unit');
    const totalControl = this.harvestForm.get('total_payment');

    if (quantityControl && priceControl && totalControl) {
      const quantity = quantityControl.value || 0;
      const price = priceControl.value || 0;
      const total = quantity * price;
      
      totalControl.setValue(total, { emitEvent: false });
    }
  }

  onQuantityChange(): void {
    this.calculateTotalPayment();
  }

  onPricePerUnitChange(): void {
    this.calculateTotalPayment();
  }

  // Getters para el template
  get availableFarms(): FarmEntity[] {
    return this.farmStateService.farms();
  }

  get availableCollaborators(): CollaboratorEntity[] {
    return this.collaborators();
  }

  get availablePlots(): PlotEntity[] {
    return this.plots();
  }

  get availableCropVarieties(): CropVarietyEntity[] {
    return this.cropVarieties();
  }

  // Verificar si un cultivo tiene variedades disponibles
  cropHasVarieties(cropType: string): boolean {
    return !!(cropType && this.cropTypeVarieties[cropType]);
  }

  // Validaciones del formulario
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  // TrackBy functions para mejor rendimiento
  trackByHarvestId(index: number, item: HarvestEntity): string {
    return item.id || index.toString();
  }

  trackByCollaboratorId(index: number, item: CollaboratorEntity): string {
    return item.id || index.toString();
  }

  // Debug info
  get debugInfo() {
    return {
      harvestsCount: this.harvests().length,
      collaboratorsCount: this.collaborators().length,
      plotsCount: this.plots().length,
      hasSettings: !!this.settings(),
      isLoading: this.isLoading(),
      showSidePanel: this.showSidePanel(),
      isEditMode: this.isEditMode(),
      viewMode: this.viewMode(),
      currentPage: this.currentPage(),
      totalPages: this.totalPages()
    };
  }
}
