import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthApplication } from '@core/application/auth-application';
import {
  AuthCredentials,
  AuthResponse,
  UserEntity
} from '@core/domain/entities/auth-entity';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // * Injection following user convention
  private _authAppSrv = inject(AuthApplication);

  /**
   * Use case: Register a new user
   * @param credentials - User email and password
   * @returns Promise with auth response
   */
  async signUp(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const request = {
        email: credentials.email,
        password: credentials.password,
        options: undefined
      };
      return await firstValueFrom(this._authAppSrv.signUp(request));
    } catch (error: any) {
      console.error('AuthService - SignUp error:', error);
      // El error ya viene formateado del infrastructure
      throw error;
    }
  }

  /**
   * Use case: Sign in existing user
   * @param credentials - User email and password
   * @returns Promise with auth response
   */
  async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const request = {
        email: credentials.email,
        password: credentials.password,
        options: undefined
      };
      return await firstValueFrom(this._authAppSrv.signIn(request));
    } catch (error: any) {
      console.error('AuthService - SignIn error:', error);
      // El error ya viene formateado del infrastructure
      throw error;
    }
  }

  /**
   * Use case: Sign out current user
   * @returns Promise with auth response
   */
  async signOut(): Promise<AuthResponse> {
    try {
      return await firstValueFrom(this._authAppSrv.signOut());
    } catch (error: any) {
      console.error('AuthService - SignOut error:', error);
      // El error ya viene formateado del infrastructure
      throw error;
    }
  }

  /**
   * Use case: Get current authenticated user
   * @returns Promise with current user or null
   */
  async getCurrentUser(): Promise<UserEntity | null> {
    try {
      return await firstValueFrom(this._authAppSrv.getCurrentUser());
    } catch (error: any) {
      console.error('AuthService - GetCurrentUser error:', error);
      return null;
    }
  }

  /**
   * Use case: Refresh authentication token
   * @param token - Current refresh token
   * @returns Promise with auth response
   */
  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      const request = { refreshToken: token };
      return await firstValueFrom(this._authAppSrv.refreshToken(request));
    } catch (error: any) {
      console.error('AuthService - RefreshToken error:', error);
      // El error ya viene formateado del infrastructure
      throw error;
    }
  }

  /**
   * Use case: Reset user password
   * @param email - User email
   * @returns Promise with auth response
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      return await firstValueFrom(this._authAppSrv.resetPassword(email));
    } catch (error: any) {
      console.error('AuthService - ResetPassword error:', error);
      // El error ya viene formateado del infrastructure
      throw error;
    }
  }
} 