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
      return await this._userRepository.getCurrentUser();
    } catch (error) {
      console.error('Error in UserApplication.getCurrentUser:', error);
      return null;
    }
  }

  getFullName(user: User | null): string {
    if (!user) {
      return 'Usuario';
    }
    
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    return fullName || user.email.split('@')[0] || 'Usuario';
  }

  getRoleDisplayName(user: User | null): string {
    if (!user) {
      return 'Usuario';
    }
    
    switch (user.role) {
      case 'admin':
        return 'Administrador';
      case 'collaborator':
        return 'Colaborador';
      default:
        return 'Usuario';
    }
  }

  isUserCached(): boolean {
    return this._userRepository.isUserCached();
  }

  getCachedUser(): User | null {
    return this._userRepository.getUserFromCache();
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
    return user?.role === 'admin';
  }

  isCollaborator(user: User | null): boolean {
    return user?.role === 'collaborator';
  }
} 