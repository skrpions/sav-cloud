import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@/app/shared/material.module';
import { AuthFormConfig } from '@/app/shared/models/ui.models';
import { FormAuthComponent } from '../shared/components/form-auth/form-auth.component';
import { SupabaseService } from '@/app/shared/services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    TranslateModule,
    RouterModule
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
    // Crear el formulario con valores hardcodeados
    this.authForm = this.createBaseForm();
    // Hardcodear los valores para testing rápido
    this.authForm.patchValue({
      email: 'sksmartinez@gmail.com',
      password: 'Pa$$w0rd!'
    });
  }

  ngOnInit(): void {
    this.initializeConfig();
  }

  private initializeConfig(): void {
    this.config = {
      title: 'Crear Cuenta',
      subtitle: 'Regístrate en SAV Cloud',
      submitButtonText: 'Crear Cuenta',
      linkText: '¿Ya tienes cuenta?',
      linkRoute: '/auth/login',
      linkLabel: 'Inicia sesión aquí',
      showTermsCheckbox: true
    };
  }

  async onSubmit(): Promise<void> {
    if (this.authForm.invalid) {
      this.markFormGroupTouched(this.authForm);
      return;
    }

    const formData = this.authForm.value;

    try {
      const response = await this.authService.signUp({
        email: formData.email,
        password: formData.password
      });

      if (response.error) {
        console.error('Registration error:', response.error);
        toast.error('Error de registro', {
          description: response.error.message
        });
        return;
      }

      toast.success('Registro exitoso', {
        description: 'Revisa tu email para verificar tu cuenta'
      });

      this.router.navigate(['/auth/login']);

    } catch (error) {
      console.error('Unexpected registration error:', error);
      toast.error('Error inesperado', {
        description: 'Ocurrió un error durante el registro'
      });
    }
  }
} 