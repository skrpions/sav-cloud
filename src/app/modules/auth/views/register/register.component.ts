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
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    RouterLink
  ],
  templateUrl: '../shared/components/form-auth/form-auth.component.html',
  styleUrl: '../shared/components/form-auth/form-auth.component.scss'
})
export class RegisterComponent extends FormAuthComponent {
  private _supabaseService = inject(SupabaseService);

  authForm: FormGroup;
  
  config: AuthFormConfig = {
    showRememberMe: false,
    showTermsCheckbox: true,
    submitButtonText: 'Sign Up',
    title: 'Sign Up',
    subtitle: 'Enter your email and password to create your account',
    linkText: "Already have an account?",
    linkRoute: ROUTES.AUTH.LOGIN,
    linkLabel: 'Sign in'
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
        toast.success('Registration successful!', {
          description: 'Please check your email to verify your account.',
          duration: 4000
        });
        
        // Redirigir al login después del registro exitoso
        setTimeout(() => {
          this.router.navigate([ROUTES.AUTH.LOGIN]);
        }, 1500);
        
      } catch (error: any) {
        console.error('Registration error:', error);
        
        // Manejar diferentes tipos de error
        let errorMessage = 'An unexpected error occurred. Please try again.';
        
        if (error.message) {
          switch (error.message) {
            case 'User already registered':
              errorMessage = 'An account with this email already exists. Please sign in instead.';
              break;
            case 'Password should be at least 6 characters':
              errorMessage = 'Password must be at least 6 characters long.';
              break;
            case 'signup_disabled':
              errorMessage = 'Registration is currently disabled.';
              break;
            case 'Email rate limit exceeded':
              errorMessage = 'Too many registration attempts. Please wait a moment and try again.';
              break;
            default:
              errorMessage = error.message;
          }
        }
        
        console.error('Registration failed:', errorMessage);
        
        // Mostrar toast de error
        toast.error('Registration failed', {
          description: errorMessage,
          duration: 4000
        });
      }
    } else {
      this.markFormGroupTouched(this.authForm);
    }
  }
} 