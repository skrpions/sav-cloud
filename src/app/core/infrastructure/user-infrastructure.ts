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
      // Get user from Supabase Auth
      const { data: { user: authUser }, error: authError } = await this._supabaseService.supabaseClient.auth.getUser();
      
      if (authError) {
        console.error('❌ UserInfrastructure: Auth error:', authError);
        throw authError;
      }
      
      if (!authUser) {
        return null;
      }

      // Ensure user exists in public.users table
      await this.ensureUserExistsInPublicTable(authUser);

      // Get user from public.users table with our custom fields
      const { data: userData, error: userError } = await this._supabaseService.supabaseClient
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('❌ UserInfrastructure: Error fetching user from public.users:', userError);
        // Fallback: create basic user object from auth data
        const fallbackUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          firstName: this.extractFirstName(authUser),
          lastName: this.extractLastName(authUser),
          role: 'farm_owner',
          isActive: true,
          createdAt: new Date(authUser.created_at),
          updatedAt: new Date()
        };
        
        this.saveUserToCache(fallbackUser);
        return fallbackUser;
      }

      // Map database user to our User interface
      const user: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role as 'admin' | 'farm_owner',
        isActive: userData.is_active,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at)
      };

      // Check if cached user is different from server data
      const cachedUser = this.getUserFromCache();
      if (cachedUser && this.isUserDataDifferent(cachedUser, user)) {
        this.clearUserCache();
      }

      // Cache the fresh user data
      this.saveUserToCache(user);
      
      return user;

    } catch (error: unknown) {
      console.error('❌ UserInfrastructure: Error in getCurrentUser:', error);
      
      // Clear potentially corrupted cache
      this.clearUserCache();
      
      return null;
    }
  }

  /**
   * Ensures the authenticated user exists in the public.users table
   */
  private async ensureUserExistsInPublicTable(authUser: any): Promise<void> {
    try {
      // First, check if user exists by ID (normal case)
      const { data: existingUserById, error: checkByIdError } = await this._supabaseService.supabaseClient
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!checkByIdError && existingUserById) {
        return;
      }

      // If not found by ID, check by email (for cases where user was created via SQL)
      const { data: existingUserByEmail, error: checkByEmailError } = await this._supabaseService.supabaseClient
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (!checkByEmailError && existingUserByEmail) {
        // Create new record with correct auth ID but preserve existing data
        const migrationData = {
          id: authUser.id, // Use the correct auth ID
          email: existingUserByEmail.email,
          first_name: existingUserByEmail.first_name,
          last_name: existingUserByEmail.last_name,
          role: existingUserByEmail.role,
          phone: existingUserByEmail.phone,
          is_active: existingUserByEmail.is_active,
          created_at: existingUserByEmail.created_at,
          updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await this._supabaseService.supabaseClient
          .from('users')
          .insert([migrationData]);

        if (insertError) {
          console.error('❌ UserInfrastructure: Error creating migrated user in public.users:', insertError);
          throw insertError;
        }

        // Delete the old record with incorrect ID
        const { error: deleteError } = await this._supabaseService.supabaseClient
          .from('users')
          .delete()
          .eq('email', authUser.email)
          .neq('id', authUser.id); // Delete only the old record, not the new one

        if (deleteError) {
          console.warn('⚠️ UserInfrastructure: Warning: Could not delete old user record, but migration completed:', deleteError);
        }

        return;
      }

      // If user doesn't exist by ID or email, create new user
      const firstName = authUser.user_metadata?.['first_name'] || this.extractFirstName(authUser);
      const lastName = authUser.user_metadata?.['last_name'] || this.extractLastName(authUser);

      const newUserData = {
        id: authUser.id,
        email: authUser.email,
        first_name: firstName,
        last_name: lastName,
        role: 'farm_owner',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await this._supabaseService.supabaseClient
        .from('users')
        .insert([newUserData]);

      if (insertError) {
        console.error('❌ UserInfrastructure: Error creating user in public.users:', insertError);
        throw insertError;
      }

    } catch (error) {
      console.error('❌ UserInfrastructure: Error in ensureUserExistsInPublicTable:', error);
      throw error;
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

    } catch {
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
    // Intentar extraer de user_metadata primero
    if (authUser.user_metadata?.first_name) {
      return authUser.user_metadata.first_name;
    }
    
    // Fallback: intentar parsear del full_name
    const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';
    return fullName.split(' ')[0] || 'Usuario';
  }

  private extractLastName(authUser: any): string {
    // Intentar extraer de user_metadata primero
    if (authUser.user_metadata?.last_name) {
      return authUser.user_metadata.last_name;
    }
    
    // Fallback: intentar parsear del full_name (tomar todo después del primer espacio)
    const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';
    const nameParts = fullName.split(' ');
    return nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Usuario';
  }

  private isValidUserData(data: any): boolean {
    return data && 
           typeof data === 'object' && 
           typeof data.id === 'string' && 
           typeof data.email === 'string' &&
           typeof data.firstName === 'string' &&
           typeof data.lastName === 'string' &&
           typeof data.role === 'string' &&
           typeof data.isActive === 'boolean';
  }

  /**
   * Checks if cached user data is different from server data
   */
  private isUserDataDifferent(cachedUser: User, serverUser: User): boolean {
    return (
      cachedUser.firstName !== serverUser.firstName ||
      cachedUser.lastName !== serverUser.lastName ||
      cachedUser.role !== serverUser.role ||
      cachedUser.email !== serverUser.email
    );
  }
} 