import { Component, EventEmitter, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface SidebarItem {
  icon: string;
  label: string;
  route?: string;
  active?: boolean;
}

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

  private _translateService = inject(TranslateService);
  isCollapsed = signal(false);

  sidebarItems: SidebarItem[] = [
    { icon: 'dashboard', label: this._translateService.instant('sidebar.navigation.dashboard'), active: true },
    { icon: 'assignment', label: this._translateService.instant('sidebar.navigation.activities') },
    { icon: 'people', label: this._translateService.instant('sidebar.navigation.collaborators') },
    { icon: 'agriculture', label: this._translateService.instant('sidebar.navigation.harvest') },
    { icon: 'shopping_cart', label: this._translateService.instant('sidebar.navigation.purchases') },
    { icon: 'trending_up', label: this._translateService.instant('sidebar.navigation.sales') },
    { icon: 'assessment', label: this._translateService.instant('sidebar.navigation.reports') },
    { icon: 'settings', label: this._translateService.instant('sidebar.navigation.settings') }
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