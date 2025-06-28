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
 * 5. Limpieza agresiva: Elimina tokens problemáticos al inicializar
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
    // Solo limpiar el estado, NO inicializar Supabase inmediatamente
    this.aggressiveClearAuthState();
    console.log('SupabaseService initialized - client will be created on first use');
    
    // Hacer el método de emergencia accesible globalmente
    (window as any).emergencyClearAuth = () => this.emergencyClearAll();
    console.log('💡 Emergency clear available: call emergencyClearAuth() in console if needed');
  }

  // Limpieza agresiva de todo el estado de autenticación
  private aggressiveClearAuthState(): void {
    try {
      // Limpiar localStorage completo de Supabase
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.includes('supabase') || 
            key.includes('sb-') || 
            key.includes('auth') ||
            key.includes('sav-cloud')) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpiar sessionStorage completo de Supabase
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach(key => {
        if (key.includes('supabase') || 
            key.includes('sb-') || 
            key.includes('auth') ||
            key.includes('sav-cloud')) {
          sessionStorage.removeItem(key);
        }
      });

      // Limpiar también cookies relacionadas
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });

      console.log('Aggressive auth state cleanup completed');
    } catch (error) {
      console.warn('Could not perform aggressive auth cleanup:', error);
    }
  }

  // Crear el cliente Supabase solo cuando se necesite (lazy initialization)
  private createSupabaseClient(): SupabaseClient {
    if (!this._supabaseClient) {
      console.log('Creating Supabase client with lock-free configuration');
      
      // Limpieza adicional antes de crear el cliente
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
            storage: undefined, // Sin storage para evitar locks completamente
            debug: false
          },
          global: {
            headers: {
              'X-Supabase-Client': 'sav-cloud-no-lock'
            }
          }
        }
      );
      
      console.log('Supabase client created successfully without locks');
    }
    return this._supabaseClient;
  }

  get supabaseClient(): SupabaseClient {
    return this.createSupabaseClient();
  }

  // Limpiar almacenamiento de autenticación para evitar conflictos (mantenido para compatibilidad)
  private clearAuthStorage(): void {
    this.aggressiveClearAuthState();
  }

  // Método auxiliar para manejar errores de lock con mejor retry logic
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
          console.warn(`Lock timeout detected (attempt ${attempt}/${maxRetries}), retrying...`);
          
          // Limpiar storage en el segundo intento
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
      // Forzar limpieza de storage aunque signOut falle
      this.clearAuthStorage();
    }
  }

  // Método de emergencia para limpiar completamente el navegador
  emergencyClearAll(): void {
    console.warn('🚨 EMERGENCY CLEAR: Clearing all browser storage');
    
    try {
      // Limpiar localStorage completo
      localStorage.clear();
      console.log('✅ localStorage cleared');
      
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
      
      console.warn('🔄 Please refresh the page to complete the emergency clear');
      
    } catch (error) {
      console.error('❌ Emergency clear failed:', error);
    }
  }
} 