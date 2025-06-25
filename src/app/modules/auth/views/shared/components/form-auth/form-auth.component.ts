import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../../core/application/services/auth.service';

export interface AuthFormConfig {
  showRememberMe?: boolean;
  showTermsCheckbox?: boolean;
  submitButtonText: string;
  title: string;
  subtitle: string;
  linkText: string;
  linkRoute: string;
  linkLabel: string;
}

@Component({
  template: '',
  imports: [CommonModule]
})
export abstract class FormAuthComponent {
  // * Injection
  private _fb = inject(FormBuilder);
  private _router = inject(Router);
  private _authSrv = inject(AuthService);

  abstract config: AuthFormConfig;
  
  hidePassword = true;

  protected createBaseForm(): FormGroup {
    const baseControls: any = {
      email: ['sksmartinez@gmail.com', [Validators.required, Validators.email]],
      password: ['123456', [Validators.required, Validators.minLength(6)]]
    };

    if (this.config.showRememberMe) {
      baseControls.rememberMe = [false];
    }

    if (this.config.showTermsCheckbox) {
      baseControls.checkTerms = [false];
    }

    return this._fb.group(baseControls);
  }

  abstract onSubmit(): void;

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  protected markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  // Utilidades para validaciones
  isFieldRequired(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control?.invalid && control?.touched && control?.errors?.['required']);
  }

  isEmailInvalid(form: FormGroup): boolean {
    const emailControl = form.get('email');
    return !!(emailControl?.invalid && emailControl?.touched && emailControl?.errors?.['email']);
  }

  isPasswordMinLengthInvalid(form: FormGroup): boolean {
    const passwordControl = form.get('password');
    return !!(passwordControl?.invalid && passwordControl?.touched && passwordControl?.errors?.['minlength']);
  }

  // Getters para acceder a servicios desde clases hijas
  protected get authService(): AuthService {
    return this._authSrv;
  }

  protected get router(): Router {
    return this._router;
  }
} 