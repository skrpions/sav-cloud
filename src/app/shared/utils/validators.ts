import { FormGroup } from '@angular/forms';

/**
 * Verifica si un campo es requerido y tiene errores
 * @param field - Nombre del campo a validar
 * @param form - FormGroup que contiene el campo
 * @returns boolean - true si el campo es requerido y tiene errores
 */
export function isRequired(field: string, form: FormGroup): boolean {
  const control = form.get(field);
  return !!(control?.invalid && control?.touched && control?.errors?.['required']);
}

/**
 * Verifica si el campo email tiene un formato inválido
 * @param form - FormGroup que contiene el campo email
 * @returns boolean - true si el email tiene formato inválido
 */
export function isEmail(form: FormGroup): boolean {
  const emailControl = form.get('email');
  return !!(emailControl?.invalid && emailControl?.touched && emailControl?.errors?.['email']);
}

/**
 * Verifica si la contraseña no cumple con la longitud mínima
 * @param form - FormGroup que contiene el campo password
 * @returns boolean - true si la contraseña es muy corta
 */
export function isPasswordMinLength(form: FormGroup): boolean {
  const passwordControl = form.get('password');
  return !!(passwordControl?.invalid && passwordControl?.touched && passwordControl?.errors?.['minlength']);
}

/**
 * Obtiene el mensaje de error para un campo específico
 * @param field - Nombre del campo
 * @param form - FormGroup que contiene el campo
 * @returns string - Mensaje de error o cadena vacía
 */
export function getFieldError(field: string, form: FormGroup): string {
  const control = form.get(field);
  
  if (!control?.errors || !control?.touched) {
    return '';
  }

  const errors = control.errors;
  
  if (errors['required']) {
    return `${field} is required`;
  }
  
  if (errors['email']) {
    return 'Please enter a valid email address';
  }
  
  if (errors['minlength']) {
    const requiredLength = errors['minlength'].requiredLength;
    return `${field} must be at least ${requiredLength} characters long`;
  }
  
  if (errors['maxlength']) {
    const requiredLength = errors['maxlength'].requiredLength;
    return `${field} must not exceed ${requiredLength} characters`;
  }
  
  return 'Invalid input';
} 