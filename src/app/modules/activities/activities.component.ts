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
import { ActivityEntity, ActivityType, ContractType } from '@/app/shared/models/activity.models';
import { CollaboratorsService } from '../collaborators/services/collaborators.service';
import { CollaboratorEntity } from '@/app/shared/models/collaborator.models';
import { FORM_CONSTRAINTS } from '@/app/shared/constants/form-constrains';
import { DateUtils } from '@/app/shared/utils/validators';

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

  // Filtros
  filterCollaborator: string = '';
  filterType: string = '';
  filterDate: string = '';

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
    const today = new Date();
    return this._formBuilder.group({
      collaborator_id: ['', Validators.required],
      type: ['', Validators.required],
      date: [today, Validators.required],
      start_time: [''],
      end_time: [''],
      days: [1, [Validators.required, Validators.min(0.1)]],
      area_worked: [null],
      payment_type: ['', Validators.required],
      rate_per_day: [0, [Validators.required, Validators.min(0)]],
      total_cost: [0, [Validators.required, Validators.min(0)]],
      materials_used: [''],
      weather_conditions: [''],
      quality_rating: [null],
      notes: ['']
    });
  }

  async loadActivities(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await this._activitiesService.getAllActivities().toPromise();
      if (response?.error) throw new Error(response.error.message);
      this.activities.set(response?.data || []);
    } catch (error: any) {
      console.error('Error loading activities:', error);
      toast.error('Error al cargar actividades', { description: error.message });
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadCollaborators(): Promise<void> {
    try {
      const response = await this._collaboratorsService.getAllCollaborators().toPromise();
      
      if (response?.error) {
        throw new Error(response.error.message);
      }
      
      const collaboratorsData = response?.data || [];
      this.collaborators.set(collaboratorsData);
    } catch (error: any) {
      console.error('❌ Error loading collaborators:', error);
      toast.error('Error al cargar colaboradores', { description: error.message });
      // Set empty array to prevent undefined errors
      this.collaborators.set([]);
    }
  }

  openSidePanel(activity?: ActivityEntity): void {
    this.showSidePanel.set(true);
    if (activity && activity.id) {
      // Edit mode
      this.isEditMode.set(true);
      this.selectedActivity.set(activity);
      // Prepare activity data with safe defaults
      const activityData: any = {
        collaborator_id: activity.collaborator_id || '',
        type: activity.type || '',
        date: activity.date ? DateUtils.formatForDatepicker(activity.date) : new Date(),
        start_time: activity.start_time || '',
        end_time: activity.end_time || '',
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
        start_time: '',
        end_time: '',
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
      start_time: '',
      end_time: '',
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

  async onSaveActivity(): Promise<void> {
    if (this.activityForm.invalid) {
      toast.error('Datos inválidos', { description: 'Por favor revisa los campos del formulario.' });
      return;
    }
    this.isLoading.set(true);
    try {
      // Preparar datos con fecha formateada
      const formData = { ...this.activityForm.value };

      // Solución: convertir strings vacíos a null para campos de hora
      if (formData.start_time === '') formData.start_time = null;
      if (formData.end_time === '') formData.end_time = null;

      // Usar DateUtils para guardar la fecha sin desfase
      formData.date = DateUtils.formatForBackend(formData.date);

      if (this.isEditMode() && this.selectedActivity()) {
        const updateRequest = { ...formData, id: this.selectedActivity()!.id };
        const response = await this._activitiesService.updateActivity(updateRequest).toPromise();
        if (response?.error) throw new Error(response.error.message);
        toast.success('Actividad actualizada');
      } else {
        const response = await this._activitiesService.createActivity(formData).toPromise();
        if (response?.error) throw new Error(response.error.message);
        toast.success('Actividad creada');
      }
      this.closeSidePanel();
      await this.loadActivities();
    } catch (error: any) {
      console.error('Error saving activity:', error);
      toast.error('Error al guardar actividad', { description: error.message });
    } finally {
      this.isLoading.set(false);
    }
  }

  onEditActivity(activity: ActivityEntity): void {
    this.openSidePanel(activity);
  }

  onViewActivity(activity: ActivityEntity): void {
    // Implementar lógica para ver detalles en modal o navegar a detalle
    console.log('Ver actividad:', activity);
    toast.info('Funcionalidad de vista detallada', { description: 'Próximamente disponible' });
  }

  async onDeleteActivity(activity: ActivityEntity): Promise<void> {
    if (!activity.id) return;
    if (!confirm('¿Seguro que deseas eliminar esta actividad?')) return;
    this.isLoading.set(true);
    try {
      const response = await this._activitiesService.deleteActivity(activity.id).toPromise();
      if (response?.error) throw new Error(response.error.message);
      toast.success('Actividad eliminada');
      await this.loadActivities();
    } catch (error: any) {
      toast.error('Error al eliminar actividad', { description: error.message });
    } finally {
      this.isLoading.set(false);
    }
  }

  clearFilters(): void {
    this.filterCollaborator = '';
    this.filterType = '';
    this.filterDate = '';
  }

  hasFilters(): boolean {
    return !!(this.filterCollaborator || this.filterType || this.filterDate);
  }

  // Filtros (puedes expandir esta lógica según necesidades)
  get filteredActivities(): ActivityEntity[] {
    let acts = this.activities();
    if (this.filterCollaborator) {
      acts = acts.filter(a => a.collaborator_id === this.filterCollaborator);
    }
    if (this.filterType) {
      acts = acts.filter(a => a.type === this.filterType);
    }
    if (this.filterDate) {
      let filterDateStr = '';
      if (typeof this.filterDate === 'object' && this.filterDate !== null && !isNaN((this.filterDate as Date).getTime())) {
        filterDateStr = DateUtils.formatToLocalDate(this.filterDate as Date);
      } else if (typeof this.filterDate === 'string') {
        const d = DateUtils.parseLocalDate(this.filterDate);
        filterDateStr = d ? DateUtils.formatToLocalDate(d) : this.filterDate;
      }
      acts = acts.filter(a => {
        const activityDateStr = DateUtils.formatForBackend(a.date);
        return activityDateStr === filterDateStr;
      });
    }
    return acts;
  }

  getCollaboratorName(collaboratorId: string): string {
    if (!collaboratorId) return 'Sin asignar';
    
    const collaboratorsArray = this.collaborators();
    if (!collaboratorsArray || collaboratorsArray.length === 0) {
      return `ID: ${collaboratorId}`;
    }
    
    const collaborator = collaboratorsArray.find(c => c.id === collaboratorId);
    if (!collaborator) {
      console.warn('Collaborator not found for ID:', collaboratorId);
      return `ID: ${collaboratorId}`;
    }
    
    const firstName = collaborator.first_name || '';
    const lastName = collaborator.last_name || '';
    
    if (!firstName && !lastName) {
      return `ID: ${collaboratorId}`;
    }
    
    return `${firstName} ${lastName}`.trim();
  }

  getActivityIcon(type: string): string {
    const iconMap: Record<string, string> = {
      fertilization: 'eco',
      fumigation: 'bug_report',
      pruning: 'content_cut',
      weeding: 'grass',
      planting: 'park',
      maintenance: 'build',
      other: 'work'
    };
    return iconMap[type] || 'work';
  }

  getActivityTypeName(type: string): string {
    const nameMap: Record<string, string> = {
      fertilization: 'Fertilización',
      fumigation: 'Fumigación',
      pruning: 'Poda',
      weeding: 'Deshierbe',
      planting: 'Siembra',
      maintenance: 'Mantenimiento',
      other: 'Otras'
    };
    return nameMap[type] || type;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Sin fecha';
    try {
      return DateUtils.formatToDisplay(dateString);
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Fecha inválida';
    }
  }

  getStarsArray(rating: number): boolean[] {
    const stars: boolean[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
    }
    return stars;
  }

  // Debug getter para verificar datos
  get debugInfo() {
    return {
      collaborators: this.collaborators().length,
      activities: this.activities().length,
      showPanel: this.showSidePanel(),
      isLoading: this.isLoading()
    };
  }

  // TrackBy function for better performance
  trackByCollaboratorId(index: number, item: CollaboratorEntity): string {
    return item.id || index.toString();
  }
} 