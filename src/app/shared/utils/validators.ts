import { FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { FORM_CONSTRAINTS } from '../constants/form-constrains';

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
 * Verifica si la contraseña no cumple con el patrón requerido
 * @param form - FormGroup que contiene el campo password
 * @returns boolean - true si la contraseña no cumple el patrón
 */
export function isPasswordPattern(form: FormGroup): boolean {
  const passwordControl = form.get('password');
  return !!(passwordControl?.invalid && passwordControl?.touched && passwordControl?.errors?.['pattern']);
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

  if (errors['pattern']) {
    if (field === 'password') {
      return 'Password must include uppercase, lowercase, number and special character';
    }
    return 'Invalid format';
  }
  
  return 'Invalid input';
}

/**
 * Crea validadores para email usando las constantes definidas
 * @returns Array de validadores para email
 */
export function createEmailValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.email,
    Validators.maxLength(FORM_CONSTRAINTS.maxLength.email)
  ];
}

/**
 * Crea validadores para contraseña usando las constantes definidas
 * @returns Array de validadores para contraseña
 */
export function createPasswordValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.minLength(FORM_CONSTRAINTS.minLength.password),
    Validators.maxLength(FORM_CONSTRAINTS.maxLength.password),
    Validators.pattern(FORM_CONSTRAINTS.patterns.password)
  ];
}

/**
 * Crea validadores para username usando las constantes definidas
 * @returns Array de validadores para username
 */
export function createUsernameValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.minLength(FORM_CONSTRAINTS.minLength.username),
    Validators.maxLength(FORM_CONSTRAINTS.maxLength.username),
    Validators.pattern(FORM_CONSTRAINTS.patterns.username)
  ];
} 