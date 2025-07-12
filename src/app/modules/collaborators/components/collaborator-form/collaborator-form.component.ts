import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@/app/shared/material.module';
import { 
  createNameValidators, 
  createIdentificationValidators, 
  createEmailValidators,
  createPhoneValidators,
  createAddressValidators,
  createNotesValidators,
  createBirthDateValidators,
  DateUtils
} from '@/app/shared/utils/validators';
import { 
  CollaboratorEntity, 
  CreateCollaboratorRequest, 
  UpdateCollaboratorRequest,
  CONTRACT_TYPE_OPTIONS,
  BANK_OPTIONS,
  BANCOLOMBIA_PRODUCT_OPTIONS,
  GENERIC_PRODUCT_OPTIONS,
  BankType,
  BankingInfo
} from '@/app/shared/models/collaborator.models';
import { CollaboratorsService } from '../../services/collaborators.service';
import { FarmStateService } from '@/app/shared/services/farm-state.service';
import { FORM_CONSTRAINTS } from '@/app/shared/constants/form-constrains';

@Component({
  selector: 'app-collaborator-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, TranslateModule],
  templateUrl: './collaborator-form.component.html',
  styleUrl: './collaborator-form.component.scss'
})
export class CollaboratorFormComponent implements OnInit, OnChanges {
  @Input() collaborator?: CollaboratorEntity;
  @Input() isEditMode = false;
  @Output() formSubmitted = new EventEmitter<void>();
  @Output() formCancelled = new EventEmitter<void>();

  private _fb = inject(FormBuilder);
  private _collaboratorsService = inject(CollaboratorsService);
  private _farmStateService = inject(FarmStateService);
  private _translateService = inject(TranslateService);

  collaboratorForm!: FormGroup;
  contractTypeOptions = CONTRACT_TYPE_OPTIONS;
  bankOptions = BANK_OPTIONS;
  bancolombiaProductOptions = BANCOLOMBIA_PRODUCT_OPTIONS;
  genericProductOptions = GENERIC_PRODUCT_OPTIONS;
  isLoading = false;
  
  // Control para la información bancaria avanzada
  selectedBank: BankType | null = null;
  usePhoneForNequi = false;

  ngOnInit(): void {
    this.createForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['collaborator'] && this.collaboratorForm) {
      this.populateForm();
    }
  }

  private createForm(): void {
    this.collaboratorForm = this._fb.group({
      // Información Personal
      first_name: ['', createNameValidators()],
      last_name: ['', createNameValidators()],
      identification: ['', createIdentificationValidators()],
      email: ['', createEmailValidators()],
      phone: ['', createPhoneValidators()],
      address: ['', createAddressValidators()],
      birth_date: ['', createBirthDateValidators(5)], // Edad mínima de 5 años
      
      // Información Laboral
      hire_date: ['', [Validators.required]],
      contract_type: ['', [Validators.required]],
      
      // Contacto de Emergencia
      emergency_contact_name: ['', createNameValidators()],
      emergency_contact_phone: ['', createPhoneValidators()],
      
      // Nueva información bancaria estructurada (opcional)
      banking_info: this._fb.group({
        bank: [''], // No obligatorio
        product_type: [''], // No obligatorio
        account_number: [''], // No obligatorio
        use_phone_number: [false]
      }),
      
      // Información Adicional
      notes: ['', createNotesValidators()],
      is_active: [true]
    });
  }

  private populateForm(): void {
    if (!this.collaborator) return;

    // Convertir fechas usando DateUtils para el datepicker (necesita Date objects)
    const birthDate = DateUtils.formatForDatepicker(this.collaborator.birth_date || '');
    const hireDate = DateUtils.formatForDatepicker(this.collaborator.hire_date || '');

    // Preparar información bancaria
    const bankingInfo: BankingInfo = this.collaborator.banking_info || {
      bank: 'bancolombia',
      product_type: 'ahorros',
      account_number: '', // bank_account ya no existe, usar string vacío por defecto
      use_phone_number: false
    };

    // Actualizar el banco seleccionado y el toggle de Nequi
    this.selectedBank = bankingInfo.bank;
    this.usePhoneForNequi = bankingInfo.use_phone_number || false;

    this.collaboratorForm.patchValue({
      first_name: this.collaborator.first_name,
      last_name: this.collaborator.last_name,
      identification: this.collaborator.identification,
      email: this.collaborator.email,
      phone: this.collaborator.phone,
      address: this.collaborator.address,
      birth_date: birthDate,
      hire_date: hireDate,
      contract_type: this.collaborator.contract_type,
      emergency_contact_name: this.collaborator.emergency_contact_name,
      emergency_contact_phone: this.collaborator.emergency_contact_phone,
      banking_info: bankingInfo,
      notes: this.collaborator.notes || '',
      is_active: this.collaborator.is_active ?? true
    });
  }

  async onSubmit(): Promise<void> {
    if (this.collaboratorForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    try {
      const formValue = this.collaboratorForm.value;
      
      // Obtener farm_id actual del servicio de estado
      const currentFarmId = this._farmStateService.getCurrentFarmIdOrDefault();
      if (!currentFarmId) {
        throw new Error('No hay una finca seleccionada. Por favor selecciona una finca antes de crear un colaborador.');
      }
      
      // Convertir fechas usando DateUtils para evitar problemas de zona horaria
      const requestData = {
        ...formValue,
        farm_id: currentFarmId, // Usar farm_id del servicio de estado
        birth_date: DateUtils.formatForBackend(formValue.birth_date),
        hire_date: DateUtils.formatForBackend(formValue.hire_date)
      };

      if (this.isEditMode && this.collaborator?.id) {
        // Actualizar colaborador existente (farm_id ya incluido en requestData)
        const updateRequest: UpdateCollaboratorRequest = {
          id: this.collaborator.id,
          ...requestData
        };

        const result = await this._collaboratorsService.updateCollaborator(updateRequest).toPromise();
        
        if (result?.error) {
          throw new Error(result.error.message);
        }

        toast.success(this._translateService.instant('collaborators.toasts.updateSuccess.title'), {
          description: this._translateService.instant('collaborators.toasts.updateSuccess.description'),
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });

      } else {
        // Crear nuevo colaborador
        const createRequest: CreateCollaboratorRequest = requestData;

        const result = await this._collaboratorsService.createCollaborator(createRequest).toPromise();
        
        if (result?.error) {
          throw new Error(result.error.message);
        }

        toast.success(this._translateService.instant('collaborators.toasts.createSuccess.title'), {
          description: this._translateService.instant('collaborators.toasts.createSuccess.description'),
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });
      }

      this.formSubmitted.emit();

    } catch (error: unknown) {
      console.error('❌ Error in onSubmit:', error);
      
      const errorMessage = error instanceof Error ? error.message : this._translateService.instant('collaborators.toasts.error.description');
      
      toast.error(this._translateService.instant('collaborators.toasts.error.title'), {
        description: errorMessage,
        duration: FORM_CONSTRAINTS.timing.toastDuration
      });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.formCancelled.emit();
  }

  // Métodos para manejo de información bancaria
  onBankChange(bank: BankType): void {
    this.selectedBank = bank;
    
    // Resetear el toggle cuando cambie el banco
    if (bank !== 'nequi') {
      this.usePhoneForNequi = false;
      this.collaboratorForm.get('banking_info')?.get('use_phone_number')?.setValue(false);
    }
    
    // Limpiar el número de cuenta cuando cambie el banco
    this.collaboratorForm.get('banking_info')?.get('account_number')?.setValue('');
  }

  onUsePhoneToggle(usePhone: boolean): void {
    this.usePhoneForNequi = usePhone;
    this.collaboratorForm.get('banking_info')?.get('use_phone_number')?.setValue(usePhone);
    
    if (usePhone) {
      // Limpiar el campo de número de cuenta si se va a usar el teléfono
      this.collaboratorForm.get('banking_info')?.get('account_number')?.setValue('');
    }
  }

  // Helpers para el template
  isNequiSelected(): boolean {
    return this.selectedBank === 'nequi';
  }

  getProductTypeOptions() {
    if (this.selectedBank === 'bancolombia') {
      return this.bancolombiaProductOptions;
    }
    return this.genericProductOptions;
  }

  // Métodos de validación para el template
  isFieldRequired(fieldName: string): boolean {
    const control = this.collaboratorForm.get(fieldName);
    return !!(control?.hasError('required') && control?.touched);
  }

  isPatternInvalid(fieldName: string): boolean {
    const control = this.collaboratorForm.get(fieldName);
    return !!(control?.hasError('pattern') && control?.touched && !control?.hasError('required'));
  }

  isEmailInvalid(): boolean {
    const control = this.collaboratorForm.get('email');
    return !!(control?.hasError('email') && control?.touched && !control?.hasError('required'));
  }

  isMinimumAgeInvalid(fieldName: string): boolean {
    const control = this.collaboratorForm.get(fieldName);
    return !!(control?.hasError('minimumAge') && control?.touched);
  }

  private markFormGroupTouched(): void {
    this.markAllFieldsAsTouched(this.collaboratorForm);
  }

  private markAllFieldsAsTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markAllFieldsAsTouched(control);
      }
    });
  }
} 