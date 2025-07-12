import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarComponent } from '@/app/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '@/app/shared/components/header/header.component';
import { ActionButtonComponent } from '@/app/shared/components/action-button/action-button.component';
import { FarmsService } from './services/farms.service';
import { FarmStateService } from '@/app/shared/services/farm-state.service';
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
    HeaderComponent,
    ActionButtonComponent
  ],
  templateUrl: './farms.component.html',
  styleUrl: './farms.component.scss'
})
export class FarmsComponent implements OnInit {
  private _farmsService = inject(FarmsService);
  private _farmStateService = inject(FarmStateService);
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
  formSubmitted = signal(false); // Nuevo signal para controlar cuando se ha intentado enviar

  // Vista y paginación
  viewMode = signal<ViewMode>('list');
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
  currentYear = new Date().getFullYear();

  constructor() {
    this.farmForm = this.createFarmForm();
  }

  async ngOnInit(): Promise<void> {
    // Inicializar el FarmStateService para cargar las fincas del estado global
    try {
      await this._farmStateService.initialize();
      // Sincronizar las fincas locales con el estado global
      this.farms.set(this._farmStateService.farms());
    } catch (error) {
      console.warn('No se pudieron cargar las fincas desde el estado global, cargando localmente:', error);
      // Si falla el estado global, cargar directamente
      await this.loadFarms();
    }
    this.updatePagination();
  }

  private createFarmForm(): FormGroup {
    return this._formBuilder.group({
      name: ['El triangulo', [
        Validators.required, 
        Validators.minLength(this.constraints.name.minLength),
        Validators.maxLength(this.constraints.name.maxLength),
        Validators.pattern(this.constraints.name.pattern)
      ]],
      description: ['Finca cafetera de especialidad ubicada en las montañas de Antioquia', [Validators.maxLength(this.constraints.description.maxLength)]],
      address: ['Vereda La Esperanza, Km 15 vía al Cerro', [Validators.maxLength(this.constraints.address.maxLength)]],
      municipality: ['Jardín', [Validators.maxLength(this.constraints.municipality.maxLength)]],
      department: ['Antioquia'],
      country: ['Colombia'],
      total_area: [25.5, [
        Validators.min(this.constraints.totalArea.min),
        Validators.max(this.constraints.totalArea.max)
      ]],
      altitude_min: [1650, [
        Validators.min(this.constraints.altitude.min),
        Validators.max(this.constraints.altitude.max)
      ]],
      altitude_max: [1850, [
        Validators.min(this.constraints.altitude.min),
        Validators.max(this.constraints.altitude.max)
      ]],
      latitude: [5.5986111, [
        Validators.min(this.constraints.coordinates.latitudeMin),
        Validators.max(this.constraints.coordinates.latitudeMax)
      ]],
      longitude: [-75.8230556, [
        Validators.min(this.constraints.coordinates.longitudeMin),
        Validators.max(this.constraints.coordinates.longitudeMax)
      ]],
      phone: ['3105338818', [
        Validators.minLength(this.constraints.phone.minLength),
        Validators.maxLength(this.constraints.phone.maxLength),
        Validators.pattern(this.constraints.phone.pattern)
      ]],
      email: ['contacto@eltriangulo.co', [
        Validators.email,
        Validators.maxLength(this.constraints.email.maxLength),
        Validators.pattern(this.constraints.email.pattern)
      ]],
      established_date: [new Date('1985-03-15')],
      // establishment_year: [1985, [
      //   Validators.min(1900),
      //   Validators.max(this.currentYear)
      // ]],
      // purchase_date: [new Date('1985-03-15')],
      // notes: ['Finca con excelente calidad de café y vista panorámica'],
      // manager_name: ['Juan Carlos Restrepo'],
      // manager_phone: ['3105338818'],
      // manager_email: ['admin@eltriangulo.co'],
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
  private coordinatesValidator = (control: FormGroup) => {
    const lat = control.get('latitude')?.value;
    const lng = control.get('longitude')?.value;
    
    // Si no hay coordenadas, no hay error (son opcionales)
    if (!lat && !lng) return null;
    
    // Si solo hay una coordenada, es inválido
    if ((lat && !lng) || (!lat && lng)) {
      return { coordinatesIncomplete: true };
    }
    
    if ((lat || lng) && !isValidColombianCoordinates(lat, lng)) {
      return { invalidColombianCoordinates: { lat, lng } };
    }
    
    return null;
  }

  // Validador para rango de altitud
  private altitudeRangeValidator = (control: FormGroup) => {
    const min = control.get('altitude_min')?.value;
    const max = control.get('altitude_max')?.value;
    
    if (min && max && min >= max) {
      return { invalidAltitudeRange: { min, max } };
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
    this.formSubmitted.set(false); // Resetear el estado del formulario
    
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
        // establishment_year: farm.establishment_year || null,
        // purchase_date: farm.purchase_date ? new Date(farm.purchase_date) : null,
        // notes: farm.notes || '',
        // manager_name: farm.manager_name || '',
        // manager_phone: farm.manager_phone || '',
        // manager_email: farm.manager_email || '',
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
      // Modo creación - usar valores por defecto
      this.selectedFarm.set(null);
      this.isEditMode.set(false);
      
      // Resetear con los datos de prueba por defecto (los mismos que en createFarmForm)
      this.farmForm.patchValue({
        name: 'El triangulo',
        description: 'Finca cafetera de especialidad ubicada en las montañas de Antioquia',
        address: 'Vereda La Esperanza, Km 15 vía al Cerro',
        municipality: 'Jardín',
        department: 'Antioquia',
        country: 'Colombia',
        total_area: 25.5,
        altitude_min: 1650,
        altitude_max: 1850,
        latitude: 5.5986111,
        longitude: -75.8230556,
        phone: '3105338818',
        email: 'contacto@eltriangulo.co',
        established_date: new Date('1985-03-15'),
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
    this.formSubmitted.set(false); // Resetear el estado del formulario
    
    // Resetear con los datos de prueba por defecto
    this.farmForm.patchValue({
      name: 'El triangulo',
      description: 'Finca cafetera de especialidad ubicada en las montañas de Antioquia',
      address: 'Vereda La Esperanza, Km 15 vía al Cerro',
      municipality: 'Jardín',
      department: 'Antioquia',
      country: 'Colombia',
      total_area: 25.5,
      altitude_min: 1650,
      altitude_max: 1850,
      latitude: 5.5986111,
      longitude: -75.8230556,
      phone: '3105338818',
      email: 'contacto@eltriangulo.co',
      established_date: new Date('1985-03-15'),
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
    console.log('🏡 FarmsComponent: onSaveFarm started');
    console.log('🏡 Form value:', this.farmForm.value);
    console.log('🏡 Form valid:', this.farmForm.valid);
    console.log('🏡 Form errors:', this.farmForm.errors);
    console.log('🏡 Is loading:', this.isLoading());
    
    // Prevenir envíos múltiples si ya está procesando
    if (this.isLoading()) {
      console.log('🏡 FarmsComponent: Already processing, ignoring duplicate submission');
      return;
    }

    this.formSubmitted.set(true); // Marcar el formulario como tocado
    if (this.farmForm.invalid) {
      this.markFormGroupTouched(this.farmForm);
      this.logFormDebugInfo(); // Debug para identificar problemas
      toast.error('Formulario inválido', { 
        description: 'Por favor revisa los campos marcados en rojo.' 
      });
      return;
    }

    this.isLoading.set(true);
    console.log('🏡 FarmsComponent: Starting save process...');

    try {
      const formData = this.farmForm.value;
      console.log('🏡 FarmsComponent: Raw form data:', formData);
      
      // Formatear la fecha solo si existe
      if (formData.established_date && formData.established_date instanceof Date) {
        formData.established_date = formData.established_date.toISOString().split('T')[0];
        console.log('🏡 FarmsComponent: Formatted date:', formData.established_date);
      } else if (formData.established_date && typeof formData.established_date === 'string') {
        // Si ya es string, mantenerla como está (puede venir de un datepicker)
        formData.established_date = formData.established_date;
        console.log('🏡 FarmsComponent: Date already string:', formData.established_date);
      } else {
        // Si es null o undefined, remover el campo
        delete formData.established_date;
        console.log('🏡 FarmsComponent: Date removed (null/undefined)');
      }

      console.log('🏡 FarmsComponent: Final form data to send:', formData);

      if (this.isEditMode() && this.selectedFarm()?.id) {
        // Actualizar finca existente
        console.log('🏡 FarmsComponent: Update mode for farm ID:', this.selectedFarm()?.id);
        
        const updateRequest: UpdateFarmRequest = {
          id: this.selectedFarm()!.id!,
          ...formData
        };

        console.log('🏡 FarmsComponent: Update request:', updateRequest);

        const response = await this._farmsService.updateFarm(updateRequest).toPromise();
        
        console.log('🏡 FarmsComponent: Update response:', response);
        
        if (response?.error) {
          throw new Error(response.error.message);
        }

        // Actualizar en el estado global
        if (response?.data) {
          console.log('🏡 FarmsComponent: Updating farm in global state:', response.data);
          this._farmStateService.updateFarmInList(response.data);
          
          // Actualizar lista local directamente para evitar recarga
          const currentFarms = this.farms();
          const index = currentFarms.findIndex(f => f.id === response.data!.id);
          if (index !== -1) {
            const updatedFarms = [...currentFarms];
            updatedFarms[index] = response.data;
            this.farms.set(updatedFarms);
          }
        }

        toast.success('Finca actualizada', {
          description: 'La información de la finca se ha actualizado exitosamente.'
        });

      } else {
        // Crear nueva finca
        console.log('🏡 FarmsComponent: Create mode');
        
        const createRequest: CreateFarmRequest = formData;
        
        console.log('🏡 FarmsComponent: Create request:', createRequest);

        const response = await this._farmsService.createFarm(createRequest).toPromise();
        
        console.log('🏡 FarmsComponent: Create response:', response);
        
        if (response?.error) {
          console.error('🏡 FarmsComponent: Create error:', response.error);
          throw new Error(response.error.message);
        }

        // Agregar al estado global y lista local
        if (response?.data) {
          console.log('🏡 FarmsComponent: Adding farm to global state:', response.data);
          this._farmStateService.addFarmToList(response.data);
          
          // Agregar a lista local directamente para evitar recarga
          const currentFarms = this.farms();
          this.farms.set([response.data, ...currentFarms]);
          this.updatePagination();
        }

        toast.success('Finca creada', {
          description: 'La nueva finca se ha registrado exitosamente.'
        });
      }

      // Cerrar panel - NO recargar lista ya que la actualizamos directamente
      console.log('🏡 FarmsComponent: Closing panel...');
      this.closeSidePanel();

    } catch (error: unknown) {
      console.error('🏡 FarmsComponent: Error in onSaveFarm:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar la finca';
      toast.error('Error', {
        description: errorMessage,
        duration: 4000
      });
      
    } finally {
      this.isLoading.set(false);
      console.log('🏡 FarmsComponent: onSaveFarm finished');
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

        // Eliminar del estado global
        this._farmStateService.removeFarmFromList(farm.id);

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
    const isInvalid = !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted()));
    
    // Verificar también errores del formulario completo
    let hasFormError = false;
    if (this.formSubmitted() && this.farmForm.errors) {
      // Para campos de coordenadas
      if ((fieldName === 'latitude' || fieldName === 'longitude') && 
          (this.farmForm.errors['coordinatesIncomplete'] || this.farmForm.errors['invalidColombianCoordinates'])) {
        hasFormError = true;
      }
      
      // Para campos de altitud
      if ((fieldName === 'altitude_min' || fieldName === 'altitude_max') && 
          this.farmForm.errors['invalidAltitudeRange']) {
        hasFormError = true;
      }
    }
    
    // Debug para ayudar a identificar problemas de validación
    if (fieldName === 'name' && this.formSubmitted()) {
      console.log('Debug validación campo name:', {
        fieldExists: !!field,
        fieldValue: field?.value,
        fieldErrors: field?.errors,
        fieldInvalid: field?.invalid,
        fieldDirty: field?.dirty,
        fieldTouched: field?.touched,
        formSubmitted: this.formSubmitted(),
        isInvalid,
        hasFormError,
        finalResult: isInvalid || hasFormError
      });
    }
    
    return isInvalid || hasFormError;
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

    // Errores específicos para campos individuales basados en errores del formulario
    if (this.formSubmitted() && this.farmForm.errors) {
      // Para campos de coordenadas
      if (fieldName === 'latitude' || fieldName === 'longitude') {
        if (this.farmForm.errors['coordinatesIncomplete']) {
          return 'Completa ambas coordenadas (latitud y longitud)';
        }
        if (this.farmForm.errors['invalidColombianCoordinates']) {
          const error = this.farmForm.errors['invalidColombianCoordinates'];
          return `Coordenadas fuera de Colombia (${error.lat}, ${error.lng})`;
        }
      }
      
      // Para campos de altitud
      if (fieldName === 'altitude_min' || fieldName === 'altitude_max') {
        if (this.farmForm.errors['invalidAltitudeRange']) {
          const error = this.farmForm.errors['invalidAltitudeRange'];
          return `Rango inválido: mín(${error.min}m) ≥ máx(${error.max}m)`;
        }
      }
    }

    // Errores del formulario completo (para mostrar en la sección de errores generales)
    if (!fieldName && this.farmForm.errors) {
      if (this.farmForm.errors['coordinatesIncomplete']) {
        return 'Si ingresas coordenadas, debes completar tanto latitud como longitud';
      }
      if (this.farmForm.errors['invalidColombianCoordinates']) {
        const error = this.farmForm.errors['invalidColombianCoordinates'];
        return `Las coordenadas (${error.lat}, ${error.lng}) están fuera de Colombia. Verifica los valores.`;
      }
      if (this.farmForm.errors['invalidAltitudeRange']) {
        const error = this.farmForm.errors['invalidAltitudeRange'];
        return `La altitud mínima (${error.min}m) debe ser menor que la máxima (${error.max}m)`;
      }
    }

    return '';
  }

  // Debug method para revisar estado del formulario
  logFormDebugInfo(): void {
    console.log('=== DEBUG FORMULARIO FINCAS ===');
    console.log('Form valid:', this.farmForm.valid);
    console.log('Form submitted:', this.formSubmitted());
    console.log('Form errors:', this.farmForm.errors);
    console.log('Form value:', this.farmForm.value);
    
    Object.keys(this.farmForm.controls).forEach(key => {
      const control = this.farmForm.get(key);
      if (control?.invalid) {
        console.log(`Campo ${key}:`, {
          value: control.value,
          errors: control.errors,
          dirty: control.dirty,
          touched: control.touched
        });
      }
    });
    console.log('=== FIN DEBUG ===');
  }

  getCertificationsList(certifications: Record<string, boolean> | undefined): string[] {
    if (!certifications) return [];
    
    return Object.keys(certifications)
      .filter(key => certifications[key])
      .map(key => {
        const cert = this.certificationOptions.find(c => c.key === key);
        return cert ? cert.label : key;
      });
  }

  getLocationString(farm: FarmEntity): string {
    const parts = [];
    if (farm.municipality) parts.push(farm.municipality);
    if (farm.department) parts.push(farm.department);
    return parts.join(', ');
  }

  trackByFarmId(index: number, farm: FarmEntity): string {
    return farm.id || index.toString();
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
}