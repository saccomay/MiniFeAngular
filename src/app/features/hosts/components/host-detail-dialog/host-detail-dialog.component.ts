import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Host, HostsService } from '../../hosts.service';
import { FileImportDialogComponent } from '../../../../shared/components/file-import-dialog/file-import-dialog.component';

@Component({
    standalone: true,
    selector: 'app-host-detail-dialog',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './host-detail-dialog.component.html',
    styleUrls: ['./host-detail-dialog.component.scss']
})
export class HostDetailDialogComponent implements OnInit {
    private hostsService = inject(HostsService);
    private snackBar = inject(MatSnackBar);
    private matDialog = inject(MatDialog);

    host: Host;

    // Editable fields bound to the form
    editData = {
        image_host: '',
        image_label: '',
        comment: ''
    };

    isSaving = signal(false);
    isUploadingHost = signal(false);
    isUploadingLabel = signal(false);

    fallbackUrl = 'assets/images/LeftPanelLogo.png';
    imageUrl = '';
    imageLabelUrl = '';

    // Track selected files
    selectedImageHostFile: File | null = null;
    selectedImageLabelFile: File | null = null;

    constructor(
        public dialogRef: MatDialogRef<HostDetailDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { host: Host; apiParams?: any }
    ) {
        this.host = data.host;

        // Initialize form fields with current data
        this.editData.image_host = this.host.image_host || '';
        this.editData.image_label = this.host.image_label || '';
        this.editData.comment = this.host.comment || '';
    }

    ngOnInit() {
        this.updateImageUrl();
    }

    updateImageUrl() {
        const image = this.editData.image_host || this.host.image_host;
        if (image) {
            this.imageUrl = image.startsWith('http') ? image : `assets/images/${image}`;
        } else {
            this.imageUrl = '';
        }

        const labelImage = this.editData.image_label || this.host.image_label;
        if (labelImage) {
            this.imageLabelUrl = labelImage.startsWith('http') ? labelImage : `assets/images/${labelImage}`;
        } else {
            this.imageLabelUrl = '';
        }
    }

    onImageError(event: Event, type: 'host' | 'label') {
        const imgElement = event.target as HTMLImageElement;
        if (imgElement.src !== this.fallbackUrl) {
            imgElement.src = this.fallbackUrl;
        }
    }

    openImageDialog(type: 'host' | 'label') {
        const dialogRef = this.matDialog.open(FileImportDialogComponent, {
            width: '500px',
            data: {
                title: type === 'host' ? 'Upload Image Host' : 'Upload Image Label',
                accept: 'image/*'
            },
            panelClass: 'custom-dialog-container',
            autoFocus: false
        });

        dialogRef.afterClosed().subscribe(async (file: File | null) => {
            if (file && this.host.hostname) {
                await this.uploadImage(file, type);
            }
        });
    }

    private async uploadImage(file: File, type: 'host' | 'label') {
        try {
            if (type === 'host') {
                this.isUploadingHost.set(true);
                this.selectedImageHostFile = file;

                const reader = new FileReader();
                reader.onload = (e: any) => { this.imageUrl = e.target.result; };
                reader.readAsDataURL(file);

                const formData = new FormData();
                formData.append('image_host_file', file);
                await this.hostsService.updateHost(this.host.hostname!, formData as any);

                this.editData.image_host = file.name;
                this.host.image_host = file.name;
                this.snackBar.open('Host Image uploaded successfully', 'Close', { duration: 3000 });
                this.updateGridRow();

            } else if (type === 'label') {
                this.isUploadingLabel.set(true);
                this.selectedImageLabelFile = file;

                const reader = new FileReader();
                reader.onload = (e: any) => { this.imageLabelUrl = e.target.result; };
                reader.readAsDataURL(file);

                const formData = new FormData();
                formData.append('image_label_file', file);
                await this.hostsService.updateHost(this.host.hostname!, formData as any);

                this.editData.image_label = file.name;
                this.host.image_label = file.name;
                this.snackBar.open('Label Image uploaded successfully', 'Close', { duration: 3000 });
                this.updateGridRow();
            }
        } catch (error) {
            this.snackBar.open('Failed to upload image', 'Close', { duration: 3000 });
            console.error(error);
        } finally {
            if (type === 'host') this.isUploadingHost.set(false);
            if (type === 'label') this.isUploadingLabel.set(false);
        }
    }

    async clearImage(type: 'host' | 'label') {
        if (!this.host.hostname) return;

        try {
            if (type === 'host') {
                this.isUploadingHost.set(true);
                const updatePayload: Partial<Host> = { image_host: '' };
                await this.hostsService.updateHost(this.host.hostname, updatePayload);

                this.selectedImageHostFile = null;
                this.editData.image_host = '';
                this.host.image_host = '';
                this.imageUrl = '';
            } else if (type === 'label') {
                this.isUploadingLabel.set(true);
                const updatePayload: Partial<Host> = { image_label: '' };
                await this.hostsService.updateHost(this.host.hostname, updatePayload);

                this.selectedImageLabelFile = null;
                this.editData.image_label = '';
                this.host.image_label = '';
                this.imageLabelUrl = '';
            }
            this.updateGridRow();
            this.snackBar.open('Image removed successfully', 'Close', { duration: 3000 });
        } catch (error) {
            this.snackBar.open('Failed to remove image', 'Close', { duration: 3000 });
            console.error(error);
        } finally {
            if (type === 'host') this.isUploadingHost.set(false);
            if (type === 'label') this.isUploadingLabel.set(false);
        }
    }

    async updateComment() {
        if (!this.host.hostname) return;

        this.isSaving.set(true);
        try {
            const updatePayload: Partial<Host> = {
                comment: this.editData.comment
            };
            await this.hostsService.updateHost(this.host.hostname, updatePayload);

            this.host.comment = this.editData.comment;
            this.updateGridRow();

            this.snackBar.open('Comment updated successfully', 'Close', { duration: 3000 });
        } catch (error) {
            this.snackBar.open('Failed to update comment', 'Close', { duration: 3000 });
            console.error(error);
        } finally {
            this.isSaving.set(false);
        }
    }

    private updateGridRow() {
        if (this.data.apiParams && this.data.apiParams.api && this.data.apiParams.node) {
            this.data.apiParams.node.setData(this.host);
        }
    }
}
