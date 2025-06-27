import { Component, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@/app/shared/material.module';
import { SupabaseService } from '@/app/shared/services/supabase.service';
import { ROUTES } from '@/app/shared/constants/routes';
import { FORM_CONSTRAINTS } from '@/app/shared/constants/form-constrains';
import { FormAuthComponent } from '../shared/components/form-auth/form-auth.component';
import { AuthFormConfig } from '@/app/shared/models/ui.models';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    RouterLink,
    TranslateModule
  ],
  templateUrl: '../shared/components/form-auth/form-auth.component.html',
  styleUrl: '../shared/components/form-auth/form-auth.component.scss'
})
export class RegisterComponent extends FormAuthComponent {
  private _supabaseService = inject(SupabaseService);
  private _translateService = inject(TranslateService);

  authForm: FormGroup;
  
  config: AuthFormConfig = {
    showRememberMe: false,
    showTermsCheckbox: true,
    submitButtonText: this._translateService.instant('auth.register.submitButton'),
    title: this._translateService.instant('auth.register.title'),
    subtitle: this._translateService.instant('auth.register.subtitle'),
    linkText: this._translateService.instant('auth.register.linkText'),
    linkRoute: ROUTES.AUTH.LOGIN,
    linkLabel: this._translateService.instant('auth.register.linkLabel')
  };

  constructor() {
    super();
    this.authForm = this.createBaseForm();
  }

  async onSubmit(): Promise<void> {
    if (this.authForm.valid) {
      try {
        const { email, password } = this.authForm.value;
        console.log('Register form submitted:', { email });
        
        const { data, error } = await this._supabaseService.supabaseClient.auth.signUp({
          email,
          password
        });

        if (error) {
          throw error;
        }
        
        console.log('Registration successful:', data);
        
        // Mostrar toast de éxito
        toast.success(this._translateService.instant('toasts.register.success.title'), {
          description: this._translateService.instant('toasts.register.success.description'),
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });
        
        // Redirigir al login después del registro exitoso
        setTimeout(() => {
          this.router.navigate([ROUTES.AUTH.LOGIN]);
        }, FORM_CONSTRAINTS.timing.redirectDelay);
        
      } catch (error: any) {
        console.error('Registration error:', error);
        
        // Manejar diferentes tipos de error
        let errorMessage = this._translateService.instant('toasts.register.error.defaultError');
        
        if (error.message) {
          switch (error.message) {
            case 'User already registered':
              errorMessage = this._translateService.instant('toasts.register.error.userAlreadyExists');
              break;
            case 'Password should be at least 6 characters':
              errorMessage = this._translateService.instant('toasts.register.error.passwordTooShort');
              break;
            case 'signup_disabled':
              errorMessage = this._translateService.instant('toasts.register.error.signupDisabled');
              break;
            case 'Email rate limit exceeded':
              errorMessage = this._translateService.instant('toasts.register.error.rateLimitExceeded');
              break;
            default:
              errorMessage = error.message;
          }
        }
        
        console.error('Registration failed:', errorMessage);
        
        // Mostrar toast de error
        toast.error(this._translateService.instant('toasts.register.error.title'), {
          description: errorMessage,
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });
      }
    } else {
      this.markFormGroupTouched(this.authForm);
    }
  }
} 