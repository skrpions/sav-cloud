import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarComponent } from '@/app/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '@/app/shared/components/header/header.component';
import { CollaboratorFormComponent } from './components/collaborator-form/collaborator-form.component';
import { CollaboratorsService } from './services/collaborators.service';
import { CollaboratorEntity } from '@/app/shared/models/collaborator.models';
import { FarmStateService } from '@/app/shared/services/farm-state.service';
import { FORM_CONSTRAINTS } from '@/app/shared/constants/form-constrains';
import { SidebarItem } from '@/app/shared/models/ui.models';
import { DateUtils } from '@/app/shared/utils/validators';
import { UpdateCollaboratorRequest } from '@/app/shared/models/collaborator.models';

// Tipos para las vistas
export type ViewMode = 'list' | 'cards';

@Component({
  selector: 'app-collaborators',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    TranslateModule,
    FormsModule,
    SidebarComponent,
    HeaderComponent,
    CollaboratorFormComponent
  ],
  templateUrl: './collaborators.component.html',
  styleUrl: './collaborators.component.scss'
})
export class CollaboratorsComponent implements OnInit {
  private _collaboratorsService = inject(CollaboratorsService);
  private _farmStateService = inject(FarmStateService);
  private _router = inject(Router);
  private _translateService = inject(TranslateService);

  // Signals para el estado del componente
  collaborators = signal<CollaboratorEntity[]>([]);
  isLoading = signal(false);
  showForm = signal(false);
  selectedCollaborator = signal<CollaboratorEntity | undefined>(undefined);
  isEditMode = signal(false);
  isSidebarCollapsed = signal(false);
  searchTerm = signal('');

  // Vista y paginación
  viewMode = signal<ViewMode>('list');
  currentPage = signal(0);
  pageSize = signal(7);
  totalPages = signal(0);

  // Filtros
  filterStatus = '';
  filterContractType = '';
  filterHireDate = '';

  async ngOnInit(): Promise<void> {
    // Inicializar farm state service si no está ya inicializado
    if (!this._farmStateService.hasFarms()) {
      await this._farmStateService.initialize();
    }
    
    await this.loadCollaborators();
  }

  async loadCollaborators(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      console.log('Loading collaborators...');
      const currentFarmId = this._farmStateService.getCurrentFarmIdOrDefault();
      const response = await this._collaboratorsService.getAllCollaborators(currentFarmId).toPromise();
      
      if (response?.error) {
        console.error('Service returned error:', response.error);
        throw new Error(response.error.message);
      }

      const collaboratorsList = response?.data || [];
      console.log('Collaborators loaded:', collaboratorsList);
      this.collaborators.set(collaboratorsList);
      this.updatePagination();

    } catch (error: unknown) {
      console.error('Error loading collaborators:', error);
      
      // Si es un error de política, mostrar un mensaje más específico
      const errorMessage = error instanceof Error ? error.message : this._translateService.instant('collaborators.toasts.error.description');
      
      toast.error(this._translateService.instant('collaborators.toasts.error.title'), {
        description: errorMessage,
        duration: FORM_CONSTRAINTS.timing.toastDuration
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  updatePagination(): void {
    const filteredCount = this.filteredCollaborators().length;
    const pages = Math.ceil(filteredCount / this.pageSize());
    this.totalPages.set(pages);
    
    if (this.currentPage() >= pages && pages > 0) {
      this.currentPage.set(pages - 1);
    }
  }

  switchView(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onSearchChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchTerm = target?.value || '';
    this.searchTerm.set(searchTerm);
    this.currentPage.set(0);
    this.updatePagination();
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterContractType = '';
    this.filterHireDate = '';
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.updatePagination();
  }

  hasFilters(): boolean {
    return !!(this.filterStatus || this.filterContractType || this.filterHireDate || this.searchTerm());
  }

  onSidebarItemClicked(item: SidebarItem): void {
    if (item.route) {
      this._router.navigate([item.route]);
    }
  }

  onSidebarCollapseChanged(isCollapsed: boolean): void {
    this.isSidebarCollapsed.set(isCollapsed);
  }

  // Paginación
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

  get filteredCollaborators(): () => CollaboratorEntity[] {
    return () => {
      let filtered = this.collaborators();

      if (this.filterStatus) {
        const isActive = this.filterStatus === 'active';
        filtered = filtered.filter(c => c.is_active === isActive);
      }

      if (this.filterContractType) {
        filtered = filtered.filter(c => c.contract_type === this.filterContractType);
      }

      if (this.filterHireDate) {
        // Asegurar que tratamos el filterHireDate como fecha local sin zona horaria
        const filterDate = DateUtils.formatToLocalDate(new Date(this.filterHireDate));
        filtered = filtered.filter(c => {
          // Extraer solo la parte de fecha de hire_date (sin hora)
          const hireDate = c.hire_date.split('T')[0]; // Extraer YYYY-MM-DD
          return hireDate === filterDate;
        });
      }

      // Añadir búsqueda por término
      const searchTerm = this.searchTerm();
      if (searchTerm.trim()) {
        filtered = filtered.filter(collaborator =>
          collaborator.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          collaborator.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          collaborator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          collaborator.identification.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return filtered;
    };
  }

  get paginatedCollaborators(): CollaboratorEntity[] {
    const filtered = this.filteredCollaborators();
    const startIndex = this.currentPage() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return filtered.slice(startIndex, endIndex);
  }

  onAddNewCollaborator(): void {
    this.selectedCollaborator.set(undefined);
    this.isEditMode.set(false);
    this.showForm.set(true);
  }

  onEditCollaborator(collaborator: CollaboratorEntity): void {
    this.selectedCollaborator.set(collaborator);
    this.isEditMode.set(true);
    this.showForm.set(true);
  }

  onViewCollaborator(collaborator: CollaboratorEntity): void {
    // Implementar vista de detalles
    console.log('View collaborator:', collaborator);
  }

  async onDeleteCollaborator(collaborator: CollaboratorEntity): Promise<void> {
    if (!collaborator.id) return;
    
    const confirmMessage = `¿Estás seguro de desactivar al colaborador "${collaborator.first_name} ${collaborator.last_name}"?`;
    
    if (confirm(confirmMessage)) {
      this.isLoading.set(true);
      
      try {
        const updateRequest: UpdateCollaboratorRequest = {
          id: collaborator.id, // Ya verificamos que no es undefined arriba
          farm_id: collaborator.farm_id,
          first_name: collaborator.first_name,
          last_name: collaborator.last_name,
          identification: collaborator.identification,
          phone: collaborator.phone,
          address: collaborator.address,
          email: collaborator.email,
          birth_date: collaborator.birth_date,
          hire_date: collaborator.hire_date,
          contract_type: collaborator.contract_type,
          emergency_contact_name: collaborator.emergency_contact_name,
          emergency_contact_phone: collaborator.emergency_contact_phone,
          banking_info: collaborator.banking_info,
          specializations: collaborator.specializations,
          notes: collaborator.notes,
          is_active: false
        };
        
        const result = await this._collaboratorsService.updateCollaborator(updateRequest).toPromise();
        
        if (result?.error) {
          throw new Error(result.error.message);
        }
        
        toast.success('Colaborador desactivado', {
          description: 'El colaborador ha sido desactivado exitosamente.',
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });
        
        await this.loadCollaborators();
        
      } catch (error: unknown) {
        console.error('Error deactivating collaborator:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Error al desactivar el colaborador';
        toast.error('Error', {
          description: errorMessage,
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  onFormSubmitted(): void {
    this.showForm.set(false);
    this.selectedCollaborator.set(undefined);
    this.isEditMode.set(false);
    
    // Reload the list
    this.loadCollaborators();
  }

  onFormCancelled(): void {
    this.showForm.set(false);
    this.selectedCollaborator.set(undefined);
    this.isEditMode.set(false);
  }

  // Métodos de utilidad para el template
  formatDate(dateString?: string): string {
    return DateUtils.formatToLocalDate(dateString ? new Date(dateString) : new Date());
  }

  getFullName(collaborator: CollaboratorEntity): string {
    return `${collaborator.first_name} ${collaborator.last_name}`;
  }

  getBankingInfo(collaborator: CollaboratorEntity): string {
    if (!collaborator.banking_info) return 'Sin información bancaria';
    
    const { bank, product_type } = collaborator.banking_info;
    if (!bank || !product_type) return 'Información incompleta';
    
    return `${bank} - ${product_type}`;
  }

  getContractTypeLabel(contractType: string): string {
    switch (contractType) {
      case 'libre': return 'Libre (Incluye comida)';
      case 'grabado': return 'Grabado (Solo pago)';
      default: return contractType;
    }
  }

  updateFilters(): void {
    this.currentPage.set(0);
    this.updatePagination();
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      this.onFormCancelled();
    }
  }

  trackByCollaboratorId(index: number, item: CollaboratorEntity): string {
    return item.id || index.toString();
  }
} 