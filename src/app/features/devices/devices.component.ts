import { Component, inject } from '@angular/core';
import { DevicesService, Device } from './devices.service';
import { AgGridWrapperComponent } from '../../shared/components/ag-grid-wrapper/ag-grid-wrapper.component';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TableToolbarComponent, TabOption } from '../../shared/components/table-toolbar/table-toolbar.component';
import { AuthService } from '../../core/services/auth.service';
import { effect } from '@angular/core';

import { SkeletonLoadingOverlay } from '../../shared/components/custom-cells/skeleton-loading-overlay/skeleton-loading-overlay';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [AgGridWrapperComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TableToolbarComponent, SkeletonLoadingOverlay],
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss', '../../shared/styles/table-page.scss']
})
export class DevicesComponent {
  devicesService = inject(DevicesService);
  snackBar = inject(MatSnackBar);
  authService = inject(AuthService);

  private gridApi?: GridApi;

  tabs: TabOption[] = [
    { value: 'all', label: 'All', count: 0 },
    { value: 'running', label: 'Running', color: '#3B82F6', count: 0 },
    { value: 'audit', label: 'Audit', color: '#F59E0B', count: 0 },
    { value: 'adb-not-found', label: 'adb error', color: '#EF4444', count: 0 }
  ];
  activeTab = 'all';
  quickFilterText = '';
  onlyMeActive = false;
  activeFilterCount = 0;

  constructor() {
    // Whenever devices data changes, update our tab counts if grid is ready
    effect(() => {
      const devices = this.devicesService.devicesResource.value();
      if (devices && this.gridApi) {
        this.updateTabCounts(devices);
      }
    });
  }

  columnDefs: ColDef<Device>[] = [
    { field: 'serial', headerName: 'Serial', pinned: 'left' },
    { field: 'model', headerName: 'Model' },
    { field: 'owner', headerName: 'Owner' },
    { field: 'job', headerName: 'Job' },
    { field: 'adb', headerName: 'ADB Status' },
    { field: 'note', headerName: 'Note', editable: true, cellEditor: 'agTextCellEditor' },
    { field: 'serial_farm', headerName: 'Farm Serial', editable: true },
    { field: 'host', headerName: 'Host' },
    { field: 'node' as any, headerName: 'Node', hide: true } // hidden column for filtering
  ];

  reload() {
    this.devicesService.devicesResource.reload();
  }

  async deepUpdate() {
    try {
      await this.devicesService.deepUpdate();
      this.snackBar.open('Deep update started', 'Close', { duration: 3000 });
      this.reload();
    } catch (e) {
      this.snackBar.open('Deep update failed', 'Close', { duration: 3000 });
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        await this.devicesService.importDevices(file);
        this.snackBar.open('Import successful', 'Close', { duration: 3000 });
        this.reload();
      } catch (e) {
        this.snackBar.open('Import failed', 'Close', { duration: 3000 });
      }
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;

    // Initial count update
    const devices = this.devicesService.devicesResource.value();
    if (devices) {
      this.updateTabCounts(devices);
    }

    // Listen to filter changes to update the active filter count
    this.gridApi.addEventListener('filterChanged', () => {
      this.calculateActiveFilters();
    });
  }

  updateTabCounts(devices: Device[]) {
    // Calculate counts for tabs
    const allCount = devices.length;
    const runningCount = devices.filter(d => d.job === 'Running').length;

    // audit implies node is null or undefined
    const auditCount = devices.filter(d => d.node === null || d.node === undefined).length;

    // adb-not-found implies blank adb (null, undefined, empty)
    const adbNotFoundCount = devices.filter(d => !d.adb || d.adb.trim() === '').length;

    this.tabs = this.tabs.map(tab => {
      if (tab.value === 'all') return { ...tab, count: allCount };
      if (tab.value === 'running') return { ...tab, count: runningCount };
      if (tab.value === 'audit') return { ...tab, count: auditCount };
      if (tab.value === 'adb-not-found') return { ...tab, count: adbNotFoundCount };
      return tab;
    });
  }

  calculateActiveFilters() {
    let count = 0;
    if (this.activeTab !== 'all') count++;
    if (this.quickFilterText.trim() !== '') count++;
    if (this.onlyMeActive) count++;
    // We could inspect gridApi.getFilterModel() deeply if there were other filters, 
    // but the toolbar is directly driving these 3 main filters for now.
    this.activeFilterCount = count;
  }

  onTabChange(tabValue: string) {
    this.activeTab = tabValue;
    if (this.gridApi) {
      // Clear dependent columns first
      this.gridApi.setColumnFilterModel('job', null);
      this.gridApi.setColumnFilterModel('adb', null);
      this.gridApi.setColumnFilterModel('node', null);

      if (tabValue === 'running') {
        this.gridApi.setColumnFilterModel('job', { type: 'equals', filter: 'Running' }).then(() => this.gridApi?.onFilterChanged());
      } else if (tabValue === 'audit') {
        this.gridApi.setColumnFilterModel('node', { type: 'blank' }).then(() => this.gridApi?.onFilterChanged());
      } else if (tabValue === 'adb-not-found') {
        this.gridApi.setColumnFilterModel('adb', { type: 'blank' }).then(() => this.gridApi?.onFilterChanged());
      } else {
        this.gridApi.onFilterChanged();
      }
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
      this.gridApi.setFilterModel(null); // clears all column filters
      this.gridApi.onFilterChanged(); // re-evaluates
    }
  }
}
