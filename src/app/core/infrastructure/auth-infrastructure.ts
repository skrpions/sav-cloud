import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

import { 
  AuthResponse, 
  UserEntity, 
  SignUpRequest, 
  SignInRequest,
  RefreshTokenRequest 
} from '@/app/core/domain/entities/auth-entity';
import { AuthRepository } from '@/app/core/domain/repositories/auth-repository';
import { SupabaseService } from '@/app/shared/services/supabase.service';

@Injectable()
export class AuthInfrastructure implements AuthRepository {
  private readonly _supabaseService = inject(SupabaseService);

  signUp(request: SignUpRequest): Observable<AuthResponse> {
    return from(
      this._supabaseService.supabaseClient.auth.signUp({
        email: request.email,
        password: request.password,
        options: request.options
      })
    ).pipe(
      switchMap(response => {
        const mappedResponse = this.mapSupabaseResponse(response);
        
        // Si el registro fue exitoso y tenemos un usuario, crear entrada en public.users
        if (!mappedResponse.error && mappedResponse.data?.user) {
          const user = mappedResponse.data.user;
          
          // Extraer nombre y apellido del email o metadata
          const emailName = user.email?.split('@')[0] || 'Usuario';
          const firstName = user.metadata?.['first_name'] || emailName;
          const lastName = user.metadata?.['last_name'] || 'Sin Apellido';
          
          // Crear usuario en la tabla public.users
          return from(
            this._supabaseService.supabaseClient
              .from('users')
              .insert([{
                id: user.id, // Usar el mismo ID de auth.users
                email: user.email,
                first_name: firstName,
                last_name: lastName,
                role: 'farm_owner', // Rol por defecto
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }])
              .select()
          ).pipe(
            map(insertResponse => {
              // Si hubo error creando en public.users, logearlo pero no fallar el registro
              if (insertResponse.error) {
                console.warn('Warning: Error creating user in public.users:', insertResponse.error);
              } else {
                console.log('✅ User created in public.users successfully');
              }
              
              // Retornar el response original del registro
              return mappedResponse;
            }),
            catchError(error => {
              console.warn('Warning: Failed to create user in public.users:', error);
              // No fallar el registro completo, solo advertir
              return of(mappedResponse);
            })
          );
        }
        
        return of(mappedResponse);
      }),
      catchError(error => this.handleError(error))
    );
  }

  signIn(request: SignInRequest): Observable<AuthResponse> {
    return from(
      this._supabaseService.supabaseClient.auth.signInWithPassword({
        email: request.email,
        password: request.password
      })
    ).pipe(
      map(response => this.mapSupabaseResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  signOut(): Observable<AuthResponse> {
    return from(
      this._supabaseService.supabaseClient.auth.signOut(),
    ).pipe(
      map(response => this.mapSupabaseSignOutResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  getCurrentUser(): Observable<UserEntity | null> {
    return from(
      this._supabaseService.supabaseClient.auth.getUser()
    ).pipe(
      map(response => {
        if (response.error || !response.data?.user) {
          return null;
        }
        return this.mapSupabaseUser(response.data.user);
      }),
      catchError(() => throwError(() => null))
    );
  }

  refreshToken(request: RefreshTokenRequest): Observable<AuthResponse> {
    return from(
      this._supabaseService.supabaseClient.auth.refreshSession({
        refresh_token: request.refreshToken
      })
    ).pipe(
      map(response => this.mapSupabaseResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  resetPassword(email: string): Observable<AuthResponse> {
    return from(
      this._supabaseService.supabaseClient.auth.resetPasswordForEmail(email)
    ).pipe(
      map(response => this.mapSupabaseResetResponse(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Mapea la respuesta de Supabase al formato de nuestra entidad AuthResponse
   */
  private mapSupabaseResponse(response: any): AuthResponse {
    console.log('Supabase response:', response);
    
    if (response.error) {
      return {
        data: undefined,
        error: {
          message: response.error.message || 'Unknown error',
          code: response.error.code
        }
      };
    }

    const result: AuthResponse = {
      data: {},
      error: undefined
    };

    // Mapear usuario si existe
    if (response.data?.user) {
      result.data!.user = this.mapSupabaseUser(response.data.user);
    }

    // Mapear sesión si existe
    if (response.data?.session) {
      result.data!.session = {
        accessToken: response.data.session.access_token || '',
        refreshToken: response.data.session.refresh_token || '',
        expiresAt: new Date(response.data.session.expires_at * 1000),
        tokenType: response.data.session.token_type || 'bearer'
      };
    }

    return result;
  }

  /**
   * Mapea la respuesta de signOut de Supabase
   */
  private mapSupabaseSignOutResponse(response: any): AuthResponse {
    if (response.error) {
      return {
        data: undefined,
        error: {
          message: response.error.message || 'Sign out failed',
          code: response.error.code
        }
      };
    }

    return {
      data: {},
      error: undefined
    };
  }

  /**
   * Mapea la respuesta de resetPassword de Supabase
   */
  private mapSupabaseResetResponse(response: any): AuthResponse {
    if (response.error) {
      return {
        data: undefined,
        error: {
          message: response.error.message || 'Reset password failed',
          code: response.error.code
        }
      };
    }

    return {
      data: {},
      error: undefined
    };
  }

  /**
   * Mapea el usuario de Supabase al formato de nuestra entidad UserEntity
   */
  private mapSupabaseUser(user: any): UserEntity {
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at || user.created_at),
      emailVerified: user.email_confirmed_at ? true : false,
      metadata: user.user_metadata || {}
    };
  }

  private handleError(error: unknown): Observable<never> {
    console.error('AuthInfrastructure error:', error);
    
    // Verificar si es un error de sesión expirada
    if (this.isSessionExpiredError(error)) {
      // Emitir evento de sesión expirada
      this.handleSessionExpired();
    }

    return throwError(() => ({
      message: (error as { message?: string })?.message || 'Error de autenticación',
      code: (error as { status?: string })?.status || 'AUTH_ERROR',
      original: error
    }));
  }

  private isSessionExpiredError(error: unknown): boolean {
    const errorObj = error as { status?: number; message?: string };
    return !!(errorObj?.status === 401 || 
           errorObj?.message?.includes('jwt expired') ||
           errorObj?.message?.includes('invalid token') ||
           errorObj?.message?.includes('session expired') ||
           errorObj?.message?.includes('not authenticated'));
  }

  private handleSessionExpired(): void {
    // Limpiar la sesión local
    this._supabaseService.clearSession();
    
    // Emitir evento personalizado para notificar a la aplicación
    window.dispatchEvent(new CustomEvent('sessionExpired', {
      detail: { timestamp: new Date().toISOString() }
    }));
  }

  // Método para verificar si la sesión actual es válida
  isSessionValid(): Observable<boolean> {
    return from(this._supabaseService.supabaseClient.auth.getSession()).pipe(
      map(({ data: { session }, error }) => {
        if (error || !session) return false;
        
        // Verificar si el token está cerca de expirar (dentro de 5 minutos)
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const fiveMinutes = 5 * 60;
        
        return expiresAt ? (expiresAt - now) > fiveMinutes : false;
      }),
      catchError(() => of(false))
    );
  }

  // Método para renovar la sesión con contraseña
  renewSessionWithPassword(password: string): Observable<AuthResponse> {
    return from(this._supabaseService.supabaseClient.auth.getUser()).pipe(
      switchMap(({ data: { user } }) => {
        if (!user?.email) {
          throw new Error('No se pudo obtener el email del usuario');
        }
        
        return this.signIn({ email: user.email, password });
      }),
      catchError(error => this.handleError(error))
    );
  }
} 