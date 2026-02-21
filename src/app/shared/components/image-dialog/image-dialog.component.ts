import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ImageDialogData {
  imageUrl: string;
  title?: string;
}

@Component({
  selector: 'app-image-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  styleUrls: ['./image-dialog.component.scss'],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>{{ data.title || 'Image Preview' }}</h2>
      <button mat-icon-button (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content class="dialog-content">
      <img [src]="data.imageUrl" [alt]="data.title || 'Image'" class="preview-image" (error)="onImageError($event)" />
    </mat-dialog-content>
  `
})
export class ImageDialogComponent {
  fallbackUrl = 'assets/images/LeftPanelLogo.png';

  constructor(
    public dialogRef: MatDialogRef<ImageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageDialogData
  ) { }

  close(): void {
    this.dialogRef.close();
  }

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement.src !== this.fallbackUrl) {
      imgElement.src = this.fallbackUrl;
    }
  }
}
