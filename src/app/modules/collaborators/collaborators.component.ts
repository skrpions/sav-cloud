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
import { FORM_CONSTRAINTS } from '@/app/shared/constants/form-constrains';
import { SidebarItem } from '@/app/shared/models/ui.models';
import { DateUtils } from '@/app/shared/utils/validators';

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

  ngOnInit(): void {
    this.loadCollaborators();
  }

  async loadCollaborators(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      console.log('Loading collaborators...');
      const response = await this._collaboratorsService.getAllCollaborators().toPromise();
      
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



  // Métodos de vista y paginación
  switchView(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.currentPage.set(0);
    this.updatePagination();
  }

  public updatePagination(): void {
    const filtered = this.filteredCollaborators();
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

  updateFilters(): void {
    this.currentPage.set(0);
    this.updatePagination();
  }

  // Filtros
  clearFilters(): void {
    this.filterStatus = '';
    this.filterContractType = '';
    this.filterHireDate = '';
    this.currentPage.set(0);
    this.updatePagination();
  }

  hasFilters(): boolean {
    return !!(this.filterStatus || this.filterContractType || this.filterHireDate);
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
        const filterDate = DateUtils.formatToLocalDate(new Date(this.filterHireDate));
        filtered = filtered.filter(c => {
          const hireDate = DateUtils.formatToLocalDate(new Date(c.hire_date));
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
    
    if (this.viewMode() === 'cards') {
      return filtered; // Sin paginación en vista de tarjetas
    }
    
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  }

  onSearchChanged(searchTerm: string): void {
    this.searchTerm.set(searchTerm);
    this.updatePagination();
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
    // TODO: Implementar vista de detalles del colaborador
    console.log('Ver detalles de:', collaborator);
    // Por ahora, simplemente editamos
    this.onEditCollaborator(collaborator);
  }

  async onDeleteCollaborator(collaborator: CollaboratorEntity): Promise<void> {
    if (!collaborator.id) return;

    // Confirm deletion
    const confirmed = confirm('¿Estás seguro de eliminar este colaborador?');
    if (!confirmed) return;

    try {
      const result = await this._collaboratorsService.deleteCollaborator(collaborator.id).toPromise();
      
      if (result?.error) {
        throw new Error(result.error.message);
      }

      toast.success(this._translateService.instant('collaborators.toasts.deleteSuccess.title'), {
        description: this._translateService.instant('collaborators.toasts.deleteSuccess.description'),
        duration: FORM_CONSTRAINTS.timing.toastDuration
      });

      // Reload the list
      await this.loadCollaborators();

    } catch (error: unknown) {
      console.error('Error deleting collaborator:', error);
      
      toast.error(this._translateService.instant('collaborators.toasts.error.title'), {
        description: error instanceof Error ? error.message : this._translateService.instant('collaborators.toasts.error.description'),
        duration: FORM_CONSTRAINTS.timing.toastDuration
      });
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

  onSidebarItemClicked(item: SidebarItem): void {
    console.log('Sidebar item clicked:', item);
    // The navigation is already handled in the sidebar component
    // Here we could handle additional logic specific to this component if needed
  }

  onSidebarCollapseChanged(isCollapsed: boolean): void {
    this.isSidebarCollapsed.set(isCollapsed);
  }

  getFullName(collaborator: CollaboratorEntity): string {
    return `${collaborator.first_name} ${collaborator.last_name}`;
  }

  formatDate(dateString: string): string {
    return DateUtils.formatToDisplay(dateString);
  }

  getContractTypeLabel(contractType: string): string {
    switch (contractType) {
      case 'full_time': return 'Tiempo Completo';
      case 'contract': return 'Contrato';
      default: return contractType;
    }
  }

  // TrackBy functions para mejor rendimiento
  trackByCollaboratorId(index: number, item: CollaboratorEntity): string {
    return item.id || index.toString();
  }
} 