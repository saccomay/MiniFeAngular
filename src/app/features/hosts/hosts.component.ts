import { Component, inject } from '@angular/core';
import { HostsService, Host } from './hosts.service';
import { AgGridWrapperComponent } from '../../shared/components/ag-grid-wrapper/ag-grid-wrapper.component';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatusCellRendererComponent } from '../../shared/components/custom-cells/status-cell-renderer/status-cell-renderer.component';
import { HostCellRendererComponent } from '../../shared/components/custom-cells/host-cell-renderer/host-cell-renderer.component';
import { HostActionsCellRendererComponent } from '../../shared/components/custom-cells/host-actions-cell-renderer/host-actions-cell-renderer.component';
import { ImageCellRendererComponent } from '../../shared/components/custom-cells/image-cell-renderer/image-cell-renderer.component';
import { TableToolbarComponent, TabOption } from '../../shared/components/table-toolbar/table-toolbar.component';
import { AuthService } from '../../core/services/auth.service';
import { effect } from '@angular/core';

import { SkeletonLoadingOverlay } from '../../shared/components/custom-cells/skeleton-loading-overlay/skeleton-loading-overlay';

@Component({
  selector: 'app-hosts',
  standalone: true,
  imports: [AgGridWrapperComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule, StatusCellRendererComponent, HostCellRendererComponent, HostActionsCellRendererComponent, ImageCellRendererComponent, TableToolbarComponent, SkeletonLoadingOverlay],
  templateUrl: './hosts.component.html',
  styleUrls: ['./hosts.component.scss', '../../shared/styles/table-page.scss']
})
export class HostsComponent {
  hostsService = inject(HostsService);
  snackBar = inject(MatSnackBar);
  authService = inject(AuthService);

  private gridApi?: GridApi;

  tabs: TabOption[] = [
    { value: 'all', label: 'All', count: 0 },
    { value: 'Active', label: 'Active', color: '#22C55E', count: 0 },
    { value: 'Inactive', label: 'Inactive', color: '#FF5630', count: 0 }
  ];
  activeTab = 'all';
  quickFilterText = '';
  onlyMeActive = false;
  activeFilterCount = 0;

  constructor() {
    effect(() => {
      const hosts = this.hostsService.hostsResource.value();
      if (hosts && this.gridApi) {
        this.updateTabCounts(hosts);
      }
    });
  }

  columnDefs: ColDef<Host>[] = [
    { field: 'asset_no', headerName: 'Asset No', pinned: 'left' },
    {
      colId: 'host_info',
      headerName: 'Host',
      cellRenderer: HostCellRendererComponent,
      minWidth: 250,
      flex: 1
    },
    { field: 'mac', headerName: 'MAC' }, // Assuming distinction from mac_address if present
    { field: 'serial', headerName: 'Serial' },
    { field: 'os', headerName: 'OS' },
    { field: 'comment', headerName: 'Comment', editable: true, flex: 2 },
    { field: 'jenkins_url', headerName: 'Jenkins URL' },
    { field: 'town_status', headerName: 'Town Status', cellRenderer: StatusCellRendererComponent },
    { field: 'zabbix_status', headerName: 'Zabbix Status', cellRenderer: StatusCellRendererComponent },
    { field: 'status', headerName: 'Status', cellRenderer: StatusCellRendererComponent },
    { field: 'owner', headerName: 'Owner', editable: true },
    { field: 'mac_address', headerName: 'MAC Address', editable: true },
    { field: 'asset_description', headerName: 'Asset Description' },
    { field: 'asset_name', headerName: 'Asset Name' },
    { field: 'model', headerName: 'Model' },
    { field: 'remark', headerName: 'Remark' },
    { field: 'other_info', headerName: 'Other Info' },
    { field: 'serial_hr._no' as any, headerName: 'Serial HR No' }, // Using dotted notation for nested access
    { field: 'pic', headerName: 'PIC' },
    { field: 'owner_hr', headerName: 'Owner HR' },
    { field: 'asset_type', headerName: 'Asset Type' },
    { field: 'building', headerName: 'Building' },
    { field: 'cd_no', headerName: 'CD No' },
    { field: 'cis', headerName: 'CIS' },
    { field: 'code', headerName: 'Code' },
    { field: 'class_code', headerName: 'Class Code' },
    { field: 'cdass_type', headerName: 'Cdass Type' },
    { field: 'contract', headerName: 'Contract' },
    { field: 'cost_center', headerName: 'Cost Center' },
    { field: 'cost_center_name', headerName: 'Cost Center Name' },
    { field: 'counted_id', headerName: 'Counted ID' },
    { field: 'floor', headerName: 'Floor' },
    { field: 'hs_code', headerName: 'HS Code' },
    { field: 'invoice', headerName: 'Invoice' },
    { field: 'last_count', headerName: 'Last Count' },
    // mac_address repeated in list, skipping duplicate if identical field
    { field: 'manufacturer', headerName: 'Manufacturer' },
    { field: 'nbv', headerName: 'NBV' },
    { field: 'origin', headerName: 'Origin' },
    { field: 'po_date', headerName: 'PO Date' },
    { field: 'po_no', headerName: 'PO No' },
    { field: 'qty', headerName: 'Qty' },
    { field: 'reason', headerName: 'Reason' },
    { field: 'request_solution', headerName: 'Request Solution' },
    { field: 'resp_cost_center', headerName: 'Resp Cost Center' },
    { field: 'resp_group', headerName: 'Resp Group' },
    { field: 'resp_team', headerName: 'Resp Team' },
    // status already added
    { field: 'updated_id', headerName: 'Updated ID' },
    { field: 'updated_time', headerName: 'Updated Time' },
    { field: 'vendor', headerName: 'Vendor' },
    { field: 'vietnamese_name', headerName: 'Vietnamese Name' },
    { field: 'create_time', headerName: 'Create Time' },
    { field: 'accounting_doc', headerName: 'Accounting Doc' },
    { field: 'acq_val', headerName: 'Acq Val' },
    { field: 'actual_solution', headerName: 'Actual Solution' },
    { field: 'area', headerName: 'Area' },
    {
      field: 'image_label',
      headerName: 'Image Label',
      cellRenderer: ImageCellRendererComponent,
      minWidth: 100
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      cellRenderer: HostActionsCellRendererComponent,
      pinned: 'right',
      minWidth: 120,
      suppressSizeToFit: true
    }
  ];

  reload() {
    this.hostsService.hostsResource.reload();
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        await this.hostsService.importHosts(file);
        this.snackBar.open('Import successful', 'Close', { duration: 3000 });
        this.reload();
      } catch (e) {
        this.snackBar.open('Import failed', 'Close', { duration: 3000 });
      }
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;

    const hosts = this.hostsService.hostsResource.value();
    if (hosts) {
      this.updateTabCounts(hosts);
    }

    this.gridApi.addEventListener('filterChanged', () => {
      this.calculateActiveFilters();
    });
  }

  updateTabCounts(hosts: Host[]) {
    const allCount = hosts.length;
    const activeCount = hosts.filter(h => h.town_status === 'Active').length;
    const inactiveCount = hosts.filter(h => h.town_status === 'Inactive').length;

    this.tabs = this.tabs.map(tab => {
      if (tab.value === 'all') return { ...tab, count: allCount };
      if (tab.value === 'Active') return { ...tab, count: activeCount };
      if (tab.value === 'Inactive') return { ...tab, count: inactiveCount };
      return tab;
    });
  }

  calculateActiveFilters() {
    let count = 0;
    if (this.activeTab !== 'all') count++;
    if (this.quickFilterText.trim() !== '') count++;
    if (this.onlyMeActive) count++;
    this.activeFilterCount = count;
  }

  onTabChange(tabValue: string) {
    this.activeTab = tabValue;
    if (this.gridApi) {
      this.gridApi.setColumnFilterModel('town_status', tabValue === 'all' ? null : { type: 'equals', filter: tabValue }).then(() => {
        this.gridApi?.onFilterChanged();
      });
    }
  }

  onSearchChange(searchText: string) {
    this.quickFilterText = searchText;
    this.calculateActiveFilters();
  }

  onOnlyMeChange(checked: boolean) {
    this.onlyMeActive = checked;
    if (this.gridApi) {
      const currentUser = this.authService.currentUser()?.username;

      if (checked && currentUser) {
        this.gridApi.setColumnFilterModel('owner', {
          type: 'contains',
          filter: currentUser
        }).then(() => this.gridApi?.onFilterChanged());
      } else {
        this.gridApi.setColumnFilterModel('owner', null).then(() => this.gridApi?.onFilterChanged());
      }
    }
  }

  onClearFilters() {
    this.activeTab = 'all';
    this.quickFilterText = '';
    this.onlyMeActive = false;

    if (this.gridApi) {
      this.gridApi.setFilterModel(null);
      this.gridApi.onFilterChanged();
    }
  }
}
