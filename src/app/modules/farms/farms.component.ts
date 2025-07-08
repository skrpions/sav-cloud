import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarComponent } from '@/app/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '@/app/shared/components/header/header.component';
import { FarmsService } from './services/farms.service';
import { 
  FarmEntity, 
  CreateFarmRequest, 
  UpdateFarmRequest,
  DEPARTMENT_OPTIONS,
  CERTIFICATION_OPTIONS,
  FARM_CONSTRAINTS,
  formatArea,
  formatAltitudeRange,
  isValidColombianCoordinates
} from '@/app/shared/models/farm.models';
import { SidebarItem } from '@/app/shared/models/ui.models';

export type ViewMode = 'list' | 'cards';

@Component({
  selector: 'app-farms',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    TranslateModule,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './farms.component.html',
  styleUrl: './farms.component.scss'
})
export class FarmsComponent implements OnInit {
  private _farmsService = inject(FarmsService);
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _translateService = inject(TranslateService);

  // Signals para el estado del componente
  farms = signal<FarmEntity[]>([]);
  isLoading = signal(false);
  showSidePanel = signal(false);
  isEditMode = signal(false);
  selectedFarm = signal<FarmEntity | null>(null);
  searchTerm = signal('');

  // Vista y paginación
  viewMode = signal<ViewMode>('cards');
  currentPage = signal(0);
  pageSize = signal(6);
  totalPages = signal(0);

  // Filtros
  filterDepartment = '';

  // Formulario reactivo
  farmForm: FormGroup;

  // Opciones para el template
  departmentOptions = DEPARTMENT_OPTIONS;
  certificationOptions = CERTIFICATION_OPTIONS;
  constraints = FARM_CONSTRAINTS;

  constructor() {
    this.farmForm = this.createFarmForm();
  }

  async ngOnInit(): Promise<void> {
    await this.loadFarms();
    this.updatePagination();
  }

  private createFarmForm(): FormGroup {
    return this._formBuilder.group({
      name: ['', [
        Validators.required, 
        Validators.minLength(this.constraints.name.minLength),
        Validators.maxLength(this.constraints.name.maxLength),
        Validators.pattern(this.constraints.name.pattern)
      ]],
      description: ['', [Validators.maxLength(this.constraints.description.maxLength)]],
      address: ['', [Validators.maxLength(this.constraints.address.maxLength)]],
      municipality: ['', [Validators.maxLength(this.constraints.municipality.maxLength)]],
      department: [''],
      country: ['Colombia'],
      total_area: [null, [
        Validators.min(this.constraints.totalArea.min),
        Validators.max(this.constraints.totalArea.max)
      ]],
      altitude_min: [null, [
        Validators.min(this.constraints.altitude.min),
        Validators.max(this.constraints.altitude.max)
      ]],
      altitude_max: [null, [
        Validators.min(this.constraints.altitude.min),
        Validators.max(this.constraints.altitude.max)
      ]],
      latitude: [null, [
        Validators.min(this.constraints.coordinates.latitudeMin),
        Validators.max(this.constraints.coordinates.latitudeMax)
      ]],
      longitude: [null, [
        Validators.min(this.constraints.coordinates.longitudeMin),
        Validators.max(this.constraints.coordinates.longitudeMax)
      ]],
      phone: ['', [
        Validators.minLength(this.constraints.phone.minLength),
        Validators.maxLength(this.constraints.phone.maxLength),
        Validators.pattern(this.constraints.phone.pattern)
      ]],
      email: ['', [
        Validators.email,
        Validators.maxLength(this.constraints.email.maxLength),
        Validators.pattern(this.constraints.email.pattern)
      ]],
      established_date: [null],
      // Certificaciones como FormGroup anidado
      certifications: this._formBuilder.group({
        organic: [false],
        fair_trade: [false],
        rainforest_alliance: [false],
        utz_certified: [false],
        c_cafe_practices: [false],
        specialty_coffee: [false],
        '4c_association': [false]
      })
    }, { 
      validators: [this.coordinatesValidator, this.altitudeRangeValidator] 
    });
  }

  // Validador personalizado para coordenadas de Colombia
  private coordinatesValidator(control: FormGroup) {
    const lat = control.get('latitude')?.value;
    const lng = control.get('longitude')?.value;
    
    if ((lat || lng) && !isValidColombianCoordinates(lat, lng)) {
      return { invalidColombianCoordinates: true };
    }
    
    return null;
  }

  // Validador para rango de altitud
  private altitudeRangeValidator(control: FormGroup) {
    const min = control.get('altitude_min')?.value;
    const max = control.get('altitude_max')?.value;
    
    if (min && max && min >= max) {
      return { invalidAltitudeRange: true };
    }
    
    return null;
  }

  async loadFarms(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      const response = await this._farmsService.getAllFarms().toPromise();
      
      if (response?.error) {
        throw new Error(response.error.message);
      }

      const farmsList = response?.data || [];
      this.farms.set(farmsList);
      this.updatePagination();

    } catch (error: unknown) {
      console.error('Error loading farms:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar las fincas';
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
    const filteredCount = this.filteredFarms.length;
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

  openSidePanel(farm?: FarmEntity): void {
    if (farm) {
      // Modo edición
      this.selectedFarm.set(farm);
      this.isEditMode.set(true);
      
      // Cargar datos en el formulario
      const certifications = farm.certifications || {};
      
      this.farmForm.patchValue({
        name: farm.name,
        description: farm.description || '',
        address: farm.address || '',
        municipality: farm.municipality || '',
        department: farm.department || '',
        country: farm.country || 'Colombia',
        total_area: farm.total_area,
        altitude_min: farm.altitude_min,
        altitude_max: farm.altitude_max,
        latitude: farm.latitude,
        longitude: farm.longitude,
        phone: farm.phone || '',
        email: farm.email || '',
        established_date: farm.established_date ? new Date(farm.established_date) : null,
        certifications: {
          organic: certifications['organic'] || false,
          fair_trade: certifications['fair_trade'] || false,
          rainforest_alliance: certifications['rainforest_alliance'] || false,
          utz_certified: certifications['utz_certified'] || false,
          c_cafe_practices: certifications['c_cafe_practices'] || false,
          specialty_coffee: certifications['specialty_coffee'] || false,
          '4c_association': certifications['4c_association'] || false
        }
      });
    } else {
      // Modo creación
      this.selectedFarm.set(null);
      this.isEditMode.set(false);
      this.farmForm.reset({
        country: 'Colombia',
        certifications: {
          organic: false,
          fair_trade: false,
          rainforest_alliance: false,
          utz_certified: false,
          c_cafe_practices: false,
          specialty_coffee: false,
          '4c_association': false
        }
      });
    }
    
    this.showSidePanel.set(true);
  }

  closeSidePanel(): void {
    this.showSidePanel.set(false);
    this.selectedFarm.set(null);
    this.isEditMode.set(false);
    this.farmForm.reset({
      country: 'Colombia',
      certifications: {
        organic: false,
        fair_trade: false,
        rainforest_alliance: false,
        utz_certified: false,
        c_cafe_practices: false,
        specialty_coffee: false,
        '4c_association': false
      }
    });
  }

  async onSaveFarm(): Promise<void> {
    if (this.farmForm.invalid) {
      this.markFormGroupTouched(this.farmForm);
      toast.error('Formulario inválido', { 
        description: 'Por favor revisa los campos marcados en rojo.' 
      });
      return;
    }

    this.isLoading.set(true);

    try {
      const formData = this.farmForm.value;
      
      // Formatear la fecha
      if (formData.established_date) {
        formData.established_date = formData.established_date.toISOString().split('T')[0];
      }

      if (this.isEditMode() && this.selectedFarm()?.id) {
        // Actualizar finca existente
        const updateRequest: UpdateFarmRequest = {
          id: this.selectedFarm()!.id!,
          ...formData
        };

        const response = await this._farmsService.updateFarm(updateRequest).toPromise();
        
        if (response?.error) {
          throw new Error(response.error.message);
        }

        toast.success('Finca actualizada', {
          description: 'La información de la finca se ha actualizado exitosamente.'
        });

      } else {
        // Crear nueva finca
        const createRequest: CreateFarmRequest = formData;
        
        const response = await this._farmsService.createFarm(createRequest).toPromise();
        
        if (response?.error) {
          throw new Error(response.error.message);
        }

        toast.success('Finca creada', {
          description: 'La nueva finca se ha registrado exitosamente.'
        });
      }

      // Cerrar panel y recargar lista
      this.closeSidePanel();
      await this.loadFarms();

    } catch (error: unknown) {
      console.error('Error saving farm:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar la finca';
      toast.error('Error', {
        description: errorMessage,
        duration: 4000
      });
      
    } finally {
      this.isLoading.set(false);
    }
  }

  async onDeleteFarm(farm: FarmEntity): Promise<void> {
    if (!farm.id) return;

    // Verificar si la finca tiene datos relacionados
    try {
      const dependencies = await this._farmsService.checkFarmDependencies(farm.id).toPromise();
      
      if (dependencies?.hasActivities || dependencies?.hasCollaborators || dependencies?.hasSettings) {
        toast.warning('No se puede eliminar', {
          description: 'Esta finca tiene datos relacionados. Primero debes eliminar actividades, colaboradores y configuraciones.'
        });
        return;
      }

      if (confirm(`¿Estás seguro de eliminar la finca "${farm.name}"? Esta acción no se puede deshacer.`)) {
        this.isLoading.set(true);
        
        const response = await this._farmsService.deleteFarm(farm.id).toPromise();
        
        if (response?.error) {
          throw new Error(response.error.message);
        }

        toast.success('Finca eliminada', {
          description: 'La finca se ha eliminado exitosamente.'
        });

        await this.loadFarms();
      }

    } catch (error: unknown) {
      console.error('Error deleting farm:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar la finca';
      toast.error('Error', {
        description: errorMessage,
        duration: 4000
      });
      
    } finally {
      this.isLoading.set(false);
    }
  }

  clearFilters(): void {
    this.filterDepartment = '';
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.updatePagination();
  }

  hasFilters(): boolean {
    return !!(this.filterDepartment || this.searchTerm());
  }

  get filteredFarms(): FarmEntity[] {
    let filtered = this.farms();

    // Filtro por término de búsqueda
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(farm => 
        farm.name.toLowerCase().includes(search) ||
        farm.municipality?.toLowerCase().includes(search) ||
        farm.department?.toLowerCase().includes(search) ||
        farm.description?.toLowerCase().includes(search)
      );
    }

    // Filtro por departamento
    if (this.filterDepartment) {
      filtered = filtered.filter(farm => farm.department === this.filterDepartment);
    }

    return filtered;
  }

  get paginatedFarms(): FarmEntity[] {
    const filtered = this.filteredFarms;
    const startIndex = this.currentPage() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return filtered.slice(startIndex, endIndex);
  }

  onSearchChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchTerm = target?.value || '';
    this.searchTerm.set(searchTerm);
    this.updatePagination();
  }

  onSidebarItemClicked(item: SidebarItem): void {
    if (item.route) {
      this._router.navigate([item.route]);
    }
  }

  // Métodos de utilidad para el template
  formatArea = formatArea;
  formatAltitudeRange = formatAltitudeRange;

  isFieldInvalid(fieldName: string): boolean {
    const field = this.farmForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.farmForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
      if (field.errors['email']) return 'Formato de email inválido';
      if (field.errors['pattern']) return 'Formato inválido';
    }

    // Errores del formulario completo
    if (this.farmForm.errors) {
      if (this.farmForm.errors['invalidColombianCoordinates']) {
        return 'Las coordenadas deben estar dentro de Colombia';
      }
      if (this.farmForm.errors['invalidAltitudeRange']) {
        return 'La altitud mínima debe ser menor que la máxima';
      }
    }

    return '';
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

  getCertificationsList(certifications?: Record<string, boolean>): string[] {
    if (!certifications) return [];
    
    return Object.entries(certifications)
      .filter(([, value]) => value)
      .map(([key]) => {
        const cert = this.certificationOptions.find(c => c.key === key);
        return cert?.label || key;
      });
  }

  trackByFarmId(index: number, item: FarmEntity): string {
    return item.id || index.toString();
  }

  getLocationString(farm: FarmEntity): string {
    return [farm.municipality, farm.department].filter(Boolean).join(', ');
  }
}