import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams, IRowNode } from 'ag-grid-community';
import { Host } from '../../../../features/hosts/hosts.service';
import { HostDetailDialogComponent } from '../../../../features/hosts/components/host-detail-dialog/host-detail-dialog.component';

@Component({
    standalone: true,
    selector: 'app-host-actions-cell-renderer',
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
    styleUrls: ['./host-actions-cell-renderer.component.scss'],
    templateUrl: './host-actions-cell-renderer.component.html',
})
export class HostActionsCellRendererComponent implements ICellRendererAngularComp {
    private dialog = inject(MatDialog);

    hostData?: Host;
    node?: IRowNode;
    api?: any;

    agInit(params: ICellRendererParams): void {
        this.hostData = params.data;
        this.node = params.node;
        this.api = params.api;
    }

    refresh(params: ICellRendererParams): boolean {
        this.hostData = params.data;
        this.node = params.node;
        this.api = params.api;
        return true;
    }

    openDetailDialog() {
        if (!this.hostData) return;

        this.dialog.open(HostDetailDialogComponent, {
            data: {
                host: this.hostData,
                apiParams: { api: this.api, node: this.node }
            },
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            panelClass: 'host-detail-dialog-panel'
        });
    }

    openJenkins() {
        if (this.hostData?.jenkins_url) {
            window.open(this.hostData.jenkins_url, '_blank');
        }
    }
}
