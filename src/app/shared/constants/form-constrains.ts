// Las constantes de países se importan directamente desde country-codes.constants.ts

export const FORM_CONSTRAINTS = {
    // Restricciones de longitud de campos
    maxLength: {
        email: 50,
        password: 12,
        username: 15,
        firstName: 50,
        lastName: 50,
        identification: 20,
        phone: 15,
        address: 200,
        emergencyContactName: 100,
        emergencyContactPhone: 15,
        bankAccount: 30,
        notes: 500,
    },
    minLength: {
        password: 8,
        username: 8,
        firstName: 2,
        lastName: 2,
        identification: 5,
        phone: 10,
    },

    // Patrones de validación
    patterns: {
        password: /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[+.*\/¿?#¡!_\-$%&])[0-9A-Za-z+.*\/¿?#¡!_\-$%&]{8,}$/, // Contraseña: debe incluir mayúsculas, minúsculas, números y caracteres especiales mencionados en el tooltip
        username: /^[a-zA-Z0-9._@-]*$/, // Username con mayúsculas, minúsculas y caracteres especiales (punto, guion bajo, arroba, guion)
        phone: /^[+]?[0-9\s\-\(\)]{10,15}$/, // Teléfono: números, espacios, guiones, paréntesis y opcionalmente +
        identification: /^[a-zA-Z0-9\-]*$/, // Identificación: letras, números y guiones
        onlyLetters: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, // Solo letras y espacios (incluye acentos)
        bankAccount: /^[0-9\-\s]*$/, // Cuenta bancaria: solo números, guiones y espacios
    },

    // Tiempos y duraciones
    timing: {
        toastDuration: 4000, // milisegundos  
        redirectDelay: 1500, // milisegundos
        chartInitDelay: 100, // milisegundos
    }
};