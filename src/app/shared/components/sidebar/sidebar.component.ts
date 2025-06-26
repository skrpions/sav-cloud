import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';

export interface SidebarItem {
  icon: string;
  label: string;
  route?: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Output() itemClicked = new EventEmitter<SidebarItem>();
  @Output() collapseChanged = new EventEmitter<boolean>();

  isCollapsed = signal(false);

  sidebarItems: SidebarItem[] = [
    { icon: 'dashboard', label: 'Dashboard', active: true },
    { icon: 'assignment', label: 'Activities' },
    { icon: 'people', label: 'Collaborators' },
    { icon: 'agriculture', label: 'Harvest' },
    { icon: 'shopping_cart', label: 'Purchases' },
    { icon: 'trending_up', label: 'Sales' },
    { icon: 'assessment', label: 'Reports' },
    { icon: 'settings', label: 'Settings' }
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