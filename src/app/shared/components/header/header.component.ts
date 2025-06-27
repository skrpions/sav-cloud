import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { SupabaseService } from '../../services/supabase.service';
import { ROUTES } from '../../constants/routes';
import { toast } from 'ngx-sonner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MaterialModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() searchChanged = new EventEmitter<string>();
  
  private _supabaseService = inject(SupabaseService);
  private _router = inject(Router);
  private _translateService = inject(TranslateService);

  isMobileSearchExpanded = false;

  async logout(): Promise<void> {
    try {
      console.log('Logging out...');
      
      const { error } = await this._supabaseService.supabaseClient.auth.signOut();

      if (error) {
        throw error;
      }

      // Show success toast
      toast.success(this._translateService.instant('toasts.logout.success.title'), {
        description: this._translateService.instant('toasts.logout.success.description'),
        duration: 2000
      });

      // Redirect to login after short delay
      setTimeout(() => {
        this._router.navigate([ROUTES.AUTH.LOGIN]);
      }, 1000);

    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Show error toast
      toast.error(this._translateService.instant('toasts.logout.error.title'), {
        description: error.message || this._translateService.instant('toasts.logout.error.description'),
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