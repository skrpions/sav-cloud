import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ROUTES } from '../../shared/constants/routes';
import { toast } from 'ngx-sonner';
import { SidebarComponent, SidebarItem } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MaterialModule,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('websiteViewsChart') websiteViewsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailySalesChart') dailySalesChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('completedTasksChart') completedTasksChart!: ElementRef<HTMLCanvasElement>;

  private _supabaseService = inject(SupabaseService);
  private _router = inject(Router);

  isSidebarCollapsed = signal(false);

  ngOnInit(): void {
    // Initialize component data
    console.log('Dashboard initialized');
  }

  ngAfterViewInit(): void {
    // Initialize charts after view init
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  onSearchChanged(searchTerm: string): void {
    console.log('Search term:', searchTerm);
    // Implement search functionality here
  }

  onSidebarItemClicked(item: SidebarItem): void {
    console.log('Sidebar item clicked:', item);
    // Here you can handle navigation or other actions
    // For example: this._router.navigate([item.route]);
  }

  onSidebarCollapseChanged(isCollapsed: boolean): void {
    this.isSidebarCollapsed.set(isCollapsed);
    console.log('Sidebar collapsed:', isCollapsed);
  }

  private initializeCharts(): void {
    this.createWebsiteViewsChart();
    this.createDailySalesChart();
    this.createCompletedTasksChart();
  }

  private createWebsiteViewsChart(): void {
    const canvas = this.websiteViewsChart?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple bar chart simulation
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctx.fillStyle = '#4CAF50';
    const barWidth = canvas.width / 7;
    const heights = [0.3, 0.5, 0.2, 0.4, 0.6, 0.7, 0.8];
    
    heights.forEach((height, index) => {
      const barHeight = canvas.height * height;
      ctx.fillRect(index * barWidth + 10, canvas.height - barHeight, barWidth - 20, barHeight);
    });
  }

  private createDailySalesChart(): void {
    const canvas = this.dailySalesChart?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple line chart simulation
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    const points = [
      { x: 20, y: canvas.height - 40 },
      { x: 80, y: canvas.height - 80 },
      { x: 140, y: canvas.height - 120 },
      { x: 200, y: canvas.height - 90 },
      { x: 260, y: canvas.height - 130 },
      { x: 320, y: canvas.height - 110 }
    ];
    
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    
    ctx.stroke();
  }

  private createCompletedTasksChart(): void {
    const canvas = this.completedTasksChart?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple area chart simulation
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(76, 175, 80, 0.3)');
    gradient.addColorStop(1, 'rgba(76, 175, 80, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(20, canvas.height - 60);
    ctx.lineTo(80, canvas.height - 40);
    ctx.lineTo(140, canvas.height - 100);
    ctx.lineTo(200, canvas.height - 80);
    ctx.lineTo(260, canvas.height - 120);
    ctx.lineTo(320, canvas.height - 90);
    ctx.lineTo(canvas.width, canvas.height - 90);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
  }
} 