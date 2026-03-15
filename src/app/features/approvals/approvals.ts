import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ApprovalService } from '../../core/services/approval.service';
import { EntityApprovalSummary } from '../../core/models/approval.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FileImportDialogComponent } from '../../shared/components/file-import-dialog/file-import-dialog.component';
import { ColDef, GridReadyEvent } from 'ag-grid-community';

import { DeviceDetailDrawerComponent } from './components/device-detail-drawer/device-detail-drawer';
import { StatusCellRendererComponent } from '../../shared/components/custom-cells/status-cell-renderer/status-cell-renderer.component';
import { AgGridWrapperComponent } from '../../shared/components/ag-grid-wrapper/ag-grid-wrapper.component';
import { TableToolbarComponent, TabOption } from '../../shared/components/table-toolbar/table-toolbar.component';
import { SkeletonLoadingOverlay } from '../../shared/components/custom-cells/skeleton-loading-overlay/skeleton-loading-overlay';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatDialogModule,
    AgGridWrapperComponent,
    DeviceDetailDrawerComponent,
    TableToolbarComponent,
    SkeletonLoadingOverlay
  ],
  templateUrl: './approvals.html',
  styleUrls: ['./approvals.scss', '../../shared/styles/table-page.scss']
})
export class ApprovalsComponent implements OnInit {
  approvalService = inject(ApprovalService);
  dialog = inject(MatDialog);

  summaries: EntityApprovalSummary[] = [];
  filteredSummaries: EntityApprovalSummary[] = [];
  loading = true;

  // Search/Filter states
  searchQuery = '';
  selectedDevice: EntityApprovalSummary | null = null;
  drawerOpen = false;

  // Toolbar states
  tabs: TabOption[] = [
    { value: 'all', label: 'All', count: 0 },
    // Add additional tabs if needed based on entity type or status
    { value: 'Account', label: 'Accounts', color: '#10B981', count: 0 },
    { value: 'AP', label: 'APs', color: '#3B82F6', count: 0 },
    { value: 'IP', label: 'IPs', color: '#F59E0B', count: 0 }
  ];
  activeTab = 'all';
  quickFilterText = '';
  activeFilterCount = 0;

  private gridApi: any;

  colDefs: ColDef[] = [
    {
      field: 'entityId',
      headerName: 'Entity (IP/Account)',
      flex: 1.5,
      cellRenderer: (params: any) => {
        if (!params.value) return '';
        const summary: EntityApprovalSummary = params.data;
        const iconName = summary.entityType === 'Account' ? 'manage_accounts' : (summary.entityType === 'AP' ? 'router' : 'computer');
        const iconClass = summary.entityType === 'Account' ? 'is-account' : (summary.entityType === 'AP' ? 'is-ap' : 'is-computer');
        return `
          <div class="entity-cell">
            <div class="entity-icon ${iconClass}">
               <mat-icon class="mat-icon material-icons">${iconName}</mat-icon>
            </div>
            <div class="entity-info">
               <span class="entity-id">${summary.entityId}</span>
               <span class="entity-type">${summary.entityType}</span>
            </div>
          </div>
        `;
      }
    },
    { field: 'status', headerName: 'Status', cellRenderer: StatusCellRendererComponent, width: 120 },
    {
      field: 'escortExpiry',
      headerName: 'Escort',
      flex: 1,
      cellRenderer: (params: any) => {
        const d: EntityApprovalSummary = params.data;
        if (d.hasEscort && d.escortExpiry) {
          return `<div class="info-cell"><mat-icon class="mat-icon material-icons success-icon">check_circle</mat-icon> <span>${d.escortExpiry}</span></div>`;
        }
        return '<span class="empty-text">-</span>';
      }
    },
    {
      headerName: 'Firewall',
      flex: 1.5,
      autoHeight: true,
      wrapText: true,
      cellRenderer: (params: any) => {
        const d: EntityApprovalSummary = params.data;
        let html = '<div class="firewall-info">';
        if (d.firewallGroups && d.firewallGroups.length > 0) {
          d.firewallGroups.forEach(group => {
            const expClass = group.isExpired ? 'expired' : 'valid';
            const iconClass = group.isExpired ? 'error' : 'event';

            let inCount = 0;
            let outCount = 0;
            let tooltipLines: string[] = [];

            group.rules.forEach(r => {
                if (r.direction === 'In') {
                    inCount++;
                    tooltipLines.push(`In: ${r.peer}:${r.port} [${r.protocol}]`);
                } else {
                    outCount++;
                    tooltipLines.push(`Out: ${r.peer}:${r.port} [${r.protocol}]`);
                }
            });

            let ioText = [];
            if (outCount > 0) ioText.push(`${outCount} Out`);
            if (inCount > 0) ioText.push(`${inCount} In`);

            const tooltipText = tooltipLines.join(' | ');

            html += `<div class="fw-item ${expClass}" title="${tooltipText}">`;
            html += `<mat-icon class="mat-icon material-icons">${iconClass}</mat-icon> <span>${group.expiryDate} (${ioText.join(', ')})</span>`;
            html += `</div>`;
          });
        }
        if (!d.firewallGroups || d.firewallGroups.length === 0) {
          return '<span class="empty-text">-</span>';
        }
        return html + '</div>';
      }
    },
    {
      headerName: 'Proxy',
      flex: 1.5,
      autoHeight: true,
      wrapText: true,
      cellRenderer: (params: any) => {
        const d: EntityApprovalSummary = params.data;
        let html = '<div class="proxy-info">';
        if (d.proxyForAll) {
          const p = d.proxyForAll;
          const expClass = p.isExpired ? 'expired' : 'valid';
          const iconClass = p.isExpired ? 'error' : 'public';
          html += `<div class="proxy-item ${expClass}" title="Proxy For All"><mat-icon class="mat-icon material-icons">${iconClass}</mat-icon> <span>${p.expiryDate} (All)</span></div>`;
        }
        if (d.proxyGroups && d.proxyGroups.length > 0) {
          d.proxyGroups.forEach(group => {
            const expClass = group.isExpired ? 'expired' : 'valid';
            const iconClass = group.isExpired ? 'error' : 'link';

            let targetsHtml = '';
            group.targets.forEach(t => { targetsHtml += `<div style="margin-top: 2px;">• ${t}</div>` });

            html += `<div class="proxy-item ${expClass}" title="${group.targets.join(', ')}">`;
            html += `<mat-icon class="mat-icon material-icons">${iconClass}</mat-icon> `;
            html += `<div><strong>${group.expiryDate}</strong>${targetsHtml}</div>`;
            html += `</div>`;
          });
        }
        if (!d.proxyForAll && (!d.proxyGroups || d.proxyGroups.length === 0)) {
          return '<span class="empty-text">-</span>';
        }
        return html + '</div>';
      }
    },
    {
      field: 'totalPermissions',
      headerName: 'Total Perms',
      width: 130,
      cellRenderer: (params: any) => {
        return `<div class="permissions-info"><span class="perm-count">${params.value} Total</span></div>`;
      }
    },
    {
      headerName: 'Actions',
      width: 100,
      cellRenderer: () => {
        return `<button class="action-btn"><mat-icon class="mat-icon material-icons">chevron_right</mat-icon></button>`;
      }
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.approvalService.getDeviceSummaries().subscribe(data => {
      this.summaries = data;
      this.filteredSummaries = [...this.summaries];
      this.updateTabCounts();
      this.loading = false;
    });
  }

  reload() {
    this.loadData();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onRowClicked(event: any) {
    this.openDeviceDetails(event.data);
  }

  // ─── Toolbar Action Handlers ───────────────────────────────────────────

  updateTabCounts() {
    const allCount = this.summaries.length;
    const accountCount = this.summaries.filter(s => s.entityType === 'Account').length;
    const apCount = this.summaries.filter(s => s.entityType === 'AP').length;
    const ipCount = this.summaries.filter(s => (s.entityType as string) === 'IP').length;

    this.tabs = this.tabs.map(tab => {
      if (tab.value === 'all') return { ...tab, count: allCount };
      if (tab.value === 'Account') return { ...tab, count: accountCount };
      if (tab.value === 'AP') return { ...tab, count: apCount };
      if (tab.value === 'IP') return { ...tab, count: ipCount };
      return tab;
    });
  }

  calculateActiveFilters() {
    let count = 0;
    if (this.activeTab !== 'all') count++;
    if (this.quickFilterText.trim() !== '') count++;
    this.activeFilterCount = count;
  }

  onTabChange(tabValue: string) {
    this.activeTab = tabValue;
    if (this.gridApi) {
      this.gridApi.setColumnFilterModel('entityId', null);
      
      if (tabValue === 'Account' || tabValue === 'AP' || tabValue === 'IP') {
         // The column contains entityType information within the cellRenderer, 
         // but filtering is typically done on the data field itself. If we want standard Ag-Grid 
         // filtering by entityType, we should add it as a hidden field or value getter.
         // Let's manually apply custom logic for filtering the dataset:
         this.applyFilters();
      } else {
         this.applyFilters();
      }
    }
  }

  // Manual fallback filter if Ag-Grid doesn't have the entityType column directly filterable.
  applyFilters() {
     let filtered = [...this.summaries];
     
     if (this.activeTab !== 'all') {
         filtered = filtered.filter(s => s.entityType === this.activeTab);
     }
     
     // Quick filter text search is handled by app-ag-grid-wrapper input directly
     // So we just update the filteredSummaries for custom structural changes OR 
     // delegate entirely to ag-Grid wrapper. In our case, passing filteredSummaries to 
     // the grid component is fine.
     this.filteredSummaries = filtered;
     
     // Note: if you want the grid's native filtering, ensure 'entityType' is a column definition. 
     // For now, we update the data binding:
     this.calculateActiveFilters();
  }

  onSearchChange(searchText: string) {
    this.quickFilterText = searchText;
    this.searchQuery = searchText; // keep legacy behavior
    this.calculateActiveFilters();
  }

  onClearFilters() {
    this.activeTab = 'all';
    this.quickFilterText = '';
    this.searchQuery = '';
    this.applyFilters(); // Reset the data view
  }

  openImportDialog() {
    const dialogRef = this.dialog.open(FileImportDialogComponent, {
      width: '450px',
      data: {
        title: 'Import Approval Data',
        subtitle: 'Upload a JSON or PDF file to extract approval request information.',
        onUpload: (file: File) => {
          return new Promise<void>((resolve, reject) => {
            this.approvalService.importApprovalFile(file).subscribe({
              next: (res) => {
                this.approvalService.applyApprovals(res.extractedRequests).subscribe(() => {
                  this.loadData();
                  resolve();
                });
              },
              error: (err) => reject(err)
            });
          });
        }
      },
      panelClass: 'modern-dialog'
    });
  }

  openDeviceDetails(summary: EntityApprovalSummary) {
    this.selectedDevice = summary;
    this.drawerOpen = true;
  }

  closeDrawer() {
    this.drawerOpen = false;
    setTimeout(() => this.selectedDevice = null, 300); // Wait for transition
  }
}
