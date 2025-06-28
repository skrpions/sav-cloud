import { Injectable, signal, inject } from '@angular/core';
import { UserApplication } from '@/app/core/application/user-application';
import { User } from '@/app/core/domain/entities/user-entity';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _userApplication = inject(UserApplication);
  
  // Signals para el estado del usuario
  userName = signal('Usuario');
  userRole = signal('Usuario');
  isLoading = signal(false);
  
  // Cache para evitar múltiples cargas
  private userDataLoaded = false;
  private currentUser: User | null = null;
  
  async loadCurrentUser(): Promise<void> {
    // Si ya se cargó y tenemos datos válidos, no cargar de nuevo
    if (this.userDataLoaded && this.currentUser) {
      return;
    }
    
    this.isLoading.set(true);
    
    try {
      // Primero intentar desde caché (más rápido)
      if (this._userApplication.isUserCached()) {
        const cachedUser = this._userApplication.getCachedUser();
        if (cachedUser) {
          this.updateUserSignals(cachedUser);
          this.userDataLoaded = true;
          this.isLoading.set(false);
          return;
        }
      }
      
      // Si no hay caché válido, cargar desde Supabase
      const user = await this._userApplication.getCurrentUser();
      
      if (user) {
        this.updateUserSignals(user);
        this.userDataLoaded = true;
      } else {
        this.setDefaultValues();
      }
      
    } catch (error) {
      console.error('Error loading user information:', error);
      
      // En caso de error, intentar mantener datos del caché si existen
      const cachedUser = this._userApplication.getCachedUser();
      if (cachedUser) {
        this.updateUserSignals(cachedUser);
        this.userDataLoaded = true;
      } else {
        this.setDefaultValues();
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateUserSignals(user: User): void {
    this.currentUser = user;
    this.userName.set(this._userApplication.getFullName(user));
    this.userRole.set(this._userApplication.getRoleDisplayName(user));
  }

  private setDefaultValues(): void {
    this.currentUser = null;
    this.userName.set('Usuario');
    this.userRole.set('Usuario');
  }
  
  // Método para forzar recarga si es necesario
  async forceReload(): Promise<void> {
    this.userDataLoaded = false;
    this.currentUser = null;
    await this.loadCurrentUser();
  }
  
  // Método para limpiar el caché (útil para logout)
  clearCache(): void {
    this.userDataLoaded = false;
    this.currentUser = null;
    this._userApplication.logout();
    this.setDefaultValues();
  }

  // Métodos de utilidad
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAdmin(): boolean {
    return this._userApplication.isAdmin(this.currentUser);
  }

  isCollaborator(): boolean {
    return this._userApplication.isCollaborator(this.currentUser);
  }

  // Método para limpiar manualmente datos problemáticos sin afectar el usuario
  static cleanupProblematicAuthData(): void {
    try {
      const problematicKeys = [
        'sb-wprmvvkrtizngssfcpii-auth-token',
        'sav-cloud-auth-token', 
        'supabase.auth.token',
        'supabase.session'
      ];

      // Limpiar localStorage
      Object.keys(localStorage).forEach(key => {
        if (problematicKeys.some(problematicKey => key.includes(problematicKey)) ||
            (key.startsWith('sb-') && key.includes('auth-token'))) {
          localStorage.removeItem(key);
        }
      });

      // Limpiar sessionStorage (pero preservar traducciones)
      Object.keys(sessionStorage).forEach(key => {
        if (problematicKeys.some(problematicKey => key.includes(problematicKey)) ||
            (key.startsWith('sb-') && key.includes('auth-token'))) {
          sessionStorage.removeItem(key);
        }
      });

    } catch (error) {
      console.warn('Error during manual auth cleanup:', error);
    }
  }
} 