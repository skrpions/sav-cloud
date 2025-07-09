export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'farm_owner' | 'farm_manager' | 'collaborator';

export interface UserMetadata {
  displayName: string;
  fullName: string;
  role: string;
}