import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { SupabaseService } from '../../services/supabase.service';
import { ROUTES } from '../../constants/routes';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() searchChanged = new EventEmitter<string>();
  
  private _supabaseService = inject(SupabaseService);
  private _router = inject(Router);

  isMobileSearchExpanded = false;

  async logout(): Promise<void> {
    try {
      console.log('Logging out...');
      
      const { error } = await this._supabaseService.supabaseClient.auth.signOut();

      if (error) {
        throw error;
      }

      // Show success toast
      toast.success('Logged out successfully', {
        description: 'You have been signed out of your account.',
        duration: 2000
      });

      // Redirect to login after short delay
      setTimeout(() => {
        this._router.navigate([ROUTES.AUTH.LOGIN]);
      }, 1000);

    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Show error toast
      toast.error('Logout failed', {
        description: error.message || 'An error occurred during logout.',
        duration: 3000
      });
    }
  }

  onSearchChange(value: string): void {
    this.searchChanged.emit(value);
  }

  toggleMobileSearch(): void {
    this.isMobileSearchExpanded = !this.isMobileSearchExpanded;
  }
} 