import { Injectable, inject } from '@angular/core';
import { UserRepository } from '../domain/repositories/user-repository';
import { User } from '../domain/entities/user-entity';
import { UserInfrastructure } from '../infrastructure/user-infrastructure';

@Injectable({
  providedIn: 'root'
})
export class UserApplication {
  private _userRepository: UserRepository = inject(UserInfrastructure);

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await this._userRepository.getCurrentUser();
      return user;
    } catch (error) {
      console.error('❌ Error in UserApplication.getCurrentUser:', error);
      return null;
    }
  }

  getFullName(user: User | null): string {
    if (!user) {
      return 'Usuario';
    }
    
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const fallbackName = user.email.split('@')[0] || 'Usuario';
    const result = fullName || fallbackName;
    
    return result;
  }

  getRoleDisplayName(user: User | null): string {
    if (!user) {
      return 'Usuario';
    }
    
    const roleNames: Record<string, string> = {
      'admin': 'Administrador',
      'farm_owner': 'Propietario de Finca',
      'farm_manager': 'Administrador de Finca', 
      'collaborator': 'Colaborador'
    };
    
    const result = roleNames[user.role] || 'Usuario';
    
    return result;
  }

  isUserCached(): boolean {
    const cached = this._userRepository.isUserCached();
    return cached;
  }

  getCachedUser(): User | null {
    const cachedUser = this._userRepository.getUserFromCache();
    return cachedUser;
  }

  async refreshUser(): Promise<User | null> {
    // Limpiar caché y recargar desde fuente
    this._userRepository.clearUserCache();
    return await this.getCurrentUser();
  }

  logout(): void {
    this._userRepository.clearUserCache();
  }

  isAdmin(user: User | null): boolean {
    const result = user?.role === 'admin';
    return result;
  }

  isFarmOwner(user: User | null): boolean {
    const result = user?.role === 'farm_owner' || user?.role === 'admin';
    return result;
  }

  isFarmManager(user: User | null): boolean {
    const result = user?.role === 'farm_manager' || user?.role === 'admin';
    return result;
  }

  isCollaborator(user: User | null): boolean {
    const result = user?.role === 'collaborator';
    return result;
  }
} 