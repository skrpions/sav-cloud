import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInfrastructure } from './core/infrastructure/auth-infrastructure';
import { AuthApplication } from './core/application/auth-application';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';

function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './i18n/', '.json');
}

export const provideTranslation = () => ({
  defaultLanguage: 'es',
  useDefaultLang: true,
  loader: {
    provide: TranslateLoader,
    useFactory: HttpLoaderFactory,
    deps: [HttpClient],
  },
});

// Función para limpiar SOLO storage de autenticación problemático, preservando traducciones
function initializeApp(): () => Promise<void> {
  return () => {
    return new Promise<void>((resolve) => {
      try {
        // Lista específica de keys problemáticos de Supabase
        const problematicKeys = [
          'sb-wprmvvkrtizngssfcpii-auth-token',
          'sav-cloud-auth-token',
          'supabase.auth.token',
          'supabase.session'
        ];
        
        // Solo remover keys específicos de Supabase que causan locks
        Object.keys(localStorage).forEach(key => {
          if (problematicKeys.some(problematicKey => key.includes(problematicKey)) ||
              (key.startsWith('sb-') && key.includes('auth-token'))) {
            localStorage.removeItem(key);
            console.log(`Removed problematic auth key: ${key}`);
          }
        });

        // Mismo proceso para sessionStorage
        Object.keys(sessionStorage).forEach(key => {
          if (problematicKeys.some(problematicKey => key.includes(problematicKey)) ||
              (key.startsWith('sb-') && key.includes('auth-token'))) {
            sessionStorage.removeItem(key);
            console.log(`Removed problematic session key: ${key}`);
          }
        });

        console.log('Specific auth storage cleanup completed - translations preserved');
      } catch (error) {
        console.warn('Could not clear problematic auth storage:', error);
      }
      resolve();
    });
  };
}

// Función para inicializar las traducciones
function initializeTranslations(translateService: TranslateService): () => Promise<void> {
  return () => {
    return new Promise<void>((resolve) => {
      translateService.setDefaultLang('es');
      translateService.use('es').subscribe({
        next: () => {
          console.log('✅ Translations loaded successfully');
          resolve();
        },
        error: (error) => {
          console.warn('⚠️ Error loading translations:', error);
          resolve(); // Continue anyway with default values
        }
      });
    });
  };
}

// DateAdapter personalizado para formato DD/MM/AAAA
export class SpanishDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return super.format(date, displayFormat);
  }

  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0-11
        const year = parseInt(parts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    return super.parse(value);
  }
}

// Configuración del formato de fecha para DD/MM/AAAA
export const CUSTOM_DATE_FORMATS = {
  parse: {
    dateInput: 'input',
  },
  display: {
    dateInput: 'input',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    importProvidersFrom([TranslateModule.forRoot(provideTranslation())]),
    // Configuración del DateAdapter para formato DD/MM/AAAA
    { provide: DateAdapter, useClass: SpanishDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    // Limpiar storage de autenticación al inicializar la aplicación
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true
    },
    // Inicializar traducciones antes de mostrar componentes
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslations,
      deps: [TranslateService],
      multi: true
    },
    // Hexagonal Architecture providers
    AuthApplication,
    AuthInfrastructure,
  ]
};
