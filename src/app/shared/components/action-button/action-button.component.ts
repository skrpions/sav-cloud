import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';

export type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'text' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <button 
      [type]="type"
      [disabled]="disabled"
      [class]="getButtonClasses()"
      [matTooltip]="tooltip"
      [matTooltipPosition]="tooltipPosition"
      (click)="onClick($event)">
      
      @if (icon) {
        <mat-icon [class]="getIconClasses()">{{ icon }}</mat-icon>
      }
      
      @if (label && variant !== 'icon') {
        <span class="button-label">{{ label }}</span>
      }
      
      @if (loading) {
        <mat-spinner [diameter]="getSpinnerSize()" color="inherit"></mat-spinner>
      }
    </button>
  `,
  styleUrls: ['./action-button.component.scss']
})
export class ActionButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() icon?: string;
  @Input() label?: string;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() tooltip?: string;
  @Input() tooltipPosition: 'above' | 'below' | 'left' | 'right' = 'above';
  
  @Output() buttonClick = new EventEmitter<Event>();

  onClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit(event);
    }
  }

  getButtonClasses(): string {
    const baseClass = 'action-button';
    const variantClass = `action-button--${this.variant}`;
    const sizeClass = `action-button--${this.size}`;
    const loadingClass = this.loading ? 'action-button--loading' : '';
    const disabledClass = this.disabled ? 'action-button--disabled' : '';
    
    return [baseClass, variantClass, sizeClass, loadingClass, disabledClass]
      .filter(Boolean)
      .join(' ');
  }

  getIconClasses(): string {
    const baseClass = 'action-button__icon';
    const hasLabelClass = this.label && this.variant !== 'icon' ? 'action-button__icon--with-label' : '';
    
    return [baseClass, hasLabelClass].filter(Boolean).join(' ');
  }

  getSpinnerSize(): number {
    switch (this.size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  }
} 