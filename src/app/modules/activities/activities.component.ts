import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';
import { format, isValid, parseISO } from 'date-fns';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarComponent } from '@/app/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '@/app/shared/components/header/header.component';
import { ActivitiesService } from './services/activities.service';
import { ActivityEntity, CreateActivityRequest, UpdateActivityRequest, ACTIVITY_TYPE_OPTIONS } from '@/app/shared/models/activity.models';
import { CollaboratorsService } from '../collaborators/services/collaborators.service';
import { CollaboratorEntity } from '@/app/shared/models/collaborator.models';
import { PlotsService } from '../plots/services/plots.service';
import { PlotEntity } from '@/app/shared/models/plot.models';
import { FarmEntity } from '@/app/shared/models/farm.models';
import { FarmStateService } from '@/app/shared/services/farm-state.service';
import { DateUtils } from '@/app/shared/utils/validators';

// Tipos para las vistas
export type ViewMode = 'list' | 'cards';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.scss'
})
export class ActivitiesComponent implements OnInit {
  private _activitiesService = inject(ActivitiesService);
  private _collaboratorsService = inject(CollaboratorsService);
  private _plotsService = inject(PlotsService);
  private _farmStateService = inject(FarmStateService);
  private _formBuilder = inject(FormBuilder);
  private _translateService = inject(TranslateService);
  private _cdr = inject(ChangeDetectorRef);

  activities = signal<ActivityEntity[]>([]);
  collaborators = signal<CollaboratorEntity[]>([]);
  plots = signal<PlotEntity[]>([]);
  isLoading = signal(false);
  showSidePanel = signal(false);
  isEditMode = signal(false);
  selectedActivity = signal<ActivityEntity | null>(null);

  // Vista y paginación
  viewMode = signal<ViewMode>('list');
  currentPage = signal(0);
  pageSize = signal(7);
  totalPages = signal(0);

  // Filtros
  filterCollaborator = '';
  filterType = '';
  filterDate = '';
  filterPlot = '';
  searchTerm = '';

  // Formulario reactivo para el panel lateral
  activityForm: FormGroup;

  // Opciones para los selectores
  activityTypeOptions = ACTIVITY_TYPE_OPTIONS;

  constructor() {
    this.activityForm = this.createActivityForm();
  }

  async ngOnInit(): Promise<void> {
    // Inicializar farm state service si no está ya inicializado
    if (!this._farmStateService.hasFarms()) {
      await this._farmStateService.initialize();
    }
    
    await Promise.all([
      this.loadActivities(),
      this.loadCollaborators(),
      this.loadPlots()
    ]);
    this.updatePagination();
  }

  private createActivityForm(): FormGroup {
    const form = this._formBuilder.group({
      farm_id: [null, Validators.required],
      collaborator_id: ['', Validators.required],
      plot_id: [null], // Opcional
      type: ['', Validators.required],
      date: [new Date(), Validators.required],
      days: [1, [Validators.required, Validators.min(0.1)]],
      payment_type: ['libre', Validators.required],
      rate_per_day: [0, [Validators.required, Validators.min(0)]],
      total_cost: [0, [Validators.required, Validators.min(0)]],
      area_worked: [null, [Validators.min(0)]],
      materials_used: [''],
      weather_conditions: [''],
      quality_rating: [null, [Validators.min(1), Validators.max(5)]],
      notes: ['']
    });

    // Agregar watchers para cálculo automático
    this.setupAutoCalculation(form);
    
    return form;
  }

  private setupAutoCalculation(form: FormGroup): void {
    // Watchers para recalcular el costo total
    const fieldsToWatch = ['days', 'rate_per_day'];
    
    fieldsToWatch.forEach(fieldName => {
      form.get(fieldName)?.valueChanges.subscribe(() => {
        this.calculateTotalCost();
      });
    });
  }

  private calculateTotalCost(): void {
    const days = this.activityForm.get('days')?.value || 0;
    const ratePerDay = this.activityForm.get('rate_per_day')?.value || 0;
    
    const totalCost = days * ratePerDay;
    
    // Actualizar el campo total_cost sin disparar eventos adicionales
    this.activityForm.get('total_cost')?.setValue(totalCost, { emitEvent: false });
  }

  async loadActivities(): Promise<void> {
    this.isLoading.set(true);
    try {
      const currentFarmId = this._farmStateService.getCurrentFarmIdOrDefault();
      const response = await this._activitiesService.getAllActivities(currentFarmId).toPromise();
      if (response?.error) throw new Error(response.error.message);
      this.activities.set(response?.data || []);
      this.updatePagination();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error loading activities:', error);
      toast.error('Error al cargar actividades', { description: errorMessage });
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadCollaborators(): Promise<void> {
    try {
      const currentFarmId = this._farmStateService.getCurrentFarmIdOrDefault();
      const response = await this._collaboratorsService.getAllCollaborators(currentFarmId).toPromise();
      
      if (response?.error) {
        throw new Error(response.error.message);
      }
      
      const collaboratorsData = response?.data || [];
      this.collaborators.set(collaboratorsData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error loading collaborators:', error);
      toast.error('Error al cargar colaboradores', { description: errorMessage });
      // Set empty array to prevent undefined errors
      this.collaborators.set([]);
    }
  }

  async loadPlots(): Promise<void> {
    try {
      const currentFarmId = this._farmStateService.getCurrentFarmIdOrDefault();
      const response = await this._plotsService.getAllPlots(currentFarmId).toPromise();
      
      if (response?.error) {
        throw new Error(response.error.message);
      }
      
      const plotsData = response?.data || [];
      this.plots.set(plotsData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error loading plots:', error);
      toast.error('Error al cargar lotes', { description: errorMessage });
      // Set empty array to prevent undefined errors
      this.plots.set([]);
    }
  }

  updatePagination(): void {
    const filteredCount = this.filteredActivities.length;
    const pages = Math.ceil(filteredCount / this.pageSize());
    this.totalPages.set(pages);
    
    if (this.currentPage() >= pages && pages > 0) {
      this.currentPage.set(pages - 1);
    }
  }

  openSidePanel(activity?: ActivityEntity): void {
    this.showSidePanel.set(true);
    if (activity && activity.id) {
      // Edit mode
      this.isEditMode.set(true);
      this.selectedActivity.set(activity);
      // Prepare activity data with safe defaults
      const activityData = {
        farm_id: activity.farm_id || this._farmStateService.getCurrentFarmIdOrDefault(),
        collaborator_id: activity.collaborator_id || '',
        plot_id: activity.plot_id || null,
        type: activity.type || '',
        date: activity.date ? DateUtils.formatForDatepicker(activity.date) : new Date(),
        days: activity.days || 1,
        area_worked: activity.area_worked || null,
        payment_type: activity.payment_type || 'libre',
        rate_per_day: activity.rate_per_day || 0,
        total_cost: activity.total_cost || 0,
        materials_used: activity.materials_used || '',
        weather_conditions: activity.weather_conditions || '',
        quality_rating: activity.quality_rating || null,
        notes: activity.notes || ''
      };
      this.activityForm.patchValue(activityData);
      // Recalcular el costo después de cargar los datos
      setTimeout(() => this.calculateTotalCost(), 0);
    } else {
      // Create mode
      this.isEditMode.set(false);
      this.selectedActivity.set(null);
      // Set safe default values
      const currentFarmId = this._farmStateService.getCurrentFarmIdOrDefault();
      const defaultData = { 
        farm_id: currentFarmId,
        collaborator_id: '',
        plot_id: null,
        type: '',
        date: new Date(),
        days: 1,
        area_worked: null,
        payment_type: 'libre',
        rate_per_day: 0,
        total_cost: 0,
        materials_used: '',
        weather_conditions: '',
        quality_rating: null,
        notes: ''
      };
      this.activityForm.patchValue(defaultData);
      // Recalcular el costo después de cargar los valores por defecto
      setTimeout(() => this.calculateTotalCost(), 0);
    }
  }

  closeSidePanel(): void {
    this.showSidePanel.set(false);
    this.activityForm.reset();
    this.selectedActivity.set(null);
    this.isEditMode.set(false);
  }

  async onSaveActivity(): Promise<void> {
    if (this.activityForm.invalid) {
      toast.error('Datos inválidos', { description: 'Por favor revisa los campos del formulario.' });
      return;
    }
    this.isLoading.set(true);
    try {
      // Preparar datos con fecha formateada
      const formData = { ...this.activityForm.value };
      
      // Formatear fecha si es necesario
      if (formData.date instanceof Date) {
        formData.date = formData.date.toISOString().split('T')[0];
      }

      if (this.isEditMode() && this.selectedActivity()?.id) {
        // Update
        const updateRequest: UpdateActivityRequest = {
          id: this.selectedActivity()!.id!,
          ...formData
        };
        const response = await this._activitiesService.updateActivity(updateRequest).toPromise();
        if (response?.error) throw new Error(response.error.message);
        toast.success('Actividad actualizada exitosamente');
      } else {
        // Create
        const createRequest: CreateActivityRequest = formData;
        const response = await this._activitiesService.createActivity(createRequest).toPromise();
        if (response?.error) throw new Error(response.error.message);
        toast.success('Actividad creada exitosamente');
      }
      
      this.closeSidePanel();
      await this.loadActivities();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error saving activity:', error);
      toast.error('Error al guardar actividad', { description: errorMessage });
    } finally {
      this.isLoading.set(false);
    }
  }

  async onDeleteActivity(activity: ActivityEntity): Promise<void> {
    if (!activity.id) return;
    
    if (confirm(`¿Estás seguro de eliminar esta actividad? Esta acción no se puede deshacer.`)) {
      try {
        this.isLoading.set(true);
        const response = await this._activitiesService.deleteActivity(activity.id).toPromise();
        if (response?.error) throw new Error(response.error.message);
        toast.success('Actividad eliminada exitosamente');
        await this.loadActivities();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error deleting activity:', error);
        toast.error('Error al eliminar actividad', { description: errorMessage });
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  // Métodos de vista
  switchView(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  // Métodos de filtrado
  clearFilters(): void {
    this.filterCollaborator = '';
    this.filterType = '';
    this.filterDate = '';
    this.filterPlot = '';
    this.searchTerm = '';
    this.updatePagination();
  }

  hasFilters(): boolean {
    return !!(this.filterCollaborator || this.filterType || this.filterDate || this.filterPlot || this.searchTerm);
  }

  onSearchChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchTerm = target?.value || '';
    this.searchTerm = searchTerm;
    this.updatePagination();
  }

  get filteredActivities(): ActivityEntity[] {
    let filtered = this.activities();

    // Filtro por término de búsqueda
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(activity => {
        const collaboratorName = this.getCollaboratorName(activity.collaborator_id).toLowerCase();
        const activityTypeName = this.getActivityTypeName(activity.type).toLowerCase();
        const plotName = this.getPlotName(activity.plot_id).toLowerCase();
        const notes = activity.notes?.toLowerCase() || '';
        const materials = activity.materials_used?.toLowerCase() || '';
        
        return collaboratorName.includes(search) ||
               activityTypeName.includes(search) ||
               plotName.includes(search) ||
               notes.includes(search) ||
               materials.includes(search);
      });
    }

    if (this.filterCollaborator) {
      filtered = filtered.filter(activity => activity.collaborator_id === this.filterCollaborator);
    }

    if (this.filterType) {
      filtered = filtered.filter(activity => activity.type === this.filterType);
    }

    if (this.filterPlot) {
      filtered = filtered.filter(activity => activity.plot_id === this.filterPlot);
    }

    if (this.filterDate) {
      // Asegurar que tratamos el filterDate como fecha local sin zona horaria
      const filterDateStr = DateUtils.formatToLocalDate(new Date(this.filterDate));
      filtered = filtered.filter(activity => {
        // Extraer solo la parte de fecha de la actividad (sin hora)
        const activityDateStr = activity.date.split('T')[0]; // Extraer YYYY-MM-DD
        return activityDateStr === filterDateStr;
      });
    }

    return filtered;
  }

  get paginatedActivities(): ActivityEntity[] {
    const filtered = this.filteredActivities;
    const startIndex = this.currentPage() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return filtered.slice(startIndex, endIndex);
  }

  // Métodos de utilidad
  getCollaboratorName(collaboratorId: string): string {
    const collaborator = this.collaborators().find(c => c.id === collaboratorId);
    return collaborator ? `${collaborator.first_name} ${collaborator.last_name}` : 'Desconocido';
  }

  getPlotName(plotId?: string): string {
    if (!plotId) return 'Sin lote específico';
    const plot = this.plots().find(p => p.id === plotId);
    return plot ? plot.name : 'Lote desconocido';
  }

  getActivityTypeName(type: string): string {
    const option = this.activityTypeOptions.find(opt => opt.value === type);
    if (!option) return type;
    
    const translation = this._translateService.instant(option.labelKey);
    // Si la traducción falló, devolver solo la clave sin el prefijo "activities.types."
    if (translation === option.labelKey) {
      return option.labelKey.split('.').pop() || type;
    }
    return translation;
  }

  getActivityIcon(type: string): string {
    const option = this.activityTypeOptions.find(opt => opt.value === type);
    return option ? option.icon : 'event';
  }

  formatDate(dateString: string): string {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd/MM/yyyy') : 'Fecha inválida';
    } catch {
      return 'Fecha inválida';
    }
  }

  // Getters para el template
  get availableFarms(): FarmEntity[] {
    return this._farmStateService.farms();
  }

  get availableCollaborators(): CollaboratorEntity[] {
    return this.collaborators();
  }

  get availablePlots(): PlotEntity[] {
    return this.plots();
  }

  // Callback para actualizar lotes cuando cambia la finca
  onFarmChange(farmId: string): void {
    if (farmId) {
      this.loadPlotsByFarm(farmId);
      // Limpiar selección de lote
      this.activityForm.patchValue({ plot_id: null });
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
} 