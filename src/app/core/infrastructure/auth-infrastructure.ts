import { Injectable, inject } from '@angular/core';
import { catchError, Observable, throwError, from, map } from 'rxjs';

import { 
  AuthResponse, 
  UserEntity, 
  SignUpRequest, 
  SignInRequest,
  RefreshTokenRequest 
} from '@core/domain/entities/auth-entity';
import { AuthRepository } from '@core/domain/repositories/auth-repository';
import { SupabaseService } from '@shared/services/supabase.service';

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
      map(response => this.mapSupabaseResponse(response)),
      catchError(this.handleError.bind(this))
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
      this._supabaseService.supabaseClient.auth.signOut()
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

  private handleError(error: any): Observable<never> {
    console.error('AuthInfrastructure Error:', error);

    let errorMessage = 'Unknown error occurred';
    let errorCode = 'UNKNOWN_ERROR';

    if (error?.message) {
      errorMessage = error.message;
    }

    if (error?.code) {
      errorCode = error.code;
    }

    // Manejar errores específicos de Supabase
    switch (error?.message) {
      case 'Invalid login credentials':
        errorMessage = 'Invalid email or password';
        errorCode = 'INVALID_CREDENTIALS';
        break;
      case 'Email rate limit exceeded':
        errorMessage = 'Too many attempts. Please try again later.';
        errorCode = 'RATE_LIMIT_EXCEEDED';
        break;
      case 'signup_disabled':
        errorMessage = 'Sign up is currently disabled';
        errorCode = 'SIGNUP_DISABLED';
        break;
    }

    return throwError(() => ({
      message: errorMessage,
      code: errorCode
    }));
  }
} 