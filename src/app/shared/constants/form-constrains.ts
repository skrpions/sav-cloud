// Constraints for forms validation and timing
export const FORM_CONSTRAINTS = {
  // Validations
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZñÑáéíóúüÁÉÍÓÚÜ\s]+$/
  },
  identification: {
    minLength: 6,
    maxLength: 20,
    pattern: /^[0-9]+$/
  },
  email: {
    maxLength: 100,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  phone: {
    minLength: 10,
    maxLength: 15,
    pattern: /^[+]?[0-9\s-()]+$/
  },
  address: {
    minLength: 10,
    maxLength: 200
  },
  notes: {
    maxLength: 500
  },
  password: {
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },
  
  // Top-level validation properties for backward compatibility
  minLength: {
    email: 5,
    password: 8,
    username: 3,
    firstName: 2,
    identification: 6,
    phone: 10
  },
  maxLength: {
    email: 100,
    password: 128,
    username: 30,
    firstName: 50,
    identification: 20,
    phone: 15,
    address: 200,
    bankAccount: 20,
    notes: 500
  },
  patterns: {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    username: /^[a-zA-Z0-9_]+$/,
    onlyLetters: /^[a-zA-ZñÑáéíóúüÁÉÍÓÚÜ\s]+$/,
    identification: /^[0-9]+$/,
    phone: /^[+]?[0-9\s-()]+$/,
    bankAccount: /^[0-9]+$/
  },
  
  // Age validations
  minimumAge: {
    years: 18 // Default minimum age
  },
  
  // Timing
  timing: {
    toastDuration: 3000, // milliseconds
    autoSaveDelay: 2000, // milliseconds
    redirectDelay: 2000, // milliseconds for auth redirects
    chartInitDelay: 1000 // milliseconds for chart initialization
  }
};

// Temporary constants for single-farm operation
// @deprecated Use FarmStateService.getCurrentFarmIdOrDefault() instead
// TODO: Remove these when multi-farm management is fully implemented
export const TEMP_FARM_CONSTANTS = {
  // @deprecated Use FarmStateService for farm ID management
  DEFAULT_FARM_ID: '00000000-0000-0000-0000-000000000001',
  
  // Default farm settings
  DEFAULT_FARM_SETTINGS: {
    currency: 'COP',
    tax_percentage: 0,
    crop_prices: {
      coffee: {
        price_per_kg: 5000,
        unit: 'kg' as const
      }
    },
    activity_rates: {
      fertilization: 50000,
      fumigation: 45000,
      pruning: 40000,
      weeding: 35000,
      planting: 30000,
      maintenance: 25000,
      other: 30000
    },
    quality_premiums: {
      premium: 1000,
      standard: 0,
      low: -500
    }
  }
};