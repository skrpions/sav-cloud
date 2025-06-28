import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInfrastructure } from './core/infrastructure/auth-infrastructure';
import { AuthApplication } from './core/application/auth-application';
import { UserInfrastructure } from './core/infrastructure/user-infrastructure';
import { UserApplication } from './core/application/user-application';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { UserService } from './shared/services/user.service';

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

// Función de inicialización simple
function initializeApp(): () => Promise<void> {
  return () => {
    return Promise.resolve();
  };
}

// Función para inicializar las traducciones
function initializeTranslations(translateService: TranslateService): () => Promise<void> {
  return () => {
    return new Promise<void>((resolve) => {
      translateService.setDefaultLang('es');
      translateService.use('es').subscribe({
        next: () => resolve(),
        error: () => resolve() // Continue anyway with default values
      });
    });
  };
}

// Función para inicializar el servicio de usuario
function initializeUserService(userService: UserService): () => Promise<void> {
  return () => {
    return userService.loadCurrentUser().catch(() => {
      // Silent fail - let the app continue
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
    // Inicialización de la aplicación
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true
    },
    // Inicializar traducciones
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslations,
      deps: [TranslateService],
      multi: true
    },
    // Inicializar servicio de usuario
    {
      provide: APP_INITIALIZER,
      useFactory: initializeUserService,
      deps: [UserService],
      multi: true
    },
    // Hexagonal Architecture providers
    AuthApplication,
    AuthInfrastructure,
    UserApplication,
    UserInfrastructure,
  ]
};
