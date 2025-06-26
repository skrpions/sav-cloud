import { Component, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material.module';
import { FormAuthComponent, AuthFormConfig } from '../shared/components/form-auth/form-auth.component';
import { SupabaseService } from '../../../../shared/services/supabase.service';
import { ROUTES } from '../../../../shared/constants/routes';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    RouterLink
  ],
  templateUrl: '../shared/components/form-auth/form-auth.component.html',
  styleUrl: '../shared/components/form-auth/form-auth.component.scss'
})
export class LoginComponent extends FormAuthComponent {
  private _supabaseService = inject(SupabaseService);

  authForm: FormGroup;
  
  config: AuthFormConfig = {
    showRememberMe: true,
    showTermsCheckbox: false,
    submitButtonText: 'Sign In',
    title: 'Sign In',
    subtitle: 'Enter your email and password to Sign In',
    linkText: "Don't have an account?",
    linkRoute: ROUTES.AUTH.REGISTER,
    linkLabel: 'Sign up'
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
        toast.success('Welcome back!', {
          description: 'You have been successfully signed in.',
          duration: 3000
        });
        
        // Redirigir después del login exitoso
        setTimeout(() => {
          this.router.navigate([ROUTES.DASHBOARD]);
        }, 1000);
        
      } catch (error: any) {
        console.error('Login error:', error);
        
        // Manejar diferentes tipos de error
        let errorMessage = 'An unexpected error occurred. Please try again.';
        
        if (error.message) {
          switch (error.message) {
            case 'Invalid login credentials':
              errorMessage = 'Invalid email or password. Please check your credentials and try again.';
              break;
            case 'Email rate limit exceeded':
              errorMessage = 'Too many login attempts. Please wait a moment and try again.';
              break;
            case 'signup_disabled':
              errorMessage = 'Authentication is currently disabled.';
              break;
            default:
              errorMessage = error.message;
          }
        }
        
        console.error('Login failed:', errorMessage);
        
        // Mostrar toast de error
        toast.error('Login failed', {
          description: errorMessage,
          duration: 4000
        });
      }
    } else {
      this.markFormGroupTouched(this.authForm);
    }
  }
} 