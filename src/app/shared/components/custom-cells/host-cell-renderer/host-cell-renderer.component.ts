import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import { ImageDialogComponent } from '../../image-dialog/image-dialog.component';

@Component({
    standalone: true,
    selector: 'app-host-cell-renderer',
    imports: [CommonModule, MatDialogModule],
    styleUrls: ['./host-cell-renderer.component.scss'],
    template: `
    <div class="hostCell">
      <div class="image-wrapper" (click)="openImageZoom($event)">
        <img [src]="imageUrl || fallbackUrl" [alt]="hostname" (error)="onImageError($event)" />
      </div>
      <div class="info-wrapper">
        <div class="hostname">{{ hostname || 'Unknown Host' }}</div>
        <div class="ip-address">{{ ip || 'No IP Address' }}</div>
      </div>
    </div>
  `,
})
export class HostCellRendererComponent implements ICellRendererAngularComp {
    hostname = '';
    ip = '';
    imageUrl = '';
    fallbackUrl = 'assets/images/LeftPanelLogo.png';

    private dialog = inject(MatDialog);

    agInit(params: ICellRendererParams): void {
        // We expect the parent component to pass the entire row data to this renderer
        // because this column merges multiple fields. We usually map this renderer to the 'hostname' field.
        this.hostname = params.data?.hostname ?? '';
        this.ip = params.data?.ip ?? '';

        // Some hosts have real images, others don't. Fallback handeled in template.
        // In MiniFeAngular, image_host usually stores the filename. Adjust path if necessary.
        const image = params.data?.image_host;
        // Assuming images are stored in assets/hosts or similar. If it's a full URL, use as is.
        if (image) {
            this.imageUrl = image.startsWith('http') ? image : `assets/images/${image}`;
        } else {
            this.imageUrl = '';
        }
    }

    refresh(params: ICellRendererParams): boolean {
        this.agInit(params);
        return true;
    }

    onImageError(event: Event) {
        // If the main image fails to load, swap to the fallback logo
        const imgElement = event.target as HTMLImageElement;
        if (imgElement.src !== this.fallbackUrl) {
            imgElement.src = this.fallbackUrl;
            this.imageUrl = this.fallbackUrl; // Update tracking variable so the popup uses it too
        }
    }

    openImageZoom(event: MouseEvent) {
        // Prevent row selection when clicking the image
        event.stopPropagation();

        if (this.imageUrl) {
            this.dialog.open(ImageDialogComponent, {
                data: { imageUrl: this.imageUrl, title: this.hostname },
                maxWidth: '90vw',
                maxHeight: '90vh',
                panelClass: 'image-dialog-panel'
            });
        }
    }
}
