import { User } from '../entities/user-entity';

export abstract class UserRepository {
  abstract getCurrentUser(): Promise<User | null>;
  abstract getUserFromCache(): User | null;
  abstract saveUserToCache(user: User): void;
  abstract clearUserCache(): void;
  abstract isUserCached(): boolean;
} 