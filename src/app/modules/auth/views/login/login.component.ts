import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@/app/shared/material.module';
import { AuthFormConfig } from '@/app/shared/models/ui.models';
import { SupabaseService } from '@/app/shared/services/supabase.service';
import { AuthService } from '@/app/core/application/services/auth.service';
import { createEmailValidators, createPasswordValidators } from '@/app/shared/utils/validators';

@Component({
  selector: 'app-login',
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
export class LoginComponent implements OnInit {
  private _supabaseService = inject(SupabaseService);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _formBuilder = inject(FormBuilder);
  private _cdr = inject(ChangeDetectorRef);

  authForm: FormGroup;
  config: AuthFormConfig = {} as AuthFormConfig;
  hidePassword = true;

  constructor() {
    this.authForm = this.createBaseForm();
  }

  ngOnInit(): void {
    this.initializeConfig();
  }

  private createBaseForm(): FormGroup {
    return this._formBuilder.group({
      email: ['sksmartinez@gmail.com', createEmailValidators()],
      password: ['Pa$$w0rd!', createPasswordValidators()],
      rememberMe: [false]
    });
  }

  private initializeConfig(): void {
    this.config = {
      title: 'Iniciar Sesión',
      subtitle: 'Accede a tu cuenta SAV Cloud',
      submitButtonText: 'Iniciar Sesión',
      linkText: '¿No tienes cuenta?',
      linkRoute: '/auth/register',
      linkLabel: 'Regístrate aquí',
      showRememberMe: true
    };
  }

  async onSubmit(): Promise<void> {
    if (this.authForm.invalid) {
      this.markFormGroupTouched(this.authForm);
      return;
    }

    const formData = this.authForm.value;
    
    try {
      const response = await this._authService.signIn({
        email: formData.email,
        password: formData.password
      });

      if (response.error) {
        console.error('Login error:', response.error);
        toast.error('Error de autenticación', {
          description: response.error.message
        });
        return;
      }

      toast.success('Bienvenido', {
        description: 'Has iniciado sesión correctamente'
      });
      
      this._router.navigate(['/dashboard']);
        
    } catch (error) {
      console.error('Unexpected login error:', error);
      toast.error('Error inesperado', {
        description: 'Ocurrió un error durante el inicio de sesión'
      });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  isFieldRequired(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control?.hasError('required') && (control?.dirty || control?.touched));
  }

  isEmailInvalid(form: FormGroup): boolean {
    const emailControl = form.get('email');
    return !!(emailControl?.hasError('email') && (emailControl?.dirty || emailControl?.touched));
  }

  isPasswordMinLengthInvalid(form: FormGroup): boolean {
    const passwordControl = form.get('password');
    return !!(passwordControl?.hasError('minlength') && (passwordControl?.dirty || passwordControl?.touched));
  }

  isPasswordPatternInvalid(form: FormGroup): boolean {
    const passwordControl = form.get('password');
    return !!(passwordControl?.hasError('pattern') && (passwordControl?.dirty || passwordControl?.touched));
  }
} 