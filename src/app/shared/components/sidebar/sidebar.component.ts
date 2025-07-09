import { Component, EventEmitter, Output, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

import { MaterialModule } from '@/app/shared/material.module';
import { SidebarItem } from '@/app/shared/models/ui.models';
import { UserService } from '@/app/shared/services/user.service';
import { FarmStateService } from '@/app/shared/services/farm-state.service';

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
  private _userService = inject(UserService);
  private _farmStateService = inject(FarmStateService);
  
  isCollapsed = signal(false);
  isHovering = signal(false);
  
  // Usar signals del servicio global
  userName = this._userService.userName;
  userRole = this._userService.userRole;

  sidebarItems: SidebarItem[] = [
    { icon: 'dashboard', labelKey: 'sidebar.navigation.dashboard', route: '/dashboard', active: true },
    { 
      icon: 'agriculture', 
      labelKey: 'sidebar.navigation.farms', 
      parent: true,
      expanded: false,
      children: [
        { icon: 'home_work', labelKey: 'sidebar.navigation.farmManagement', route: '/farms' },
        { icon: 'terrain', labelKey: 'sidebar.navigation.plots', route: '/plots' }
      ]
    },
    { icon: 'assignment', labelKey: 'sidebar.navigation.activities', route: '/activities' },
    { icon: 'people', labelKey: 'sidebar.navigation.collaborators', route: '/collaborators' },
    { icon: 'grass', labelKey: 'sidebar.navigation.harvest', route: '/harvest' },
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

    // Load current user information through service
    if (this._userService.userName() === 'Usuario') {
      this._userService.loadCurrentUser();
    }

    // Update disabled state based on farms availability and listen to changes
    effect(() => {
      this._farmStateService.farms(); // Read the signal to register dependency
      this.updateDisabledStates();
    });
  }

  private updateActiveItemFromRoute(): void {
    const currentUrl = this._router.url;
    
    // Resetear todos los items
    this.resetActiveItems(this.sidebarItems);
    
    // Buscar y activar el item correcto
    this.setActiveItem(this.sidebarItems, currentUrl);
  }

  private resetActiveItems(items: SidebarItem[]): void {
    items.forEach(item => {
      item.active = false;
      if (item.children) {
        this.resetActiveItems(item.children);
      }
    });
  }

  private setActiveItem(items: SidebarItem[], currentUrl: string): void {
    for (const item of items) {
      if (item.route === currentUrl) {
        item.active = true;
        // Si es un hijo, expandir el padre
        if (this.isChildItem(item)) {
          const parent = this.findParentItem(item);
          if (parent) {
            parent.expanded = true;
          }
        }
        return;
      }
      
      if (item.children) {
        this.setActiveItem(item.children, currentUrl);
      }
    }
  }

  private isChildItem(targetItem: SidebarItem): boolean {
    for (const item of this.sidebarItems) {
      if (item.children?.includes(targetItem)) {
        return true;
      }
    }
    return false;
  }

  private findParentItem(targetItem: SidebarItem): SidebarItem | null {
    for (const item of this.sidebarItems) {
      if (item.children?.includes(targetItem)) {
        return item;
      }
    }
    return null;
  }

  private updateDisabledStates(): void {
    const hasFarms = this._farmStateService.hasFarms();
    
    // Find the farms parent item and its plots child
    const farmsItem = this.sidebarItems.find(item => item.labelKey === 'sidebar.navigation.farms');
    if (farmsItem?.children) {
      const plotsItem = farmsItem.children.find(child => child.labelKey === 'sidebar.navigation.plots');
      if (plotsItem) {
        plotsItem.disabled = !hasFarms;
      }
    }
  }

  toggleCollapse(): void {
    this.isCollapsed.update(collapsed => !collapsed);
    // Reset hover state when manually toggling
    this.isHovering.set(false);
    this.collapseChanged.emit(this.isCollapsed());
  }

  toggleExpand(item: SidebarItem): void {
    if (item.children && item.children.length > 0) {
      item.expanded = !item.expanded;
    }
  }

  onItemClick(item: SidebarItem): void {
    // No hacer nada si el item está deshabilitado
    if (item.disabled) {
      return;
    }

    // Si tiene hijos, toggle expansión en lugar de navegar
    if (item.children && item.children.length > 0) {
      this.toggleExpand(item);
      return;
    }

    // Update active state
    this.resetActiveItems(this.sidebarItems);
    item.active = true;
    
    // Navigate to route if available
    if (item.route) {
      this._router.navigate([item.route]);
    }
    
    this.itemClicked.emit(item);
  }

  // Métodos para manejar el hover cuando está colapsado
  onSidebarMouseEnter(): void {
    if (this.isCollapsed()) {
      this.isHovering.set(true);
    }
  }

  onSidebarMouseLeave(): void {
    this.isHovering.set(false);
  }

  // Computed property para determinar si debe mostrar contenido expandido
  shouldShowExpandedContent(): boolean {
    return !this.isCollapsed() || (this.isCollapsed() && this.isHovering());
  }
} 