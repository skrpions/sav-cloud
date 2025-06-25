// Domain Entities - Core business objects

export interface AuthCredentialsEssentials {
  email: string;
  password: string;
}

export interface AuthResponseEssentials {
  data?: {
    user?: UserEssentials;
    session?: SessionEssentials;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface UserEssentials {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: boolean;
  metadata?: Record<string, any>;
}

export interface SessionEssentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
}

export interface SignUpRequestEssentials {
  email: string;
  password: string;
  options?: {
    data?: Record<string, any>;
    emailRedirectTo?: string;
  };
}

export interface SignInRequestEssentials {
  email: string;
  password: string;
  options?: {
    data?: Record<string, any>;
  };
}

export interface RefreshTokenRequestEssentials {
  refreshToken: string;
}

// Type definitions - Flexible variants for different contexts
export type AuthCredentials = AuthCredentialsEssentials;
export type AuthResponse = AuthResponseEssentials;
export type UserEntity = UserEssentials;
export type SessionEntity = SessionEssentials;
export type SignUpRequest = SignUpRequestEssentials;
export type SignInRequest = SignInRequestEssentials;
export type RefreshTokenRequest = RefreshTokenRequestEssentials; 