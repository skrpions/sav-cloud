import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';

import { MaterialModule } from '@/app/shared/material.module';
import { SupabaseService } from '@/app/shared/services/supabase.service';
import { AuthService } from '@/app/core/application/services/auth.service';
import { createPasswordValidators } from '@/app/shared/utils/validators';

@Component({
  selector: 'app-lock',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './lock.component.html',
  styleUrl: '../shared/components/form-auth/form-auth.component.scss'
})
export class LockComponent implements OnInit {
  private _supabaseService = inject(SupabaseService);
  private _authService = inject(AuthService);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _formBuilder = inject(FormBuilder);
  private _cdr = inject(ChangeDetectorRef);

  lockForm: FormGroup;
  userEmail = '';
  hidePassword = true;

  constructor() {
    this.lockForm = this.createLockForm();
  }

  ngOnInit(): void {
    this.setupSessionRenewal();
  }

  private createLockForm(): FormGroup {
    return this._formBuilder.group({
      password: ['Pa$$w0rd!', createPasswordValidators()]
    });
  }

  private async setupSessionRenewal(): Promise<void> {
    try {
      // Intentar obtener el email del usuario desde el token expirado
      const user = await this._authService.getCurrentUser();
      if (user?.email) {
        this.userEmail = user.email;
      } else {
        // Si no hay usuario, obtener de query params o redirigir al login
        this._route.queryParams.subscribe(params => {
          if (params['email']) {
            this.userEmail = params['email'];
          } else {
            // No hay información del usuario, redirigir al login
            this._router.navigate(['/auth/login']);
          }
        });
      }
    } catch {
      // Si no se puede obtener el usuario, redirigir al login normal
      this._router.navigate(['/auth/login']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.lockForm.invalid) {
      this.markFormGroupTouched(this.lockForm);
      return;
    }

    const formData = this.lockForm.value;
    
    try {
      const response = await this._authService.renewSessionWithPassword(formData.password);

      if (response.error) {
        console.error('Session renewal error:', response.error);
        toast.error('Error al renovar sesión', {
          description: response.error.message || 'Verifica tu contraseña'
        });
        return;
      }

      toast.success('Sesión renovada', {
        description: 'Has accedido nuevamente a tu cuenta'
      });
      
      // Redirigir de vuelta o al dashboard
      const returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this._router.navigateByUrl(returnUrl);
        
    } catch (error) {
      console.error('Unexpected session renewal error:', error);
      toast.error('Error inesperado', {
        description: 'Ocurrió un error durante la renovación de sesión'
      });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  goToLogin(): void {
    this._router.navigate(['/auth/login']);
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

  isPasswordMinLengthInvalid(form: FormGroup): boolean {
    const passwordControl = form.get('password');
    return !!(passwordControl?.hasError('minlength') && (passwordControl?.dirty || passwordControl?.touched));
  }

  isPasswordPatternInvalid(form: FormGroup): boolean {
    const passwordControl = form.get('password');
    return !!(passwordControl?.hasError('pattern') && (passwordControl?.dirty || passwordControl?.touched));
  }
} 