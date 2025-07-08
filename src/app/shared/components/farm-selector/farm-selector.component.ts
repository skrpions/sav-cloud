import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MaterialModule } from '@/app/shared/material.module';
import { FarmStateService } from '@/app/shared/services/farm-state.service';

@Component({
  selector: 'app-farm-selector',
  standalone: true,
  imports: [CommonModule, MaterialModule, TranslateModule],
  template: `
    <div class="farm-selector" *ngIf="farmStateService.hasFarms(); else noFarmsTemplate">
      <mat-form-field appearance="outline" class="farm-select-field">
        <mat-label>Finca Activa</mat-label>
        <mat-select 
          [value]="farmStateService.currentFarmId()" 
          (selectionChange)="onFarmSelectionChange($event.value)"
          [disabled]="farmStateService.isLoading()">
          
          @for (farm of farmStateService.farms(); track farm.id) {
            <mat-option [value]="farm.id">
              <div class="farm-option">
                <div class="farm-name">{{ farm.name }}</div>
                <div class="farm-location" *ngIf="farm.municipality">
                  {{ farm.municipality }}{{ farm.department ? ', ' + farm.department : '' }}
                </div>
              </div>
            </mat-option>
          }
        </mat-select>
        
        <mat-hint *ngIf="farmStateService.isLoading()">Cargando fincas...</mat-hint>
      </mat-form-field>

      <button 
        mat-icon-button 
        matTooltip="Gestionar Fincas"
        (click)="navigateToFarms()"
        class="manage-farms-btn">
        <mat-icon>settings</mat-icon>
      </button>
    </div>

    <ng-template #noFarmsTemplate>
      <div class="no-farms-message">
        <button 
          mat-raised-button 
          color="primary" 
          (click)="navigateToFarms()"
          class="create-farm-btn">
          <mat-icon>add</mat-icon>
          Crear Primera Finca
        </button>
      </div>
    </ng-template>

    <!-- Error message -->
    <div class="error-message" *ngIf="farmStateService.error()">
      <mat-icon>warning</mat-icon>
      <span>{{ farmStateService.error() }}</span>
      <button mat-icon-button (click)="refreshFarms()" matTooltip="Reintentar">
        <mat-icon>refresh</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .farm-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 250px;
    }

    .farm-select-field {
      flex: 1;
      font-size: 14px;

      ::ng-deep {
        .mat-mdc-form-field {
          .mat-mdc-text-field-wrapper {
            height: 40px;
          }

          .mdc-text-field--outlined {
            .mdc-notched-outline {
              .mdc-notched-outline__leading,
              .mdc-notched-outline__notch,
              .mdc-notched-outline__trailing {
                border-color: rgba(0, 0, 0, 0.23);
              }
            }

            &:not(.mdc-text-field--disabled):hover .mdc-notched-outline {
              .mdc-notched-outline__leading,
              .mdc-notched-outline__notch,
              .mdc-notched-outline__trailing {
                border-color: rgba(0, 0, 0, 0.87);
              }
            }

            &.mdc-text-field--focused .mdc-notched-outline {
              .mdc-notched-outline__leading,
              .mdc-notched-outline__notch,
              .mdc-notched-outline__trailing {
                border-color: var(--holiday-green-medium) !important;
                border-width: 2px;
              }
            }
          }

          .mat-mdc-form-field-label {
            color: rgba(0, 0, 0, 0.6);
          }

          &.mat-focused .mat-mdc-form-field-label {
            color: var(--holiday-green-medium) !important;
          }
        }
      }
    }

    .farm-option {
      .farm-name {
        font-weight: 500;
        color: var(--holiday-teal-dark);
      }

      .farm-location {
        font-size: 12px;
        color: var(--holiday-sage-green);
        margin-top: 2px;
      }
    }

    .manage-farms-btn {
      width: 40px;
      height: 40px;
      color: var(--holiday-sage-green);
      
      &:hover {
        background-color: rgba(83, 115, 106, 0.1);
        color: var(--holiday-teal-dark);
      }
    }

    .no-farms-message {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .create-farm-btn {
      height: 40px;
      font-size: 13px;
      
      ::ng-deep .mdc-button__label {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background-color: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.2);
      border-radius: 8px;
      color: #f44336;
      font-size: 13px;
      max-width: 300px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      button {
        color: #f44336;
        width: 24px;
        height: 24px;
        
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    @media (max-width: 768px) {
      .farm-selector {
        min-width: 200px;
      }

      .farm-select-field {
        font-size: 13px;
      }

      .no-farms-message .create-farm-btn {
        font-size: 12px;
        height: 36px;
      }
    }
  `]
})
export class FarmSelectorComponent {
  private _router = inject(Router);
  
  // Inyectar el servicio de estado de finca
  readonly farmStateService = inject(FarmStateService);

  onFarmSelectionChange(farmId: string): void {
    if (farmId) {
      this.farmStateService.setCurrentFarmById(farmId);
    }
  }

  navigateToFarms(): void {
    this._router.navigate(['/farms']);
  }

  refreshFarms(): void {
    this.farmStateService.refreshFarms();
  }
} 