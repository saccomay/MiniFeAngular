import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface FileImportDialogData {
    title: string;
    accept: string;
}

@Component({
    selector: 'app-file-import-dialog',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
    templateUrl: './file-import-dialog.component.html',
    styleUrls: ['./file-import-dialog.component.scss']
})
export class FileImportDialogComponent {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    isDragging = false;
    selectedFile: File | null = null;
    fileSizeString = '';

    constructor(
        public dialogRef: MatDialogRef<FileImportDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: FileImportDialogData
    ) { }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        if (event.dataTransfer && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            this.handleFileSelection(file);
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleFileSelection(input.files[0]);
        }
    }

    triggerFileInput() {
        this.fileInput.nativeElement.click();
    }

    private handleFileSelection(file: File) {
        if (this.data.accept) {
            const acceptedTypes = this.data.accept.split(',').map(t => t.trim());
            const extension = '.' + file.name.split('.').pop()?.toLowerCase();
            const mimeType = file.type; // e.g. "image/jpeg"
            const mimeCategory = mimeType.split('/')[0]; // e.g. "image"

            const isAccepted = acceptedTypes.some(accepted => {
                if (accepted === '*' || accepted === '*/*') return true;
                if (accepted === `${mimeCategory}/*`) return true; // handles "image/*"
                if (accepted === mimeType) return true;             // handles "image/jpeg"
                if (accepted.startsWith('.') && accepted === extension) return true; // handles ".jpg"
                return false;
            });

            if (!isAccepted) {
                console.error('Invalid file type:', file.type);
                return;
            }
        }

        this.selectedFile = file;
        this.formatFileSize(file.size);
    }

    removeFile(event: Event) {
        event.stopPropagation(); // prevent triggering browse
        this.selectedFile = null;
        this.fileSizeString = '';
        if (this.fileInput && this.fileInput.nativeElement) {
            this.fileInput.nativeElement.value = '';
        }
    }

    private formatFileSize(bytes: number) {
        if (bytes === 0) {
            this.fileSizeString = '0 B';
            return;
        }
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        this.fileSizeString = parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    upload() {
        if (this.selectedFile) {
            this.dialogRef.close(this.selectedFile);
        }
    }

    close() {
        this.dialogRef.close(null);
    }
}
