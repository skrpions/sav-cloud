import { Observable } from "rxjs";
import { 
  AuthCredentials, 
  AuthResponse, 
  UserEntity, 
  SignUpRequest, 
  SignInRequest,
  RefreshTokenRequest 
} from "../entities/auth-entity";

// Port interface - Contract for authentication operations
export interface AuthRepository {
  signUp(request: SignUpRequest): Observable<AuthResponse>;
  signIn(request: SignInRequest): Observable<AuthResponse>;
  signOut(): Observable<AuthResponse>;
  getCurrentUser(): Observable<UserEntity | null>;
  refreshToken(request: RefreshTokenRequest): Observable<AuthResponse>;
  resetPassword(email: string): Observable<AuthResponse>;
} 