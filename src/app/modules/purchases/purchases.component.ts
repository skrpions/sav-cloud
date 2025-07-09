import { Component, OnInit, inject } from '@angular/core';
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
  templateUrl: './purchases.component.html',
  styleUrls: ['./purchases.component.scss']
})
export class PurchasesComponent implements OnInit {
  private _router = inject(Router);

  ngOnInit(): void {
    console.log('Purchases module initialized');
  }

  onSidebarItemClicked(item: SidebarItem): void {
    if (item.route) {
      this._router.navigate([item.route]);
    }
  }

  onSidebarCollapseChanged(_isCollapsed: boolean): void {
    // Handle sidebar collapse if needed
  }
} 