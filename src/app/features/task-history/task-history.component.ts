import { Component, inject, viewChild, TemplateRef, signal } from '@angular/core';
import { TaskHistoryService, TaskHistory } from './task-history.service';
import { AgGridWrapperComponent } from '../../shared/components/ag-grid-wrapper/ag-grid-wrapper.component';
import {
  ColDef, ICellRendererParams, GridApi, GridReadyEvent,
  SelectionChangedEvent, ValueGetterParams
} from 'ag-grid-community';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { StatusCellRendererComponent } from '../../shared/components/custom-cells/status-cell-renderer/status-cell-renderer.component';
import { TableToolbarComponent, TabOption } from '../../shared/components/table-toolbar/table-toolbar.component';
import { AuthService } from '../../core/services/auth.service';
import { effect } from '@angular/core';
import { SkeletonLoadingOverlay } from '../../shared/components/custom-cells/skeleton-loading-overlay/skeleton-loading-overlay';

@Component({
  selector: 'app-task-history',
  standalone: true,
  imports: [
    AgGridWrapperComponent, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDialogModule, CommonModule,
    TableToolbarComponent, SkeletonLoadingOverlay, StatusCellRendererComponent
  ],
  templateUrl: './task-history.component.html',
  styleUrls: ['./task-history.component.scss', '../../shared/styles/table-page.scss']
})
export class TaskHistoryComponent {
  taskHistoryService = inject(TaskHistoryService);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  authService = inject(AuthService);

  private gridApi?: GridApi;
  private domainsGridApi?: GridApi;
  private activeDialogRef?: MatDialogRef<any>;

  selectedRows: TaskHistory[] = [];
  selectedDomainRows: { domain: string }[] = [];

  tabs: TabOption[] = [
    { value: 'all', label: 'All', count: 0 },
    { value: 'Success', label: 'Success', color: '#22C55E', count: 0 },
    { value: 'Failed', label: 'Failed', color: '#FF5630', count: 0 }
  ];
  activeTab = 'all';
  quickFilterText = '';
  onlyMeActive = false;
  activeFilterCount = 0;
  domainsBlockedFilterActive = false;

  constructor() {
    effect(() => {
      const history = this.taskHistoryService.historyResource.value();
      if (history && this.gridApi) {
        this.updateTabCounts(history);
      }
    });
  }

  domainsDialogTpl = viewChild.required<TemplateRef<any>>('domainsDialog');

  // Main table column definitions
  columnDefs: ColDef<TaskHistory>[] = [
    {
      field: '' as any,
      headerName: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 40,
      minWidth: 40,
      flex: 0,
      sortable: false,
      filter: false,
      floatingFilter: false,
      resizable: false,
      pinned: 'left',
    },
    {
      field: 'create_time', headerName: 'Created At', sort: 'desc',
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : ''
    },
    { field: 'end_time', headerName: 'End Time', valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : '' },
    { field: 'task_name', headerName: 'Task Name' },
    { field: 'task_status', headerName: 'Status', cellRenderer: StatusCellRendererComponent },
    { field: 'harvester', headerName: 'Harvester' },
    { field: 'model', headerName: 'Model' },
    { field: 'os', headerName: 'OS' },
    { field: 'android_serial', headerName: 'Android Serial' },
    { field: 'ssid', headerName: 'SSID' },
    { field: 'url', headerName: 'URL' },
    { field: 'ip', headerName: 'IP' },
    { field: 'mac', headerName: 'MAC' },
    { field: 'ts_user', headerName: 'User' },
    {
      field: 'domains_blocked',
      headerName: 'Domains Blocked',
      cellRenderer: (params: ICellRendererParams) => {
        if (params.value && params.value.length > 0) {
          return `<button class="domains-btn" style="cursor:pointer;color:#6366f1;text-decoration:underline;background:none;border:none;padding:0;">${params.value.length} Domain(s)</button>`;
        }
        return '<span style="color:#aaa;">None</span>';
      },
      onCellClicked: (params: any) => {
        if (params.value && params.value.length > 0) {
          this.openDomainsDialog(params.value, params.data);
        }
      },
      valueGetter: (params: ValueGetterParams<TaskHistory>) => {
        return params.data?.domains_blocked ?? [];
      },
      filterValueGetter: (params: ValueGetterParams<TaskHistory>) => {
        const blocked = params.data?.domains_blocked;
        return blocked && blocked.length > 0 ? `${blocked.length} Domains` : 'None';
      }
    }
  ];

  // Domains Blocked grid column definitions
  domainColumnDefs: ColDef[] = [
    {
      field: '' as any,
      headerName: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 40,
      minWidth: 40,
      flex: 0,
      sortable: false,
      filter: false,
      resizable: false,
    },
    {
      field: 'domain',
      headerName: 'Domain',
      filter: false,
      editable: true,
      sortable: true,
    }
  ];

  toggleDomainsBlockedFilter() {
    this.domainsBlockedFilterActive = !this.domainsBlockedFilterActive;
    if (this.gridApi) {
      this.gridApi.onFilterChanged();
    }
    this.calculateActiveFilters();
  }

  isExternalFilterPresent = (): boolean => {
    return this.domainsBlockedFilterActive;
  };

  doesExternalFilterPass = (node: any): boolean => {
    const domains = node.data?.domains_blocked;
    return Array.isArray(domains) && domains.length > 0;
  };

  reload() {
    this.taskHistoryService.historyResource.reload();
    this.selectedRows = [];
  }

  async deepUpdate() {
    try {
      const result: any = await this.taskHistoryService.deepUpdate();
      this.snackBar.open(result?.message || 'Deep update completed', 'Close', { duration: 3000 });
      this.reload();
    } catch {
      this.snackBar.open('Deep update failed', 'Close', { duration: 3000 });
    }
  }

  async deepInsert() {
    try {
      const result: any = await this.taskHistoryService.deepInsert();
      this.snackBar.open(result?.message || 'Deep insert completed', 'Close', { duration: 3000 });
      this.reload();
    } catch {
      this.snackBar.open('Deep insert failed', 'Close', { duration: 3000 });
    }
  }

  exportCsv() {
    this.gridApi?.exportDataAsCsv({
      onlySelected: this.selectedRows.length > 0
    });
  }

  openDomainsDialog(domains: string[], rowData?: TaskHistory) {
    const domainRows = domains.map(d => ({ domain: d }));
    this.activeDialogRef = this.dialog.open(this.domainsDialogTpl(), {
      data: { domainRows, rowData },
      width: '600px',
      maxHeight: '80vh'
    });
    this.selectedDomainRows = [];
  }

  onDomainsGridReady(params: GridReadyEvent) {
    this.domainsGridApi = params.api;
  }

  onDomainSelectionChanged(event: SelectionChangedEvent) {
    this.selectedDomainRows = this.domainsGridApi?.getSelectedRows() ?? [];
  }

  downloadSnapshot() {
    this.taskHistoryService.downloadSnapshot();
  }

  async allowDomains() {
    if (this.selectedDomainRows.length === 0) {
      this.snackBar.open('Please select at least one domain', 'Close', { duration: 3000 });
      return;
    }
    try {
      const result: any = await this.taskHistoryService.allowDomains(
        this.selectedDomainRows.map(r => r.domain)
      );
      this.snackBar.open(result?.message || 'Domains submitted for approval', 'Close', { duration: 4000 });
      this.activeDialogRef?.close();
    } catch {
      this.snackBar.open('Failed to submit domains', 'Close', { duration: 3000 });
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;

    const history = this.taskHistoryService.historyResource.value();
    if (history) {
      this.updateTabCounts(history);
    }

    this.gridApi.addEventListener('filterChanged', () => {
      this.calculateActiveFilters();
    });
  }

  onSelectionChanged(event: SelectionChangedEvent) {
    this.selectedRows = this.gridApi?.getSelectedRows() ?? [];
  }

  updateTabCounts(history: TaskHistory[]) {
    const allCount = history.length;
    const successCount = history.filter(h => h.task_status === 'Success').length;
    const failedCount = history.filter(h => h.task_status === 'Failed').length;

    this.tabs = this.tabs.map(tab => {
      if (tab.value === 'all') return { ...tab, count: allCount };
      if (tab.value === 'Success') return { ...tab, count: successCount };
      if (tab.value === 'Failed') return { ...tab, count: failedCount };
      return tab;
    });
  }

  calculateActiveFilters() {
    let count = 0;
    if (this.activeTab !== 'all') count++;
    if (this.quickFilterText.trim() !== '') count++;
    if (this.onlyMeActive) count++;
    if (this.domainsBlockedFilterActive) count++;
    this.activeFilterCount = count;
  }

  onTabChange(tabValue: string) {
    this.activeTab = tabValue;
    if (this.gridApi) {
      this.gridApi.setColumnFilterModel('task_status', tabValue === 'all' ? null : { type: 'equals', filter: tabValue }).then(() => {
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
        this.gridApi.setColumnFilterModel('ts_user', {
          type: 'contains',
          filter: currentUser
        }).then(() => this.gridApi?.onFilterChanged());
      } else {
        this.gridApi.setColumnFilterModel('ts_user', null).then(() => this.gridApi?.onFilterChanged());
      }
    }
  }

  onClearFilters() {
    this.activeTab = 'all';
    this.quickFilterText = '';
    this.onlyMeActive = false;
    this.domainsBlockedFilterActive = false;

    if (this.gridApi) {
      this.gridApi.setFilterModel(null);
      this.gridApi.onFilterChanged();
    }
  }
}
