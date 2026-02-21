import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import { ImageDialogComponent } from '../../image-dialog/image-dialog.component';

@Component({
    standalone: true,
    selector: 'app-image-cell-renderer',
    imports: [CommonModule, MatDialogModule],
    template: `
    <div class="image-cell" (click)="openImageZoom($event)">
      <img *ngIf="imageUrl" [src]="imageUrl" (error)="onImageError($event)" />
      <span *ngIf="!imageUrl" class="no-image-text">No Image</span>
    </div>
  `,
    styles: [`
    .image-cell {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        img {
            max-width: 40px;
            max-height: 40px;
            border-radius: 4px;
            object-fit: cover;
            cursor: zoom-in;
            border: 1px solid var(--border-color, rgba(145, 158, 171, 0.2));
            transition: transform 0.2s;

            &:hover {
                transform: scale(1.1);
            }
        }
        
        .no-image-text {
            color: var(--text-secondary, #637381);
            font-size: 0.8rem;
            font-style: italic;
        }
    }
  `]
})
export class ImageCellRendererComponent implements ICellRendererAngularComp {
    imageUrl = '';
    fallbackUrl = 'assets/images/LeftPanelLogo.png';

    private dialog = inject(MatDialog);

    agInit(params: ICellRendererParams): void {
        this.updateImage(params.value);
    }

    refresh(params: ICellRendererParams): boolean {
        this.updateImage(params.value);
        return true;
    }

    updateImage(value: any) {
        if (value && typeof value === 'string') {
            this.imageUrl = value.startsWith('http') ? value : `assets/images/${value}`;
        } else {
            this.imageUrl = '';
        }
    }

    onImageError(event: Event) {
        const imgElement = event.target as HTMLImageElement;
        if (imgElement.src !== this.fallbackUrl) {
            imgElement.src = this.fallbackUrl;
            this.imageUrl = this.fallbackUrl;
        }
    }

    openImageZoom(event: MouseEvent) {
        event.stopPropagation();
        if (this.imageUrl) {
            this.dialog.open(ImageDialogComponent, {
                data: { imageUrl: this.imageUrl, title: 'Image Preview' },
                maxWidth: '90vw',
                maxHeight: '90vh',
                panelClass: 'image-dialog-panel'
            });
        }
    }
}
