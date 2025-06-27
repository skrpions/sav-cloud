import { Component, EventEmitter, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MaterialModule } from '@shared/material.module';
import { SidebarItem } from '@shared/models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MaterialModule, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Output() itemClicked = new EventEmitter<SidebarItem>();
  @Output() collapseChanged = new EventEmitter<boolean>();

  isCollapsed = signal(false);

  sidebarItems: SidebarItem[] = [
    { icon: 'dashboard', labelKey: 'sidebar.navigation.dashboard', active: true },
    { icon: 'assignment', labelKey: 'sidebar.navigation.activities' },
    { icon: 'people', labelKey: 'sidebar.navigation.collaborators' },
    { icon: 'agriculture', labelKey: 'sidebar.navigation.harvest' },
    { icon: 'shopping_cart', labelKey: 'sidebar.navigation.purchases' },
    { icon: 'trending_up', labelKey: 'sidebar.navigation.sales' },
    { icon: 'assessment', labelKey: 'sidebar.navigation.reports' },
    { icon: 'settings', labelKey: 'sidebar.navigation.settings' }
  ];

  toggleCollapse(): void {
    this.isCollapsed.update(collapsed => !collapsed);
    this.collapseChanged.emit(this.isCollapsed());
  }

  onItemClick(item: SidebarItem): void {
    // Update active state
    this.sidebarItems.forEach(sidebarItem => sidebarItem.active = false);
    item.active = true;
    
    this.itemClicked.emit(item);
  }
} 