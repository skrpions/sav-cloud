import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarComponent } from '@/app/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '@/app/shared/components/header/header.component';
import { SidebarItem } from '@/app/shared/models/ui.models';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    SidebarComponent,
    HeaderComponent
  ],
  template: `
    <div class="purchases-page">
      <!-- Sidebar -->
      <app-sidebar 
        (itemClicked)="onSidebarItemClicked($event)"
        (collapseChanged)="onSidebarCollapseChanged($event)">
      </app-sidebar>

      <!-- Main Content -->
      <div class="main-content" [class.sidebar-collapsed]="isSidebarCollapsed()">
        <!-- Header -->
        <app-header></app-header>

        <!-- Content Area -->
        <div class="content-area">
          <div class="page-container">
            <mat-card>
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>shopping_cart</mat-icon>
                  Compras
                </mat-card-title>
                <mat-card-subtitle>
                  Gestión de compras y gastos
                </mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div class="coming-soon">
                  <mat-icon style="font-size: 64px; color: #ccc;">construction</mat-icon>
                  <h2>Módulo en desarrollo</h2>
                  <p>Este módulo estará disponible próximamente.</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .purchases-page {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s ease;
      margin-left: 240px;
    }

    .main-content.sidebar-collapsed {
      margin-left: 60px;
    }

    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .page-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .coming-soon {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .coming-soon h2 {
      margin: 20px 0 10px;
      color: #333;
    }
  `]
})
export class PurchasesComponent implements OnInit {
  private _router = inject(Router);

  isSidebarCollapsed = signal(false);

  ngOnInit(): void {
    console.log('Purchases module initialized');
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