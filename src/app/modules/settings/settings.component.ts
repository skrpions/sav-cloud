import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarComponent } from '@/app/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '@/app/shared/components/header/header.component';
import { SettingsService } from './services/settings.service';
import { 
  SettingsEntity, 
  CreateSettingsRequest, 
  UpdateSettingsRequest,
  CURRENCY_OPTIONS,
  ACTIVITY_RATES_CONFIG 
} from '@/app/shared/models/settings.models';
import { FORM_CONSTRAINTS } from '@/app/shared/constants/form-constrains';
import { SidebarItem } from '@/app/shared/models/ui.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    TranslateModule,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private _settingsService = inject(SettingsService);
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _translateService = inject(TranslateService);

  // Signals para el estado del componente
  settings = signal<SettingsEntity[]>([]);
  currentSettings = signal<SettingsEntity | undefined>(undefined);
  isLoading = signal(false);
  isEditMode = signal(false);
  isSidebarCollapsed = signal(false);
  formSubmitted = signal(false);

  // Configuraciones para el template
  currencyOptions = CURRENCY_OPTIONS;
  activityRatesConfig = ACTIVITY_RATES_CONFIG;
  currentYear = new Date().getFullYear();

  // Formulario reactivo
  settingsForm: FormGroup;

  constructor() {
    this.settingsForm = this.createSettingsForm();
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  private createSettingsForm(): FormGroup {
    return this._formBuilder.group({
      year: [this.currentYear, [Validators.required, Validators.min(2020), Validators.max(2030)]],
      harvest_price_per_kilogram: [0, [Validators.required, Validators.min(0)]],
      daily_rate_libre: [0, [Validators.required, Validators.min(0)]],
      daily_rate_grabado: [0, [Validators.required, Validators.min(0)]],
      activity_rate_fertilization: [0, [Validators.min(0)]],
      activity_rate_fumigation: [0, [Validators.min(0)]],
      activity_rate_pruning: [0, [Validators.min(0)]],
      activity_rate_weeding: [0, [Validators.min(0)]],
      activity_rate_planting: [0, [Validators.min(0)]],
      activity_rate_maintenance: [0, [Validators.min(0)]],
      activity_rate_other: [0, [Validators.min(0)]],
      currency: ['COP', [Validators.required]],
      tax_percentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  async loadSettings(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      console.log('Loading settings...');
      const response = await this._settingsService.getAllSettings().toPromise();
      
      if (response?.error) {
        console.error('Service returned error:', response.error);
        throw new Error(response.error.message);
      }

      const settingsList = response?.data || [];
      console.log('Settings loaded:', settingsList);
      this.settings.set(settingsList);

      // Cargar la configuración activa actual (si existe)
      const activeSettings = settingsList.find(s => s.is_active && s.year === this.currentYear);
      if (activeSettings) {
        this.loadFormData(activeSettings);
        this.currentSettings.set(activeSettings);
        this.isEditMode.set(true);
      } else {
        // Si no hay configuración activa, mostrar valores por defecto
        this.setDefaultValues();
        this.isEditMode.set(false);
      }

    } catch (error: any) {
      console.error('Error loading settings:', error);
      
      toast.error(this._translateService.instant('settings.toasts.error.title'), {
        description: error.message || this._translateService.instant('settings.toasts.error.description'),
        duration: FORM_CONSTRAINTS.timing.toastDuration
      });
      
      // Cargar valores por defecto en caso de error
      this.setDefaultValues();
      
    } finally {
      this.isLoading.set(false);
    }
  }

  private setDefaultValues(): void {
    this.settingsForm.patchValue({
      year: this.currentYear,
      harvest_price_per_kilogram: 5000,
      daily_rate_libre: 45000,
      daily_rate_grabado: 50000,
      activity_rate_fertilization: 30000,
      activity_rate_fumigation: 35000,
      activity_rate_pruning: 40000,
      activity_rate_weeding: 30000,
      activity_rate_planting: 35000,
      activity_rate_maintenance: 40000,
      activity_rate_other: 30000,
      currency: 'COP',
      tax_percentage: 0
    });
  }

  private loadFormData(settings: SettingsEntity): void {
    this.settingsForm.patchValue({
      year: settings.year,
      harvest_price_per_kilogram: settings.harvest_price_per_kilogram,
      daily_rate_libre: settings.daily_rate_libre,
      daily_rate_grabado: settings.daily_rate_grabado,
      activity_rate_fertilization: settings.activity_rate_fertilization || 0,
      activity_rate_fumigation: settings.activity_rate_fumigation || 0,
      activity_rate_pruning: settings.activity_rate_pruning || 0,
      activity_rate_weeding: settings.activity_rate_weeding || 0,
      activity_rate_planting: settings.activity_rate_planting || 0,
      activity_rate_maintenance: settings.activity_rate_maintenance || 0,
      activity_rate_other: settings.activity_rate_other || 0,
      currency: settings.currency,
      tax_percentage: settings.tax_percentage
    });
  }

  async onSaveSettings(): Promise<void> {
    this.formSubmitted.set(true);

    if (this.settingsForm.invalid) {
      toast.error(this._translateService.instant('settings.toasts.validation.title'), {
        description: this._translateService.instant('settings.toasts.validation.description'),
        duration: FORM_CONSTRAINTS.timing.toastDuration
      });
      return;
    }

    this.isLoading.set(true);

    try {
      const formData = this.settingsForm.value;
      
      if (this.isEditMode() && this.currentSettings()?.id) {
        // Actualizar configuración existente
        const updateRequest: UpdateSettingsRequest = {
          id: this.currentSettings()!.id!,
          ...formData
        };

        const response = await this._settingsService.updateSettings(updateRequest).toPromise();
        
        if (response?.error) {
          throw new Error(response.error.message);
        }

        toast.success(this._translateService.instant('settings.toasts.updateSuccess.title'), {
          description: this._translateService.instant('settings.toasts.updateSuccess.description'),
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });

      } else {
        // Crear nueva configuración
        const createRequest: CreateSettingsRequest = formData;
        
        const response = await this._settingsService.createSettings(createRequest).toPromise();
        
        if (response?.error) {
          throw new Error(response.error.message);
        }

        toast.success(this._translateService.instant('settings.toasts.createSuccess.title'), {
          description: this._translateService.instant('settings.toasts.createSuccess.description'),
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });

        this.isEditMode.set(true);
        this.currentSettings.set(response?.data);
      }

      // Recargar la lista
      await this.loadSettings();

    } catch (error: any) {
      console.error('Error saving settings:', error);
      
      toast.error(this._translateService.instant('settings.toasts.error.title'), {
        description: error.message || this._translateService.instant('settings.toasts.error.description'),
        duration: FORM_CONSTRAINTS.timing.toastDuration
      });
      
    } finally {
      this.isLoading.set(false);
    }
  }

  onResetForm(): void {
    this.formSubmitted.set(false);
    
    if (this.isEditMode() && this.currentSettings()) {
      this.loadFormData(this.currentSettings()!);
    } else {
      this.setDefaultValues();
    }
    
    toast.info(this._translateService.instant('settings.toasts.reset.title'), {
      description: this._translateService.instant('settings.toasts.reset.description'),
      duration: FORM_CONSTRAINTS.timing.toastDuration
    });
  }

  onSidebarItemClicked(item: SidebarItem): void {
    if (item.route) {
      this._router.navigate([item.route]);
    }
  }

  onSidebarCollapseChanged(isCollapsed: boolean): void {
    this.isSidebarCollapsed.set(isCollapsed);
  }

  // Métodos de utilidad para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.settingsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted()));
  }

  getFieldError(fieldName: string): string {
    const field = this.settingsForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return this._translateService.instant('validators.required');
      if (field.errors['min']) return this._translateService.instant('validators.min', { value: field.errors['min'].min });
      if (field.errors['max']) return this._translateService.instant('validators.max', { value: field.errors['max'].max });
    }
    return '';
  }

  formatCurrency(value: number): string {
    const currency = this.settingsForm.get('currency')?.value || 'COP';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency
    }).format(value);
  }
}
