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
    // Si ya se cargó, no cargar de nuevo
    if (this.userDataLoaded && this.currentUser) {
      return;
    }
    
    // Primero verificar si hay datos en caché
    if (this._userApplication.isUserCached()) {
      const cachedUser = this._userApplication.getCachedUser();
      if (cachedUser) {
        this.updateUserSignals(cachedUser);
        this.userDataLoaded = true;
        console.log('✅ User loaded from sessionStorage cache');
        return;
      }
    }
    
    this.isLoading.set(true);
    
    try {
      const user = await this._userApplication.getCurrentUser();
      
      if (user) {
        this.updateUserSignals(user);
        this.userDataLoaded = true;
        console.log('✅ User loaded from Supabase');
      } else {
        console.warn('No user found');
        this.setDefaultValues();
      }
      
    } catch (error) {
      console.warn('Could not load user information:', error);
      this.setDefaultValues();
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
} 