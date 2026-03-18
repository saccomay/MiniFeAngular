import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { EntityApprovalSummary, ApprovalRequest } from '../../../../core/models/approval.model';
import { ApprovalService } from '../../../../core/services/approval.service';
import { RequestDetailDialogComponent } from '../request-detail-dialog/request-detail-dialog';
import { FirewallRulesDialogComponent } from '../firewall-rules-dialog/firewall-rules-dialog';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-device-detail-drawer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDividerModule, MatDialogModule],
  templateUrl: './device-detail-drawer.html',
  styleUrl: './device-detail-drawer.scss'
})
export class DeviceDetailDrawerComponent {
  @Input() summary: EntityApprovalSummary | null = null;
  @Output() closeDrawer = new EventEmitter<void>();

  dialog = inject(MatDialog);
  approvalService = inject(ApprovalService);

  openFirewallRulesDialog(rules: any[]) {
    this.dialog.open(FirewallRulesDialogComponent, {
      width: '600px',
      height: '80vh',
      data: { rules },
      panelClass: 'modern-dialog'
    });
  }

  openExternalLink(requestId: string) {
    // Replace with the actual base URL or routing logic for your request system
    const url = `/requests/${requestId}`;
    window.open(url, '_blank');
  }

  openRequestDetails(requestId: string) {
    this.approvalService.getRequestDetails(requestId).subscribe(req => {
      if (req) {
        this.dialog.open(RequestDetailDialogComponent, {
          width: '600px',
          data: { request: req },
          panelClass: 'modern-dialog'
        });
      }
    });
  }

  getTypeIcon(type: string): string {
    return type === 'Account' ? 'manage_accounts' : (type === 'AP' ? 'router' : 'dns');
  }
}
