import { Component, EventEmitter, Output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil, filter } from 'rxjs';

import { MaterialModule } from '@/app/shared/material.module';
import { SupabaseService } from '@/app/shared/services/supabase.service';
import { ROUTES } from '@/app/shared/constants/routes';

interface PageMetadata {
  titleKey: string;
  subtitleKey: string;
  breadcrumbKey: string;
  icon: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MaterialModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() searchChanged = new EventEmitter<string>();
  
  private _supabaseService = inject(SupabaseService);
  private _router = inject(Router);
  private _translateService = inject(TranslateService);
  private _destroy$ = new Subject<void>();

  isMobileSearchExpanded = false;
  currentPageMetadata: PageMetadata = {
    titleKey: 'header.analyticsDashboard',
    subtitleKey: 'header.description',
    breadcrumbKey: 'header.analytics',
    icon: 'home'
  };

  // Metadata para cada ruta
  private pageMetadataMap: Record<string, PageMetadata> = {
    [ROUTES.DASHBOARD]: {
      titleKey: 'header.analyticsDashboard',
      subtitleKey: 'header.description',
      breadcrumbKey: 'header.analytics',
      icon: 'home'
    },
    [ROUTES.COLLABORATORS]: {
      titleKey: 'collaborators.title',
      subtitleKey: 'collaborators.subtitle',
      breadcrumbKey: 'sidebar.navigation.collaborators',
      icon: 'people'
    },
    [ROUTES.ACTIVITIES]: {
      titleKey: 'sidebar.navigation.activities',
      subtitleKey: 'header.activities.description',
      breadcrumbKey: 'sidebar.navigation.activities',
      icon: 'assignment'
    },
    [ROUTES.HARVEST]: {
      titleKey: 'sidebar.navigation.harvest',
      subtitleKey: 'header.harvest.description',
      breadcrumbKey: 'sidebar.navigation.harvest',
      icon: 'agriculture'
    },
    [ROUTES.PURCHASES]: {
      titleKey: 'sidebar.navigation.purchases',
      subtitleKey: 'header.purchases.description',
      breadcrumbKey: 'sidebar.navigation.purchases',
      icon: 'shopping_cart'
    },
    [ROUTES.SALES]: {
      titleKey: 'sidebar.navigation.sales',
      subtitleKey: 'header.sales.description',
      breadcrumbKey: 'sidebar.navigation.sales',
      icon: 'point_of_sale'
    },
    [ROUTES.REPORTS]: {
      titleKey: 'sidebar.navigation.reports',
      subtitleKey: 'header.reports.description',
      breadcrumbKey: 'sidebar.navigation.reports',
      icon: 'assessment'
    },
    [ROUTES.SETTINGS]: {
      titleKey: 'sidebar.navigation.settings',
      subtitleKey: 'header.settings.description',
      breadcrumbKey: 'sidebar.navigation.settings',
      icon: 'settings'
    }
  };

  ngOnInit(): void {
    // Escuchar cambios de ruta
    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this._destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.updatePageMetadata(event.url);
      });

    // Configurar metadata inicial
    this.updatePageMetadata(this._router.url);
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private updatePageMetadata(url: string): void {
    // Obtener la ruta base (sin parámetros)
    const baseRoute = url.split('?')[0].split('#')[0];
    
    // Buscar metadata para la ruta actual
    const metadata = this.pageMetadataMap[baseRoute];
    
    if (metadata) {
      this.currentPageMetadata = metadata;
    } else {
      // Si no se encuentra metadata específica, usar dashboard como default
      this.currentPageMetadata = this.pageMetadataMap[ROUTES.DASHBOARD];
    }
  }

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