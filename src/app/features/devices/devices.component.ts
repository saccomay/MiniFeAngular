import { Component, inject, effect } from '@angular/core';
import { DevicesService, Device } from './devices.service';
import { AgGridWrapperComponent } from '../../shared/components/ag-grid-wrapper/ag-grid-wrapper.component';
import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, RowClickedEvent } from 'ag-grid-community';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatusCellRendererComponent } from '../../shared/components/custom-cells/status-cell-renderer/status-cell-renderer.component';
import { EditableCellRendererComponent } from '../../shared/components/custom-cells/editable-cell-renderer/editable-cell-renderer.component';
import { TableToolbarComponent, TabOption } from '../../shared/components/table-toolbar/table-toolbar.component';
import { AuthService } from '../../core/services/auth.service';
import { SkeletonLoadingOverlay } from '../../shared/components/custom-cells/skeleton-loading-overlay/skeleton-loading-overlay';
import { FileImportDialogComponent } from '../../shared/components/file-import-dialog/file-import-dialog.component';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [
    AgGridWrapperComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    TableToolbarComponent,
    SkeletonLoadingOverlay
  ],
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss', '../../shared/styles/table-page.scss']
})
export class DevicesComponent {
  devicesService = inject(DevicesService);
  snackBar = inject(MatSnackBar);
  authService = inject(AuthService);
  dialog = inject(MatDialog);

  private gridApi?: GridApi;

  /** Currently selected/clicked row */
  currentRowData: Device | null = null;

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
    effect(() => {
      const devices = this.devicesService.devicesResource.value();
      if (devices && this.gridApi) {
        this.updateTabCounts(devices);
      }
    });
  }

  // ─── Column definitions (all spec fields) ────────────────────────────────
  // job is sorted descending by default per spec
  columnDefs: ColDef<Device>[] = [
    { field: 'imei', headerName: 'IMEI' },
    { field: 'serial_farm', headerName: 'Farm Serial', editable: true, cellEditor: 'agTextCellEditor', cellRenderer: EditableCellRendererComponent },
    { field: 'model', headerName: 'Model' },
    { field: 'host', headerName: 'Host' },
    { field: 'note', headerName: 'Note', editable: true, cellEditor: 'agLargeTextCellEditor', cellEditorParams: { maxLength: 1000, rows: 5, cols: 60 }, cellRenderer: EditableCellRendererComponent },
    { field: 'label', headerName: 'Label' },
    { field: 'serial', headerName: 'Serial', pinned: 'left' },
    { field: 'job', headerName: 'Job', cellRenderer: StatusCellRendererComponent, sort: 'desc' },
    { field: 'inventory', headerName: 'Inventory' },
    { field: 'url', headerName: 'URL' },
    { field: 'job_status', headerName: 'Job Status', cellRenderer: StatusCellRendererComponent },
    { field: 'circuit_serial', headerName: 'Circuit Serial' },
    { field: 'hardware', headerName: 'Hardware' },
    { field: 'borrowed_date', headerName: 'Borrowed Date' },
    { field: 'return_date', headerName: 'Return Date' },
    { field: 'adb', headerName: 'ADB Status', cellRenderer: StatusCellRendererComponent },
    { field: 'comment', headerName: 'Comment' },
    { field: 'owner', headerName: 'Owner', pinned: 'right' },
    { field: 'create_time', headerName: 'Created' },
    { field: 'update_time', headerName: 'Updated' },
    // hidden — used for tab filtering only
    { field: 'node' as any, headerName: 'Node', hide: true }
  ];

  // ─── Toolbar actions ─────────────────────────────────────────────────────

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

  openImportDialog() {
    const dialogRef = this.dialog.open(FileImportDialogComponent, {
      width: '500px',
      data: { title: 'Import Devices', accept: '.txt' },
      panelClass: 'custom-dialog-container',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(async (file: File | null) => {
      if (file) {
        try {
          await this.devicesService.importDevices(file);
          this.snackBar.open('Import successful', 'Close', { duration: 3000 });
          this.reload();
        } catch (e) {
          this.snackBar.open('Import failed', 'Close', { duration: 3000 });
        }
      }
    });
  }

  exportSelected() {
    if (!this.gridApi) return;
    this.gridApi.exportDataAsCsv({ onlySelected: true });
  }

  // ─── Grid events ─────────────────────────────────────────────────────────

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;

    const devices = this.devicesService.devicesResource.value();
    if (devices) {
      this.updateTabCounts(devices);
    }

    this.gridApi.addEventListener('filterChanged', () => {
      this.calculateActiveFilters();
    });
  }

  /** Row click → sets currentRowData */
  onRowClicked(event: RowClickedEvent<Device>) {
    this.currentRowData = event.data ?? null;
  }

  /**
   * Inline cell edit completed.
   * Only note and serial_farm are editable per spec → call PUT update API.
   */
  async onCellValueChanged(event: CellValueChangedEvent<Device>) {
    const editableFields = ['note', 'serial_farm'];
    if (!editableFields.includes(event.colDef.field ?? '')) return;

    const serial = event.data?.serial;
    if (!serial) return;

    try {
      await this.devicesService.updateDevice(serial, { [event.colDef.field!]: event.newValue });
      this.snackBar.open('✓ Cập nhật thành công!', 'Đóng', { duration: 2500, panelClass: 'snack-success' });
    } catch (e) {
      this.snackBar.open('✕ Cập nhật thất bại', 'Đóng', { duration: 3000, panelClass: 'snack-error' });
      // Revert cell value on failure
      event.node.setDataValue(event.colDef.field!, event.oldValue);
    }
  }

  // ─── Tab / filter helpers ─────────────────────────────────────────────────

  updateTabCounts(devices: Device[]) {
    const allCount = devices.length;
    const runningCount = devices.filter(d => d.job === 'Running').length;
    const auditCount = devices.filter(d => d.node === null || d.node === undefined).length;
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
    this.activeFilterCount = count;
  }

  onTabChange(tabValue: string) {
    this.activeTab = tabValue;
    if (this.gridApi) {
      this.gridApi.setColumnFilterModel('job', null);
      this.gridApi.setColumnFilterModel('adb', null);
      this.gridApi.setColumnFilterModel('node', null);

      if (tabValue === 'running') {
        this.gridApi.setColumnFilterModel('job', { type: 'equals', filter: 'Running' })
          .then(() => this.gridApi?.onFilterChanged());
      } else if (tabValue === 'audit') {
        this.gridApi.setColumnFilterModel('node', { type: 'blank' })
          .then(() => this.gridApi?.onFilterChanged());
      } else if (tabValue === 'adb-not-found') {
        this.gridApi.setColumnFilterModel('adb', { type: 'blank' })
          .then(() => this.gridApi?.onFilterChanged());
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
        this.gridApi.setColumnFilterModel('owner', { type: 'contains', filter: currentUser })
          .then(() => this.gridApi?.onFilterChanged());
      } else {
        this.gridApi.setColumnFilterModel('owner', null)
          .then(() => this.gridApi?.onFilterChanged());
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
