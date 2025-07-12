import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@/environments/environment';

/**
 * SupabaseService configurado para evitar NavigatorLockAcquireTimeoutError
 * 
 * ESTRATEGIA ANTI-LOCK:
 * 1. Lazy initialization: El cliente se crea solo cuando se necesita
 * 2. Sin persistSession: Evita conflictos de storage entre pestañas
 * 3. Sin autoRefreshToken: Previene locks automáticos
 * 4. Sin storage: Elimina completamente el uso de localStorage para auth
 * 5. Limpieza selectiva: Elimina tokens problemáticos pero PRESERVA caché del usuario
 * 
 * MÉTODO DE EMERGENCIA:
 * Si persisten problemas, ejecuta en consola: emergencyClearAuth()
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private _supabaseClient: SupabaseClient | null = null;

  constructor() {
    this.aggressiveClearAuthState();
  }

  // Limpieza selectiva del estado de autenticación (PRESERVA caché de usuario)
  private aggressiveClearAuthState(): void {
    try {
      // Limpiar localStorage - solo tokens de auth, NO el caché del usuario
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        // PRESERVAR sav-cloud-user (caché del usuario)
        if (key === 'sav-cloud-user') {
          return;
        }
        
        if (key.includes('supabase') || 
            key.includes('sb-') || 
            key.includes('auth') ||
            key.includes('sav-cloud-auth')) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpiar sessionStorage - solo tokens de auth
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach(key => {
        // PRESERVAR sav-cloud-user (caché del usuario)
        if (key === 'sav-cloud-user') {
          return;
        }
        
        if (key.includes('supabase') || 
            key.includes('sb-') || 
            key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });

      // Limpiar también cookies relacionadas con autenticación
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });

    } catch (error) {
      console.warn('Could not perform auth cleanup:', error);
    }
  }

  // Crear el cliente Supabase solo cuando se necesite (lazy initialization)
  private createSupabaseClient(): SupabaseClient {
    if (!this._supabaseClient) {
      this.aggressiveClearAuthState();
      
      this._supabaseClient = createClient(
        environment.supabaseUrl,
        environment.supabaseKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
            flowType: 'implicit',
            storage: undefined,
            debug: false
          },
          global: {
            headers: {
              'X-Supabase-Client': 'sav-cloud-no-lock'
            }
          }
        }
      );
    }
    return this._supabaseClient;
  }

  get supabaseClient(): SupabaseClient {
    return this.createSupabaseClient();
  }

  // Limpiar almacenamiento de autenticación para evitar conflictos (preserva caché del usuario)
  private clearAuthStorage(): void {
    this.aggressiveClearAuthState();
  }

  // Método auxiliar para manejar errores de lock con retry logic
  async handleAuthOperation(operation: () => Promise<any>): Promise<any> {
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const isLockError = error.message?.includes('NavigatorLockAcquireTimeoutError') || 
          error.message?.includes('lock') ||
          error.name === 'NavigatorLockAcquireTimeoutError';

        if (isLockError && attempt < maxRetries) {
          if (attempt === 2) {
            this.clearAuthStorage();
          }
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        
        throw error;
      }
    }
  }

  // Método para limpiar completamente la sesión de autenticación
  async clearSession(): Promise<void> {
    try {
      if (this._supabaseClient) {
        await this._supabaseClient.auth.signOut();
      }
      this.clearAuthStorage();
    } catch (error) {
      console.warn('Error clearing session:', error);
      this.clearAuthStorage();
    }
  }

  // Método de emergencia para limpiar completamente el navegador
  emergencyClearAll(): void {
    console.warn('🚨 EMERGENCY CLEAR: Clearing all browser storage');
    console.warn('⚠️ WARNING: This will also remove user cache - you will need to login again');
    
    try {
      // Limpiar localStorage completo (incluyendo caché del usuario)
      localStorage.clear();
      console.log('✅ localStorage cleared (including user cache)');
      
      // Limpiar sessionStorage completo
      sessionStorage.clear();
      console.log('✅ sessionStorage cleared');
      
      // Limpiar todas las cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      console.log('✅ Cookies cleared');
      
      // Reset del cliente Supabase
      this._supabaseClient = null;
      console.log('✅ Supabase client reset');
      
      console.warn('🔄 Please refresh the page and login again to complete the emergency clear');
      
    } catch (error) {
      console.error('❌ Emergency clear failed:', error);
    }
  }
} 