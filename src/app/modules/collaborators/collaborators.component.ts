import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarComponent } from '@/app/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '@/app/shared/components/header/header.component';
import { CollaboratorFormComponent } from './components/collaborator-form/collaborator-form.component';
import { CollaboratorsService } from './services/collaborators.service';
import { CollaboratorEntity, CollaboratorListResponse } from '@/app/shared/models/collaborator.models';
import { FORM_CONSTRAINTS } from '@/app/shared/constants/form-constrains';
import { SidebarItem } from '@/app/shared/models/ui.models';
import { DateUtils } from '@/app/shared/utils/validators';

@Component({
  selector: 'app-collaborators',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    TranslateModule,
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
  filteredCollaborators = signal<CollaboratorEntity[]>([]);
  isLoading = signal(false);
  showForm = signal(false);
  selectedCollaborator = signal<CollaboratorEntity | undefined>(undefined);
  isEditMode = signal(false);
  isSidebarCollapsed = signal(false);
  searchTerm = signal('');

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
      this.filteredCollaborators.set(collaboratorsList);

    } catch (error: any) {
      console.error('Error loading collaborators:', error);
      
      // Si es un error de política, mostrar un mensaje más específico
      let errorMessage = error.message || this._translateService.instant('collaborators.toasts.error.description');
      if (error.message?.includes('infinite recursion') || error.message?.includes('policy')) {
        errorMessage = 'Error de configuración de base de datos. Verifica las políticas de Supabase.';
      }
      
      toast.error(this._translateService.instant('collaborators.toasts.error.title'), {
        description: errorMessage,
        duration: FORM_CONSTRAINTS.timing.toastDuration
      });
      
      // Cargar datos de ejemplo mientras solucionamos el problema
      this.loadSampleData();
    } finally {
      this.isLoading.set(false);
    }
  }

  private loadSampleData(): void {
    console.log('Loading sample data...');
    const sampleCollaborators: CollaboratorEntity[] = [
      {
        id: '1',
        first_name: 'Juan',
        last_name: 'Pérez',
        identification: '12345678',
        email: 'juan.perez@example.com',
        phone: '+1234567890',
        address: 'Calle Principal 123',
        birth_date: '1990-01-15',
        hire_date: '2023-01-01',
        contract_type: 'full_time',
        emergency_contact_name: 'María Pérez',
        emergency_contact_phone: '+1234567891',
        bank_account: '1234567890123456',
        is_active: true,
        notes: 'Colaborador modelo',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: '2',
        first_name: 'Ana',
        last_name: 'García',
        identification: '87654321',
        email: 'ana.garcia@example.com',
        phone: '+1234567892',
        address: 'Avenida Central 456',
        birth_date: '1985-05-20',
        hire_date: '2023-02-01',
        contract_type: 'contract',
        emergency_contact_name: 'Carlos García',
        emergency_contact_phone: '+1234567893',
        bank_account: '6543210987654321',
        is_active: true,
        notes: 'Especialista en ventas',
        created_at: '2023-02-01T00:00:00Z',
        updated_at: '2023-02-01T00:00:00Z'
      }
    ];
    
    this.collaborators.set(sampleCollaborators);
    this.filteredCollaborators.set(sampleCollaborators);
  }

  onSearchChanged(searchTerm: string): void {
    this.searchTerm.set(searchTerm);
    
    if (!searchTerm.trim()) {
      this.filteredCollaborators.set(this.collaborators());
      return;
    }

    const filtered = this.collaborators().filter(collaborator =>
      collaborator.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.identification.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.filteredCollaborators.set(filtered);
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

    } catch (error: any) {
      console.error('Error deleting collaborator:', error);
      
      toast.error(this._translateService.instant('collaborators.toasts.error.title'), {
        description: error.message || this._translateService.instant('collaborators.toasts.error.description'),
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
      case 'full_time': return 'Grabado (Solo pago)';
      case 'contract': return 'Libre (Incluye comida)';
      default: return contractType;
    }
  }
} 