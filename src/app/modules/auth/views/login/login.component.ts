import { Component, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@shared/material.module';
import { SupabaseService } from '@shared/services/supabase.service';
import { ROUTES } from '@shared/constants/routes';
import { FORM_CONSTRAINTS } from '@shared/constants/form-constrains';
import { FormAuthComponent } from '../shared/components/form-auth/form-auth.component';
import { AuthFormConfig } from '@shared/models';

@Component({
  selector: 'app-login',
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
export class LoginComponent extends FormAuthComponent {
  private _supabaseService = inject(SupabaseService);
  private _translateService = inject(TranslateService);

  authForm: FormGroup;
  
  config: AuthFormConfig = {
    showRememberMe: true,
    showTermsCheckbox: false,
    submitButtonText: this._translateService.instant('auth.login.submitButton'),
    title: this._translateService.instant('auth.login.title'),
    subtitle: this._translateService.instant('auth.login.subtitle'),
    linkText: this._translateService.instant('auth.login.linkText'),
    linkRoute: ROUTES.AUTH.REGISTER,
    linkLabel: this._translateService.instant('auth.login.linkLabel')
  };

  constructor() {
    super();
    this.authForm = this.createBaseForm();
  }

  async onSubmit(): Promise<void> {
    if (this.authForm.valid) {
      try {
        const { email, password } = this.authForm.value;
        console.log('Login form submitted:', { email });
        
        const { data, error } = await this._supabaseService.supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }
        
        console.log('Login successful:', data);
        
        // Mostrar toast de éxito
        toast.success(this._translateService.instant('toasts.login.success.title'), {
          description: this._translateService.instant('toasts.login.success.description'),
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });
        
        // Redirigir después del login exitoso
        setTimeout(() => {
          this.router.navigate([ROUTES.DASHBOARD]);
        }, FORM_CONSTRAINTS.timing.redirectDelay);
        
      } catch (error: any) {
        console.error('Login error:', error);
        
        // Manejar diferentes tipos de error
        let errorMessage = this._translateService.instant('toasts.login.error.defaultError');
        
        if (error.message) {
          switch (error.message) {
            case 'Invalid login credentials':
              errorMessage = this._translateService.instant('toasts.login.error.invalidCredentials');
              break;
            case 'Email rate limit exceeded':
              errorMessage = this._translateService.instant('toasts.login.error.rateLimitExceeded');
              break;
            case 'signup_disabled':
              errorMessage = this._translateService.instant('toasts.login.error.signupDisabled');
              break;
            default:
              errorMessage = error.message;
          }
        }
        
        console.error('Login failed:', errorMessage);
        
        // Mostrar toast de error
        toast.error(this._translateService.instant('toasts.login.error.title'), {
          description: errorMessage,
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });
      }
    } else {
      this.markFormGroupTouched(this.authForm);
    }
  }
} 