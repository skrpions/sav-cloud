import { Component, OnInit, inject } from '@angular/core';
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
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  private _router = inject(Router);

  ngOnInit(): void {
    console.log('Reports module initialized');
  }

  onSidebarItemClicked(item: SidebarItem): void {
    if (item.route) {
      this._router.navigate([item.route]);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSidebarCollapseChanged(_isCollapsed: boolean): void {
    // Handle sidebar collapse if needed
  }
} 