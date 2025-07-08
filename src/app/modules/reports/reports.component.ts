import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarComponent } from '@/app/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '@/app/shared/components/header/header.component';
import { SidebarItem } from '@/app/shared/models/ui.models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    SidebarComponent,
    HeaderComponent
  ],
  template: `
    <div class="reports-page">
      <!-- Sidebar -->
      <app-sidebar 
        (itemClicked)="onSidebarItemClicked($event)"
        (collapseChanged)="onSidebarCollapseChanged($event)">
      </app-sidebar>

      <!-- Main Content -->
      <div class="reports-content">
        <!-- Header -->
        <app-header></app-header>

        <!-- Page Content -->
        <div class="page-main">
          <div class="content-container">
            <div class="page-header">
              <h1 class="page-title">
                <mat-icon>assessment</mat-icon>
                Reportes
              </h1>
              <p class="page-description">
                Genera reportes e informes detallados del rendimiento de tu finca
              </p>
            </div>

            <div class="empty-state">
              <mat-icon class="empty-icon">bar_chart</mat-icon>
              <h2>Módulo de Reportes</h2>
              <p>Pronto estará disponible la funcionalidad de reportes detallados.</p>
              <button mat-raised-button color="primary" disabled>
                <mat-icon>file_download</mat-icon>
                Generar Reporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
      display: flex;
      height: 100vh;
      background-color: #f8f9fa;
    }

    .reports-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .page-main {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }

    .content-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid #e9ecef;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: var(--holiday-teal-dark);
    }

    .page-title mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--holiday-green-medium);
    }

    .page-description {
      margin: 0;
      color: var(--holiday-sage-green);
      font-size: 16px;
    }

    .empty-state {
      background: white;
      border-radius: 12px;
      padding: 48px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid #e9ecef;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--holiday-sage-green);
      margin-bottom: 16px;
    }

    .empty-state h2 {
      margin: 0 0 8px 0;
      color: var(--holiday-teal-dark);
      font-weight: 600;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      color: var(--holiday-sage-green);
    }
  `]
})
export class ReportsComponent implements OnInit {
  private _router = inject(Router);

  isSidebarCollapsed = signal(false);

  ngOnInit(): void {
    console.log('Reports module initialized');
  }

  onSidebarItemClicked(item: SidebarItem): void {
    if (item.route) {
      this._router.navigate([item.route]);
    }
  }

  onSidebarCollapseChanged(isCollapsed: boolean): void {
    this.isSidebarCollapsed.set(isCollapsed);
  }
} 