import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
export class RegisterComponent extends FormAuthComponent implements OnInit {
  private _supabaseService = inject(SupabaseService);
  private _cdr = inject(ChangeDetectorRef);

  authForm: FormGroup;
  config: AuthFormConfig = {} as AuthFormConfig;

  constructor() {
    super();
    
    // Inicializar configuración con traducciones seguras
    this.initializeConfig();
    
    // Crear el formulario después de inicializar config
    this.authForm = this.createBaseForm();
  }

  ngOnInit(): void {
    // Actualizar traducciones cuando estén disponibles
    this.initializeConfig();
    
    // Forzar detección de cambios para evitar NG0100
    this._cdr.detectChanges();
  }

  private initializeConfig(): void {
    this.config = {
      showRememberMe: false,
      showTermsCheckbox: true,
      submitButtonText: this.safeTranslate('auth.register.submitButton', 'Registrarse'),
      title: this.safeTranslate('auth.register.title', 'Registrarse'),
      subtitle: this.safeTranslate('auth.register.subtitle', 'Crea tu nueva cuenta'),
      linkText: this.safeTranslate('auth.register.linkText', '¿Ya tienes una cuenta?'),
      linkRoute: ROUTES.AUTH.LOGIN,
      linkLabel: this.safeTranslate('auth.register.linkLabel', 'Inicia Sesión')
    };
  }

  async onSubmit(): Promise<void> {
    if (this.authForm.valid) {
      try {
        const { email, password } = this.authForm.value;
        console.log('Register form submitted:', { email });
        
        const { data, error } = await this._supabaseService.handleAuthOperation(async () => {
          return await this._supabaseService.supabaseClient.auth.signUp({
            email,
            password
          });
        });

        if (error) {
          throw error;
        }
        
        console.log('Registration successful:', data);
        
        // Mostrar toast de éxito
        toast.success(this.safeTranslate('toasts.register.success.title', 'Registro exitoso'), {
          description: this.safeTranslate('toasts.register.success.description', 'Revisa tu correo para verificar tu cuenta'),
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });
        
        // Redirigir al login después del registro exitoso
        setTimeout(() => {
          this.router.navigate([ROUTES.AUTH.LOGIN]);
        }, FORM_CONSTRAINTS.timing.redirectDelay);
        
      } catch (error: any) {
        console.error('Registration error:', error);
        
        // Manejar diferentes tipos de error
        let errorMessage = this.safeTranslate('toasts.register.error.defaultError', 'Error inesperado');
        
        if (error.message || error.name) {
          if (error.message?.includes('NavigatorLockAcquireTimeoutError') || 
              error.message?.includes('lock') ||
              error.name === 'NavigatorLockAcquireTimeoutError') {
            errorMessage = this.safeTranslate('toasts.register.error.lockTimeout', 'Error temporal de conexión');
          } else {
            switch (error.message) {
              case 'User already registered':
                errorMessage = this.safeTranslate('toasts.register.error.userAlreadyExists', 'Usuario ya existe');
                break;
              case 'Password should be at least 6 characters':
                errorMessage = this.safeTranslate('toasts.register.error.passwordTooShort', 'Contraseña muy corta');
                break;
              case 'signup_disabled':
                errorMessage = this.safeTranslate('toasts.register.error.signupDisabled', 'Registro deshabilitado');
                break;
              case 'Email rate limit exceeded':
                errorMessage = this.safeTranslate('toasts.register.error.rateLimitExceeded', 'Demasiados intentos');
                break;
              default:
                errorMessage = error.message;
            }
          }
        }
        
        console.error('Registration failed:', errorMessage);
        
        // Mostrar toast de error
        toast.error(this.safeTranslate('toasts.register.error.title', 'Error en el registro'), {
          description: errorMessage,
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });
      }
    } else {
      this.markFormGroupTouched(this.authForm);
    }
  }
} 