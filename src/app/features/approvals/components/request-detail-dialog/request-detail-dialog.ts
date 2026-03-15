import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ApprovalRequest, Permission } from '../../../../core/models/approval.model';
import { ImageDialogComponent } from '../../../../shared/components/image-dialog/image-dialog.component';

@Component({
  selector: 'app-request-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './request-detail-dialog.html',
  styleUrl: './request-detail-dialog.scss'
})
export class RequestDetailDialogComponent {
  request: ApprovalRequest;

  constructor(
    public dialogRef: MatDialogRef<RequestDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { request: ApprovalRequest },
    private dialog: MatDialog
  ) {
    this.request = data.request;
  }

  close(): void {
    this.dialogRef.close();
  }

  openOriginalFile() {
    if (this.request.originalFileUrl) {
      this.dialog.open(ImageDialogComponent, {
        data: { url: this.request.originalFileUrl, alt: 'Original Approval Document' },
        panelClass: 'image-dialog-container',
        maxWidth: '90vw',
        maxHeight: '90vh'
      });
    }
  }
}
