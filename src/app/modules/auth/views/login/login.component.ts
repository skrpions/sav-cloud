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
export class LoginComponent extends FormAuthComponent implements OnInit {
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
      showRememberMe: true,
      showTermsCheckbox: false,
      submitButtonText: this.safeTranslate('auth.login.submitButton', 'Iniciar Sesión'),
      title: this.safeTranslate('auth.login.title', 'Iniciar Sesión'),
      subtitle: this.safeTranslate('auth.login.subtitle', 'Accede a tu cuenta'),
      linkText: this.safeTranslate('auth.login.linkText', '¿No tienes una cuenta?'),
      linkRoute: ROUTES.AUTH.REGISTER,
      linkLabel: this.safeTranslate('auth.login.linkLabel', 'Regístrate')
    };
  }

  async onSubmit(): Promise<void> {
    if (this.authForm.valid) {
      try {
        const { email, password } = this.authForm.value;
        console.log('Login form submitted:', { email });
        
        const { data, error } = await this._supabaseService.handleAuthOperation(async () => {
          return await this._supabaseService.supabaseClient.auth.signInWithPassword({
            email,
            password
          });
        });

        if (error) {
          throw error;
        }
        
        console.log('Login successful:', data);
        
        // Mostrar toast de éxito
        toast.success(this.safeTranslate('toasts.login.success.title', 'Bienvenido de vuelta'), {
          description: this.safeTranslate('toasts.login.success.description', 'Has iniciado sesión exitosamente'),
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });
        
        // Redirigir después del login exitoso
        setTimeout(() => {
          this.router.navigate([ROUTES.DASHBOARD]);
        }, FORM_CONSTRAINTS.timing.redirectDelay);
        
      } catch (error: any) {
        console.error('Login error:', error);
        
        // Manejar diferentes tipos de error
        let errorMessage = this.safeTranslate('toasts.login.error.defaultError', 'Error inesperado');
        
        if (error.message || error.name) {
          if (error.message?.includes('NavigatorLockAcquireTimeoutError') || 
              error.message?.includes('lock') ||
              error.name === 'NavigatorLockAcquireTimeoutError') {
            errorMessage = this.safeTranslate('toasts.login.error.lockTimeout', 'Error temporal de conexión');
          } else {
            switch (error.message) {
              case 'Invalid login credentials':
                errorMessage = this.safeTranslate('toasts.login.error.invalidCredentials', 'Credenciales inválidas');
                break;
              case 'Email rate limit exceeded':
                errorMessage = this.safeTranslate('toasts.login.error.rateLimitExceeded', 'Demasiados intentos');
                break;
              case 'signup_disabled':
                errorMessage = this.safeTranslate('toasts.login.error.signupDisabled', 'Autenticación deshabilitada');
                break;
              default:
                errorMessage = error.message;
            }
          }
        }
        
        console.error('Login failed:', errorMessage);
        
        // Mostrar toast de error
        toast.error(this.safeTranslate('toasts.login.error.title', 'Error al iniciar sesión'), {
          description: errorMessage,
          duration: FORM_CONSTRAINTS.timing.toastDuration
        });
      }
    } else {
      this.markFormGroupTouched(this.authForm);
    }
  }
} 