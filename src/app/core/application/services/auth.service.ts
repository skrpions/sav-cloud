import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AuthApplication } from '../auth-application';
import { AuthCredentials, AuthResponse, UserEntity } from '@/app/core/domain/entities/auth-entity';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _authAppSrv = inject(AuthApplication);
  private _router = inject(Router);

  constructor() {
    // Escuchar eventos de sesión expirada
    this.sessionExpired$.subscribe(() => {
      this.handleSessionExpired();
    });
  }

  // Observable para eventos de sesión expirada
  get sessionExpired$(): Observable<Date> {
    return fromEvent<CustomEvent>(window, 'sessionExpired').pipe(
      filter(event => event.detail && event.detail.timestamp),
      map(event => new Date(event.detail.timestamp))
    );
  }

  async signUp(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const response = await this._authAppSrv.signUp(credentials).toPromise();
      return response || { error: { message: 'Unknown error occurred' } };
    } catch (error) {
      console.error('SignUp error:', error);
      return {
        error: {
          message: error instanceof Error ? error.message : 'Error during sign up'
        }
      };
    }
  }

  async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const response = await this._authAppSrv.signIn(credentials).toPromise();
      return response || { error: { message: 'Unknown error occurred' } };
    } catch (error) {
      console.error('SignIn error:', error);
      return {
        error: {
          message: error instanceof Error ? error.message : 'Error during sign in'
        }
      };
    }
  }

  async signOut(): Promise<AuthResponse> {
    try {
      const response = await this._authAppSrv.signOut().toPromise();
      this._router.navigate(['/auth/login']);
      return response || { error: { message: 'Unknown error occurred' } };
    } catch (error) {
      console.error('SignOut error:', error);
      return {
        error: {
          message: error instanceof Error ? error.message : 'Error during sign out'
        }
      };
    }
  }

  async getCurrentUser(): Promise<UserEntity | null> {
    try {
      const user = await this._authAppSrv.getCurrentUser().toPromise();
      return user || null;
    } catch (error) {
      console.error('GetCurrentUser error:', error);
      return null;
    }
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      const response = await this._authAppSrv.refreshToken({ refreshToken: token }).toPromise();
      return response || { error: { message: 'Unknown error occurred' } };
    } catch (error) {
      console.error('RefreshToken error:', error);
      return {
        error: {
          message: error instanceof Error ? error.message : 'Error refreshing token'
        }
      };
    }
  }

  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await this._authAppSrv.resetPassword(email).toPromise();
      return response || { error: { message: 'Unknown error occurred' } };
    } catch (error) {
      console.error('ResetPassword error:', error);
      return {
        error: {
          message: error instanceof Error ? error.message : 'Error resetting password'
        }
      };
    }
  }

  // Nuevo método para renovar sesión con contraseña
  async renewSessionWithPassword(password: string): Promise<AuthResponse> {
    try {
      const user = await this.getCurrentUser();
      if (!user?.email) {
        throw new Error('No se pudo obtener el email del usuario');
      }

      const response = await this.signIn({ 
        email: user.email, 
        password 
      });
      
      if (!response.error) {
        // Redireccionar a donde estaba antes
        const returnUrl = sessionStorage.getItem('preSessionExpiredUrl') || '/dashboard';
        sessionStorage.removeItem('preSessionExpiredUrl');
        this._router.navigateByUrl(returnUrl);
      }
      
      return response;
    } catch (error) {
      console.error('RenewSession error:', error);
      return {
        error: {
          message: error instanceof Error ? error.message : 'Error renovando sesión'
        }
      };
    }
  }

  // Método para verificar si la sesión es válida
  async isSessionValid(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch {
      return false;
    }
  }

  // Manejar sesión expirada
  private handleSessionExpired(): void {
    // Guardar la URL actual para redireccionar después
    const currentUrl = this._router.url;
    if (currentUrl && !currentUrl.includes('/auth/')) {
      sessionStorage.setItem('preSessionExpiredUrl', currentUrl);
    }

    // Intentar obtener el email del usuario para la pantalla de lock
    this.getCurrentUser().then(user => {
      const queryParams: Record<string, string> = { sessionExpired: 'true' };
      
      if (user?.email) {
        queryParams['email'] = user.email;
        queryParams['returnUrl'] = currentUrl || '/dashboard';
        
        // Redireccionar al componente Lock
        this._router.navigate(['/auth/lock'], { queryParams });
      } else {
        // Si no hay usuario, ir al login normal
        this._router.navigate(['/auth/login'], { 
          queryParams: { sessionExpired: 'true' } 
        });
      }
    }).catch(() => {
      // Error al obtener usuario, ir al login normal
      this._router.navigate(['/auth/login'], { 
        queryParams: { sessionExpired: 'true' } 
      });
    });
  }
} 