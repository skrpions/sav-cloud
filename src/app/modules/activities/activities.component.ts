import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';
import { format, isValid } from 'date-fns';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarComponent } from '@/app/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '@/app/shared/components/header/header.component';
import { ActivitiesService } from './services/activities.service';
import { ActivityEntity } from '@/app/shared/models/activity.models';
import { CollaboratorsService } from '../collaborators/services/collaborators.service';
import { CollaboratorEntity } from '@/app/shared/models/collaborator.models';
import { DateUtils } from '@/app/shared/utils/validators';
import { TEMP_FARM_CONSTANTS } from '@/app/shared/constants/form-constrains';

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
  private _formBuilder = inject(FormBuilder);
  private _translateService = inject(TranslateService);
  private _cdr = inject(ChangeDetectorRef);

  activities = signal<ActivityEntity[]>([]);
  collaborators = signal<CollaboratorEntity[]>([]);
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

  // Formulario reactivo para el panel lateral
  activityForm: FormGroup;

  constructor() {
    this.activityForm = this.createActivityForm();
  }

  async ngOnInit(): Promise<void> {
    // Load collaborators first, then activities
    await this.loadCollaborators();
    await this.loadActivities();
  }

  private createActivityForm(): FormGroup {
    return this._formBuilder.group({
      collaborator_id: ['', Validators.required],
      type: ['', Validators.required],
      date: [new Date(), Validators.required],
      days: [1, [Validators.required, Validators.min(0.1)]],
      payment_type: ['', Validators.required],
      rate_per_day: [0, [Validators.required, Validators.min(0)]],
      total_cost: [0, [Validators.required, Validators.min(0)]],
      area_worked: [null, [Validators.min(0)]],
      materials_used: [''],
      weather_conditions: [''],
      quality_rating: [null, [Validators.min(1), Validators.max(5)]],
      notes: ['']
    });
  }

  async loadActivities(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await this._activitiesService.getAllActivities(TEMP_FARM_CONSTANTS.DEFAULT_FARM_ID).toPromise();
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
      const response = await this._collaboratorsService.getAllCollaborators(TEMP_FARM_CONSTANTS.DEFAULT_FARM_ID).toPromise();
      
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

  // Métodos de vista y paginación
  switchView(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.currentPage.set(0);
    this.updatePagination();
  }

  public updatePagination(): void {
    const filtered = this.filteredActivities;
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

  openSidePanel(activity?: ActivityEntity): void {
    this.showSidePanel.set(true);
    if (activity && activity.id) {
      // Edit mode
      this.isEditMode.set(true);
      this.selectedActivity.set(activity);
      // Prepare activity data with safe defaults
      const activityData = {
        collaborator_id: activity.collaborator_id || '',
        type: activity.type || '',
        date: activity.date ? DateUtils.formatForDatepicker(activity.date) : new Date(),
        days: activity.days || 1,
        area_worked: activity.area_worked || null,
        payment_type: activity.payment_type || '',
        rate_per_day: activity.rate_per_day || 0,
        total_cost: activity.total_cost || 0,
        materials_used: activity.materials_used || '',
        weather_conditions: activity.weather_conditions || '',
        quality_rating: activity.quality_rating || null,
        notes: activity.notes || ''
      };
      this.activityForm.patchValue(activityData);
    } else {
      // Create mode
      this.isEditMode.set(false);
      this.selectedActivity.set(null);
      // Set safe default values
      const defaultData = { 
        collaborator_id: '',
        type: '',
        date: new Date(),
        days: 1,
        area_worked: null,
        payment_type: '',
        rate_per_day: 0,
        total_cost: 0,
        materials_used: '',
        weather_conditions: '',
        quality_rating: null,
        notes: ''
      };
      this.activityForm.patchValue(defaultData);
    }
  }

  closeSidePanel(): void {
    this.showSidePanel.set(false);
    this.activityForm.patchValue({ 
      collaborator_id: '',
      type: '',
      date: new Date(),
      days: 1,
      area_worked: null,
      payment_type: '',
      rate_per_day: 0,
      total_cost: 0,
      materials_used: '',
      weather_conditions: '',
      quality_rating: null,
      notes: ''
    });
    this.selectedActivity.set(null);
    this.isEditMode.set(false);
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      this.closeSidePanel();
    }
  }

  async onSaveActivity(): Promise<void> {
    if (this.activityForm.invalid) {
      toast.error('Datos inválidos', { description: 'Por favor revisa los campos del formulario.' });
      return;
    }
    this.isLoading.set(true);
    try {
      // Preparar datos con fecha formateada
      const formData = { 
        ...this.activityForm.value,
        farm_id: TEMP_FARM_CONSTANTS.DEFAULT_FARM_ID // Agregar farm_id requerido
      };

      if (this.isEditMode() && this.selectedActivity()?.id) {
        // Update
        formData.id = this.selectedActivity()!.id;
        const response = await this._activitiesService.updateActivity(formData).toPromise();
        if (response?.error) throw new Error(response.error.message);
        toast.success('Actividad actualizada exitosamente');
      } else {
        // Create
        const response = await this._activitiesService.createActivity(formData).toPromise();
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

  onEditActivity(activity: ActivityEntity): void {
    this.openSidePanel(activity);
  }

  onViewActivity(activity: ActivityEntity): void {
    // TODO: Implementar vista de detalles de la actividad
    console.log('Ver detalles de:', activity);
    // Por ahora, simplemente editamos
    this.onEditActivity(activity);
  }

  async onDeleteActivity(activity: ActivityEntity): Promise<void> {
    if (!activity.id) return;

    const confirmed = confirm('¿Estás seguro de eliminar esta actividad?');
    if (!confirmed) return;

    try {
      const response = await this._activitiesService.deleteActivity(activity.id).toPromise();
      if (response?.error) throw new Error(response.error.message);
      toast.success('Actividad eliminada exitosamente');
      await this.loadActivities();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error deleting activity:', error);
      toast.error('Error al eliminar actividad', { description: errorMessage });
    }
  }

  clearFilters(): void {
    this.filterCollaborator = '';
    this.filterType = '';
    this.filterDate = '';
    this.currentPage.set(0);
    this.updatePagination();
  }

  hasFilters(): boolean {
    return !!(this.filterCollaborator || this.filterType || this.filterDate);
  }

  get filteredActivities(): ActivityEntity[] {
    let filtered = this.activities();

    if (this.filterCollaborator) {
      filtered = filtered.filter(activity => activity.collaborator_id === this.filterCollaborator);
    }

    if (this.filterType) {
      filtered = filtered.filter(activity => activity.type === this.filterType);
    }

    if (this.filterDate) {
      const filterDateStr = DateUtils.formatToLocalDate(new Date(this.filterDate));
      filtered = filtered.filter(activity => {
        const activityDateStr = DateUtils.formatToLocalDate(new Date(activity.date));
        return activityDateStr === filterDateStr;
      });
    }

    return filtered;
  }

  get paginatedActivities(): ActivityEntity[] {
    const filtered = this.filteredActivities;
    
    if (this.viewMode() === 'cards') {
      return filtered; // Sin paginación en vista de tarjetas
    }
    
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  }

  getCollaboratorName(collaboratorId: string): string {
    if (!collaboratorId) {
      return 'Colaborador no especificado';
    }
    
    const collaborator = this.collaborators().find(c => c.id === collaboratorId);
    if (!collaborator) {
      console.warn(`Collaborator not found for ID: ${collaboratorId}`);
      return `Colaborador ${collaboratorId}`;
    }
    
    const firstName = collaborator.first_name || '';
    const lastName = collaborator.last_name || '';
    
    if (!firstName && !lastName) {
      return `Colaborador ${collaboratorId}`;
    }
    
    return `${firstName} ${lastName}`.trim();
  }

  getActivityIcon(type: string): string {
    const icons = {
      fertilization: 'eco',
      fumigation: 'bug_report', 
      pruning: 'content_cut',
      weeding: 'grass',
      planting: 'park',
      maintenance: 'build',
      other: 'more_horiz'
    };
    return icons[type as keyof typeof icons] || 'event';
  }

  getActivityTypeName(type: string): string {
    const names = {
      fertilization: 'Fertilización',
      fumigation: 'Fumigación',
      pruning: 'Poda',
      weeding: 'Deshierbe',
      planting: 'Siembra',
      maintenance: 'Mantenimiento',
      other: 'Otras'
    };
    return names[type as keyof typeof names] || type;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return dateString;
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }

  getStarsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < rating);
  }

  // Debug information (useful for development)
  get debugInfo() {
    return {
      activitiesCount: this.activities().length,
      collaboratorsCount: this.collaborators().length,
      isLoading: this.isLoading(),
      hasFilters: this.hasFilters()
    };
  }

  // TrackBy functions para mejor rendimiento
  trackByCollaboratorId(index: number, item: CollaboratorEntity): string {
    return item.id || index.toString();
  }

  trackByActivityId(index: number, item: ActivityEntity): string {
    return item.id || index.toString();
  }
} 