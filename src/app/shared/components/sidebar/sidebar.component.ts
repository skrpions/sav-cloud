import { Component, EventEmitter, Output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarItem } from '@/app/shared/models/ui.models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MaterialModule, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Output() itemClicked = new EventEmitter<SidebarItem>();
  @Output() collapseChanged = new EventEmitter<boolean>();

  private _router = inject(Router);
  isCollapsed = signal(false);

  sidebarItems: SidebarItem[] = [
    { icon: 'dashboard', labelKey: 'sidebar.navigation.dashboard', route: '/dashboard', active: true },
    { icon: 'assignment', labelKey: 'sidebar.navigation.activities', route: '/activities' },
    { icon: 'people', labelKey: 'sidebar.navigation.collaborators', route: '/collaborators' },
    { icon: 'agriculture', labelKey: 'sidebar.navigation.harvest', route: '/harvest' },
    { icon: 'shopping_cart', labelKey: 'sidebar.navigation.purchases', route: '/purchases' },
    { icon: 'trending_up', labelKey: 'sidebar.navigation.sales', route: '/sales' },
    { icon: 'assessment', labelKey: 'sidebar.navigation.reports', route: '/reports' },
    { icon: 'settings', labelKey: 'sidebar.navigation.settings', route: '/settings' }
  ];

  ngOnInit(): void {
    // Set active item based on current route
    this.updateActiveItemFromRoute();

    // Listen to route changes to update active item
    this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveItemFromRoute();
      });
  }

  private updateActiveItemFromRoute(): void {
    const currentUrl = this._router.url;
    this.sidebarItems.forEach(item => {
      item.active = item.route === currentUrl;
    });
  }

  toggleCollapse(): void {
    this.isCollapsed.update(collapsed => !collapsed);
    this.collapseChanged.emit(this.isCollapsed());
  }

  onItemClick(item: SidebarItem): void {
    // Update active state
    this.sidebarItems.forEach(sidebarItem => sidebarItem.active = false);
    item.active = true;
    
    // Navigate to route if available
    if (item.route) {
      this._router.navigate([item.route]);
    }
    
    this.itemClicked.emit(item);
  }
} 