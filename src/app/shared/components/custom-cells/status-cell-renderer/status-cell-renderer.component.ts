import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

@Component({
    standalone: true,
    selector: 'app-status-cell-renderer',
    imports: [CommonModule],
    styleUrls: ['./status-cell-renderer.component.scss'],
    template: `
    <div class="tag" [ngClass]="statusClass">
      <div class="circle" [ngClass]="circleClass"></div>
      <span>{{ valueFormatted || value || 'Unknown' }}</span>
    </div>
  `
})
export class StatusCellRendererComponent implements ICellRendererAngularComp {
    value = '';
    valueFormatted = '';
    statusClass = '';
    circleClass = '';

    // Mapping generic status values to color semantics
    // We can expand this map as new statuses are discovered
    private statusColorMap: Record<string, 'active' | 'inactive' | 'pending' | 'warning' | 'default'> = {
        // Green / Active variants
        'active': 'active',
        'operational': 'active',
        'resolved': 'active',
        'online': 'active',
        'success': 'active',
        'in use': 'active',

        // Red / Error variants
        'inactive': 'inactive',
        'out of stock': 'inactive',
        'error': 'inactive',
        'offline': 'inactive',
        'failed': 'inactive',

        // Orange / Warning variants
        'needs maintenance': 'warning',
        'paused': 'warning',
        'on hold': 'warning',

        // Gray / Pending variants
        'pending': 'pending',
        'investigating': 'pending',
        'unknown': 'pending',
        'not in use': 'pending',
    };

    agInit(params: ICellRendererParams): void {
        this.value = params.value ?? '';
        this.valueFormatted = params.valueFormatted ?? '';

        // Normalize value for matching (lowercase, trim)
        const normalizedValue = this.value.toString().toLowerCase().trim();

        // Determine the color category, defaulting to 'default'
        const colorCategory = this.statusColorMap[normalizedValue] || 'default';

        this.statusClass = `${colorCategory}Tag`;
        this.circleClass = `${colorCategory}Circle`;
    }

    refresh(params: ICellRendererParams): boolean {
        this.agInit(params);
        return true;
    }
}
