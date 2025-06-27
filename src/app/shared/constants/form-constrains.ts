// Las constantes de países se importan directamente desde country-codes.constants.ts

export const FORM_CONSTRAINTS = {
    // Restricciones de longitud de campos
    maxLength: {
        email: 50,
        password: 12,
        username: 15,
    },
    minLength: {
        password: 8,
        username: 8,
    },

    // Patrones de validación
    patterns: {
        password: /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[+.*\/¿?#¡!_\-$%&])[0-9A-Za-z+.*\/¿?#¡!_\-$%&]{8,}$/, // Contraseña: debe incluir mayúsculas, minúsculas, números y caracteres especiales mencionados en el tooltip
        username: /^[a-zA-Z0-9._@-]*$/, // Username con mayúsculas, minúsculas y caracteres especiales (punto, guion bajo, arroba, guion)
    },

    // Tiempos y duraciones
    timing: {
        toastDuration: 4000, // milisegundos  
        redirectDelay: 1500, // milisegundos
        chartInitDelay: 100, // milisegundos
    }
};