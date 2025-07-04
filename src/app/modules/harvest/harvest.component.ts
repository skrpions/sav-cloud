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
import { HarvestService } from './services/harvest.service';
import { HarvestEntity, QualityGrade, QUALITY_GRADE_OPTIONS, WEATHER_CONDITIONS_OPTIONS, getQualityGradeColor, getQualityGradeLabel } from '@/app/shared/models/harvest.models';
import { CollaboratorsService } from '../collaborators/services/collaborators.service';
import { CollaboratorEntity } from '@/app/shared/models/collaborator.models';
import { SettingsService } from '../settings/services/settings.service';
import { SettingsEntity } from '@/app/shared/models/settings.models';
import { DateUtils } from '@/app/shared/utils/validators';
import { SidebarItem } from '@/app/shared/models/ui.models';

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
    HeaderComponent
  ],
  templateUrl: './harvest.component.html',
  styleUrl: './harvest.component.scss'
})
export class HarvestComponent implements OnInit {
  private _harvestService = inject(HarvestService);
  private _collaboratorsService = inject(CollaboratorsService);
  private _settingsService = inject(SettingsService);
  private _formBuilder = inject(FormBuilder);
  private _translateService = inject(TranslateService);
  private _cdr = inject(ChangeDetectorRef);

  // Signals para el estado
  harvests = signal<HarvestEntity[]>([]);
  collaborators = signal<CollaboratorEntity[]>([]);
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

  // Formulario
  harvestForm: FormGroup;

  // Opciones para selects
  qualityGradeOptions = QUALITY_GRADE_OPTIONS;
  weatherConditionsOptions = WEATHER_CONDITIONS_OPTIONS;

  constructor() {
    this.harvestForm = this.createHarvestForm();
  }

  async ngOnInit(): Promise<void> {
    // Cargar datos necesarios
    await this.loadCollaborators();
    await this.loadSettings();
    await this.loadHarvests();
  }

  private createHarvestForm(): FormGroup {
    const today = new Date();
    return this._formBuilder.group({
      collaborator_id: ['', Validators.required],
      date: [today, Validators.required],
      start_time: [''],
      end_time: [''],
      kilograms: [0, [Validators.required, Validators.min(0.1)]],
      quality_grade: ['standard', Validators.required],
      price_per_kilogram: [0, [Validators.required, Validators.min(0)]],
      total_payment: [0, [Validators.required, Validators.min(0)]],
      humidity_percentage: [null, [Validators.min(0), Validators.max(100)]],
      defects_percentage: [null, [Validators.min(0), Validators.max(100)]],
      area_harvested: [null, [Validators.min(0)]],
      weather_conditions: [''],
      notes: ['']
    });
  }

  async loadHarvests(): Promise<void> {
    try {
      this.isLoading.set(true);
      
      const response = await this._harvestService.getAllHarvests().toPromise();
      
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
      const response = await this._collaboratorsService.getActiveCollaborators().toPromise();
      
      if (response?.error) {
        console.error('Error loading collaborators:', response.error);
        return;
      }

      this.collaborators.set(response?.data || []);
      console.log('Colaboradores cargados para cosechas:', this.collaborators().length);
      
    } catch (error) {
      console.error('Error in loadCollaborators:', error);
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();
      const response = await this._settingsService.getSettingsByYear(currentYear).toPromise();
      
      if (response?.error) {
        console.error('Error loading settings:', response.error);
        return;
      }

      this.settings.set(response?.data);
      
      // Actualizar el precio por kilogramo en el formulario si hay configuración
      if (response?.data?.harvest_price_per_kilogram) {
        this.harvestForm.patchValue({
          price_per_kilogram: response.data.harvest_price_per_kilogram
        });
        this.calculateTotalPayment();
      }
      
    } catch (error) {
      console.error('Error in loadSettings:', error);
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
        collaborator_id: harvest.collaborator_id || '',
        date: harvest.date ? DateUtils.formatForDatepicker(harvest.date) : new Date(),
        start_time: harvest.start_time || '',
        end_time: harvest.end_time || '',
        kilograms: harvest.kilograms || 0,
        quality_grade: harvest.quality_grade || 'standard',
        price_per_kilogram: harvest.price_per_kilogram || 0,
        total_payment: harvest.total_payment || 0,
        humidity_percentage: harvest.humidity_percentage || null,
        defects_percentage: harvest.defects_percentage || null,
        area_harvested: harvest.area_harvested || null,
        weather_conditions: harvest.weather_conditions || '',
        notes: harvest.notes || ''
      };
      this.harvestForm.patchValue(harvestData);
    } else {
      // Modo creación
      this.isEditMode.set(false);
      this.selectedHarvest.set(null);
      
      // Valores por defecto
      const currentSettings = this.settings();
      const defaultData = { 
        collaborator_id: '',
        date: new Date(),
        start_time: '',
        end_time: '',
        kilograms: 0,
        quality_grade: 'standard',
        price_per_kilogram: currentSettings?.harvest_price_per_kilogram || 0,
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
    this.harvestForm.reset();
    
    // Restaurar valores por defecto
    const today = new Date();
    const currentSettings = this.settings();
    this.harvestForm.patchValue({
      date: today,
      quality_grade: 'standard',
      price_per_kilogram: currentSettings?.harvest_price_per_kilogram || 0,
      kilograms: 0,
      total_payment: 0
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
      const formData = { ...this.harvestForm.value };
      
      // Formatear la fecha para el backend
      if (formData.date) {
        formData.date = DateUtils.formatForBackend(formData.date);
      }

      // Limpiar campos opcionales vacíos
      if (formData.start_time === '') formData.start_time = undefined;
      if (formData.end_time === '') formData.end_time = undefined;
      if (formData.weather_conditions === '') formData.weather_conditions = undefined;
      if (formData.notes === '') formData.notes = undefined;

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

  // Filtros
  clearFilters(): void {
    this.filterCollaborator = '';
    this.filterQualityGrade = '';
    this.filterDate = '';
    this.filterIsSold = '';
    this.currentPage.set(0);
    this.updatePagination();
  }

  hasFilters(): boolean {
    return !!(this.filterCollaborator || this.filterQualityGrade || this.filterDate || this.filterIsSold);
  }

  get filteredHarvests(): HarvestEntity[] {
    let filtered = this.harvests();

    if (this.filterCollaborator) {
      filtered = filtered.filter(h => h.collaborator_id === this.filterCollaborator);
    }

    if (this.filterQualityGrade) {
      filtered = filtered.filter(h => h.quality_grade === this.filterQualityGrade);
    }

    if (this.filterDate) {
      const filterDate = DateUtils.formatToLocalDate(new Date(this.filterDate));
      filtered = filtered.filter(h => {
        const harvestDate = DateUtils.formatToLocalDate(new Date(h.date));
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
    const kilograms = this.harvestForm.get('kilograms')?.value || 0;
    const pricePerKg = this.harvestForm.get('price_per_kilogram')?.value || 0;
    const total = kilograms * pricePerKg;
    this.harvestForm.patchValue({ total_payment: total });
  }

  onKilogramsChange(): void {
    this.calculateTotalPayment();
  }

  onPricePerKgChange(): void {
    this.calculateTotalPayment();
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
