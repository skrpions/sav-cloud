import { FormGroup, ValidatorFn, Validators, AbstractControl } from '@angular/forms';
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

/**
 * Crea validadores para nombres usando las constantes definidas
 * @returns Array de validadores para nombres
 */
export function createNameValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.minLength(FORM_CONSTRAINTS.minLength.firstName),
    Validators.maxLength(FORM_CONSTRAINTS.maxLength.firstName),
    Validators.pattern(FORM_CONSTRAINTS.patterns.onlyLetters)
  ];
}

/**
 * Crea validadores para identificación usando las constantes definidas
 * @returns Array de validadores para identificación
 */
export function createIdentificationValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.minLength(FORM_CONSTRAINTS.minLength.identification),
    Validators.maxLength(FORM_CONSTRAINTS.maxLength.identification),
    Validators.pattern(FORM_CONSTRAINTS.patterns.identification)
  ];
}

/**
 * Crea validadores para teléfono usando las constantes definidas
 * @returns Array de validadores para teléfono
 */
export function createPhoneValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.minLength(FORM_CONSTRAINTS.minLength.phone),
    Validators.maxLength(FORM_CONSTRAINTS.maxLength.phone),
    Validators.pattern(FORM_CONSTRAINTS.patterns.phone)
  ];
}

/**
 * Crea validadores para dirección usando las constantes definidas
 * @returns Array de validadores para dirección
 */
export function createAddressValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.maxLength(FORM_CONSTRAINTS.maxLength.address)
  ];
}

/**
 * Crea validadores para cuenta bancaria usando las constantes definidas
 * @returns Array de validadores para cuenta bancaria
 */
export function createBankAccountValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.maxLength(FORM_CONSTRAINTS.maxLength.bankAccount),
    Validators.pattern(FORM_CONSTRAINTS.patterns.bankAccount)
  ];
}

/**
 * Crea validadores para notas usando las constantes definidas
 * @returns Array de validadores para notas
 */
export function createNotesValidators(): ValidatorFn[] {
  return [
    Validators.maxLength(FORM_CONSTRAINTS.maxLength.notes)
  ];
}

/**
 * Validador de edad mínima - verifica que la persona tenga al menos la edad especificada
 * @param minimumAge - Edad mínima requerida en años
 * @returns ValidatorFn - Función validadora
 */
export function minimumAgeValidator(minimumAge: number): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) {
      return null; // Si no hay valor, no validamos (required se encarga)
    }

    let birthDate: Date;
    
    // Manejar tanto Date objects como strings
    if (control.value instanceof Date) {
      birthDate = control.value;
    } else if (typeof control.value === 'string') {
      birthDate = new Date(control.value);
    } else {
      return null;
    }

    // Verificar que la fecha sea válida
    if (isNaN(birthDate.getTime())) {
      return null; // Si la fecha es inválida, no validamos aquí
    }

    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Ajustar la edad si el cumpleaños no ha pasado este año
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
      ? age - 1 
      : age;

    return actualAge >= minimumAge ? null : { minimumAge: { requiredAge: minimumAge, actualAge } };
  };
}

/**
 * Crea validadores para fecha de nacimiento con edad mínima
 * @param minimumAge - Edad mínima requerida (por defecto 5 años)
 * @returns Array de validadores para fecha de nacimiento
 */
export function createBirthDateValidators(minimumAge = 5): ValidatorFn[] {
  return [
    Validators.required,
    minimumAgeValidator(minimumAge)
  ];
}

// Utilidades para manejo de fechas sin problemas de zona horaria
export const DateUtils = {
  /**
   * Convierte una fecha string YYYY-MM-DD a un objeto Date local
   * sin aplicar conversiones de zona horaria
   */
  parseLocalDate(dateString: string): Date | null {
    if (!dateString || typeof dateString !== 'string') return null;
    
    // Si viene en formato ISO completo, extraer solo la fecha
    const dateOnly = dateString.split('T')[0];
    const parts = dateOnly.split('-');
    
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0-11
    const day = parseInt(parts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    
    return new Date(year, month, day);
  },

  /**
   * Convierte un objeto Date a string en formato YYYY-MM-DD
   * sin aplicar conversiones de zona horaria
   */
  formatToLocalDate(date: Date): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },

  /**
   * Formatea una fecha string a formato DD/MM/YYYY para mostrar al usuario
   */
  formatToDisplay(dateString: string): string {
    const date = this.parseLocalDate(dateString);
    if (!date) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  },

  /**
   * Convierte fecha de formulario (puede ser Date o string) a string YYYY-MM-DD
   * para enviar al backend
   */
  formatForBackend(formValue: Date | string): string {
    if (!formValue) return '';
    
    if (formValue instanceof Date) {
      return this.formatToLocalDate(formValue);
    }
    
    if (typeof formValue === 'string') {
      // Si ya está en formato YYYY-MM-DD, devolverlo tal como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(formValue)) {
        return formValue;
      }
      
      // Si está en otro formato, intentar parsearlo
      const date = this.parseLocalDate(formValue);
      return date ? this.formatToLocalDate(date) : '';
    }
    
    return '';
  },

  /**
   * Convierte fecha del backend a Date object para el datepicker
   * Específicamente para evitar problemas de zona horaria en el formulario
   */
  formatForDatepicker(dateString: string): Date | null {
    const localDate = this.parseLocalDate(dateString);
    return localDate;
  }
}; 