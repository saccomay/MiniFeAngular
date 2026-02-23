import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

@Component({
    standalone: true,
    selector: 'app-editable-cell-renderer',
    imports: [CommonModule, MatIconModule],
    template: `
        <div class="editable-cell">
            <mat-icon class="edit-icon">edit</mat-icon>
            <span class="cell-value">{{ value }}</span>
        </div>
    `,
    styles: [`
        .editable-cell {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
            cursor: pointer;
        }

        .cell-value {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .edit-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
            line-height: 14px;
            opacity: 0.35;
            flex-shrink: 0;
            transition: opacity 0.15s ease;
            color: inherit;
        }

        .editable-cell:hover .edit-icon {
            opacity: 0.8;
        }
    `]
})
export class EditableCellRendererComponent implements ICellRendererAngularComp {
    value = '';

    agInit(params: ICellRendererParams): void {
        this.value = params.value ?? '';
    }

    refresh(params: ICellRendererParams): boolean {
        this.value = params.value ?? '';
        return true;
    }
}
