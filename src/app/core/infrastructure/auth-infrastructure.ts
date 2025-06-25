import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, Observable, throwError, map } from 'rxjs';
import { 
  AuthResponse, 
  UserEntity, 
  SignUpRequest, 
  SignInRequest,
  RefreshTokenRequest 
} from '../domain/entities/auth-entity';
import { AuthRepository } from '../domain/repositories/auth-repository';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInfrastructure implements AuthRepository {
  private readonly _http = inject(HttpClient);
  
  private readonly API_BASE_URL = environment.supabaseUrl;
  private readonly API_KEY = environment.supabaseKey;

  signUp(request: SignUpRequest): Observable<AuthResponse> {
    const url = `${this.API_BASE_URL}/auth/v1/signup`;
    const headers = { 
      'apikey': this.API_KEY, 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`
    };
    const body = {
      email: request.email,
      password: request.password,
      data: request.options?.data || {}
    };

    return this._http.post<any>(url, body, { headers })
      .pipe(
        map(response => this.mapSupabaseResponse(response)),
        catchError(this.handleError.bind(this))
      );
  }

  signIn(request: SignInRequest): Observable<AuthResponse> {
    const url = `${this.API_BASE_URL}/auth/v1/token?grant_type=password`;
    const headers = { 
      'apikey': this.API_KEY, 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`
    };
    const body = {
      email: request.email,
      password: request.password
    };

    return this._http.post<any>(url, body, { headers })
      .pipe(
        map(response => this.mapSupabaseResponse(response)),
        catchError(this.handleError.bind(this))
      );
  }

  signOut(): Observable<AuthResponse> {
    const url = `${this.API_BASE_URL}/auth/v1/logout`;
    const headers = { 
      'apikey': this.API_KEY, 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`
    };

    return this._http.post<any>(url, {}, { headers })
      .pipe(
        map(response => this.mapSupabaseResponse(response)),
        catchError(this.handleError.bind(this))
      );
  }

  getCurrentUser(): Observable<UserEntity | null> {
    const url = `${this.API_BASE_URL}/auth/v1/user`;
    const headers = { 
      'apikey': this.API_KEY,
      'Authorization': `Bearer ${this.API_KEY}`
    };

    return this._http.get<any>(url, { headers })
      .pipe(
        map(response => this.mapSupabaseUser(response)),
        catchError(() => throwError(() => null))
      );
  }

  refreshToken(request: RefreshTokenRequest): Observable<AuthResponse> {
    const url = `${this.API_BASE_URL}/auth/v1/token?grant_type=refresh_token`;
    const headers = { 
      'apikey': this.API_KEY, 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`
    };
    const body = { 
      refresh_token: request.refreshToken 
    };

    return this._http.post<any>(url, body, { headers })
      .pipe(
        map(response => this.mapSupabaseResponse(response)),
        catchError(this.handleError.bind(this))
      );
  }

  resetPassword(email: string): Observable<AuthResponse> {
    const url = `${this.API_BASE_URL}/auth/v1/recover`;
    const headers = { 
      'apikey': this.API_KEY, 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`
    };
    const body = { email };

    return this._http.post<any>(url, body, { headers })
      .pipe(
        map(response => this.mapSupabaseResponse(response)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Mapea la respuesta de Supabase al formato de nuestra entidad AuthResponse
   */
  private mapSupabaseResponse(response: any): AuthResponse {
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
    if (response.user) {
      result.data!.user = this.mapSupabaseUser(response.user);
    }

    // Mapear sesión si existe
    if (response.session || response.access_token) {
      result.data!.session = {
        accessToken: response.access_token || response.session?.access_token || '',
        refreshToken: response.refresh_token || response.session?.refresh_token || '',
        expiresAt: new Date(Date.now() + (response.expires_in || 3600) * 1000),
        tokenType: response.token_type || 'bearer'
      };
    }

    return result;
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

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return throwError(() => ({
        message: 'Network error: ' + error.error.message,
        code: 'NETWORK_ERROR'
      }));
    } else {
      // Server-side error
      let errorMessage = 'Unknown error occurred';
      let errorCode = 'UNKNOWN_ERROR';

      // Manejar errores específicos de Supabase
      if (error.error) {
        if (error.error.error_description) {
          errorMessage = error.error.error_description;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        }
        
        if (error.error.error) {
          errorCode = error.error.error;
        }
      }

      // Manejar códigos de estado HTTP específicos
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid request data';
          errorCode = 'INVALID_REQUEST';
          break;
        case 401:
          errorMessage = 'Invalid email or password';
          errorCode = 'INVALID_CREDENTIALS';
          break;
        case 403:
          errorMessage = 'Access denied';
          errorCode = 'ACCESS_DENIED';
          break;
        case 422:
          errorMessage = error.error?.message || 'Validation failed';
          errorCode = 'VALIDATION_ERROR';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          errorCode = 'RATE_LIMIT_EXCEEDED';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          errorCode = 'SERVER_ERROR';
          break;
      }

      return throwError(() => ({
        message: errorMessage,
        code: errorCode
      }));
    }
  }
} 