import { Injectable, inject } from '@angular/core';
import { UserRepository } from '../domain/repositories/user-repository';
import { User, UserRole } from '../domain/entities/user-entity';
import { SupabaseService } from '@/app/shared/services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class UserInfrastructure extends UserRepository {
  private readonly STORAGE_KEY = 'sav-cloud-user';
  private _supabaseService = inject(SupabaseService);

  async getCurrentUser(): Promise<User | null> {
    try {
      // Primero verificar si tenemos datos en caché
      const cachedUser = this.getUserFromCache();
      if (cachedUser) {
        return cachedUser;
      }

      // Si no hay caché, obtener de Supabase
      const { data: { user: authUser } } = await this._supabaseService.supabaseClient.auth.getUser();
      
      if (!authUser) {
        return null;
      }

      // Consultar la tabla public.users para obtener el perfil completo
      const { data: userData, error } = await this._supabaseService.supabaseClient
        .from('users')
        .select('id, email, first_name, last_name, role, is_active, created_at, updated_at')
        .eq('id', authUser.id)
        .single();

      if (error || !userData) {
        // Fallback: crear usuario básico desde auth
        const fallbackUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          firstName: this.extractFirstName(authUser),
          lastName: this.extractLastName(authUser),
          role: 'collaborator' as UserRole,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        this.saveUserToCache(fallbackUser);
        return fallbackUser;
      }

      // Mapear datos de la BD a nuestra entidad
      const user: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role as UserRole,
        isActive: userData.is_active,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at)
      };

      this.saveUserToCache(user);
      return user;

    } catch (error) {
      console.error('Error loading current user:', error);
      return null;
    }
  }

  getUserFromCache(): User | null {
    try {
      const cached = sessionStorage.getItem(this.STORAGE_KEY);
      if (!cached) {
        return null;
      }

      const userData = JSON.parse(cached);
      
      // Validar que los datos tienen la estructura correcta
      if (!this.isValidUserData(userData)) {
        this.clearUserCache();
        return null;
      }

      // Convertir fechas string a Date objects
      const user = {
        ...userData,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.updatedAt)
      };
      
      return user;

    } catch (error) {
      this.clearUserCache();
      return null;
    }
  }

  saveUserToCache(user: User): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.warn('Error saving user to cache:', error);
    }
  }

  clearUserCache(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Error clearing user cache:', error);
    }
  }

  isUserCached(): boolean {
    return sessionStorage.getItem(this.STORAGE_KEY) !== null;
  }

  private extractFirstName(authUser: any): string {
    const metadata = authUser.user_metadata;
    return metadata?.['first_name'] || 
      metadata?.['name']?.split(' ')[0] || 
      metadata?.['full_name']?.split(' ')[0] || 
      authUser.email?.split('@')[0]?.charAt(0).toUpperCase() + authUser.email?.split('@')[0]?.slice(1) ||
      'Usuario';
  }

  private extractLastName(authUser: any): string {
    const metadata = authUser.user_metadata;
    const fullName = metadata?.['full_name'] || metadata?.['name'];
    
    if (fullName && fullName.includes(' ')) {
      return fullName.split(' ').slice(1).join(' ');
    }
    
    return metadata?.['last_name'] || '';
  }

  private isValidUserData(data: any): boolean {
    return data && 
      typeof data.id === 'string' &&
      typeof data.email === 'string' &&
      typeof data.firstName === 'string' &&
      typeof data.lastName === 'string' &&
      typeof data.role === 'string' &&
      typeof data.isActive === 'boolean';
  }
} 