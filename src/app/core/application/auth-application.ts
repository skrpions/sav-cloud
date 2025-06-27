import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthInfrastructure } from '@/app/core/infrastructure/auth-infrastructure';
import { AuthRepository } from '@/app/core/domain/repositories/auth-repository';
import { 
  AuthResponse, 
  UserEntity, 
  SignUpRequest, 
  SignInRequest,
  RefreshTokenRequest 
} from '@/app/core/domain/entities/auth-entity';

@Injectable()
export class AuthApplication {
  constructor(
    @Inject(AuthInfrastructure)
    private readonly authRepository: AuthRepository
  ) {}

  signUp(request: SignUpRequest): Observable<AuthResponse> {
    return this.authRepository.signUp(request);
  }

  signIn(request: SignInRequest): Observable<AuthResponse> {
    return this.authRepository.signIn(request);
  }

  signOut(): Observable<AuthResponse> {
    return this.authRepository.signOut();
  }

  getCurrentUser(): Observable<UserEntity | null> {
    return this.authRepository.getCurrentUser();
  }

  refreshToken(request: RefreshTokenRequest): Observable<AuthResponse> {
    return this.authRepository.refreshToken(request);
  }

  resetPassword(email: string): Observable<AuthResponse> {
    return this.authRepository.resetPassword(email);
  }
} 