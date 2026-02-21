import { Component, inject, viewChild, TemplateRef } from '@angular/core';
import { TaskHistoryService, TaskHistory } from './task-history.service';
import { AgGridWrapperComponent } from '../../shared/components/ag-grid-wrapper/ag-grid-wrapper.component';
import { ColDef, ICellRendererParams, GridApi, GridReadyEvent } from 'ag-grid-community';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { TableToolbarComponent, TabOption } from '../../shared/components/table-toolbar/table-toolbar.component';
import { AuthService } from '../../core/services/auth.service';
import { effect } from '@angular/core';

import { SkeletonLoadingOverlay } from '../../shared/components/custom-cells/skeleton-loading-overlay/skeleton-loading-overlay';

@Component({
  selector: 'app-task-history',
  standalone: true,
  imports: [AgGridWrapperComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule, CommonModule, TableToolbarComponent, SkeletonLoadingOverlay],
  templateUrl: './task-history.component.html',
  styleUrls: ['./task-history.component.scss', '../../shared/styles/table-page.scss']
})
export class TaskHistoryComponent {
  taskHistoryService = inject(TaskHistoryService);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  authService = inject(AuthService);

  private gridApi?: GridApi;

  tabs: TabOption[] = [
    { value: 'all', label: 'All', count: 0 },
    { value: 'Success', label: 'Success', color: '#22C55E', count: 0 },
    { value: 'Failed', label: 'Failed', color: '#FF5630', count: 0 }
  ];
  activeTab = 'all';
  quickFilterText = '';
  onlyMeActive = false;
  activeFilterCount = 0;

  constructor() {
    effect(() => {
      const history = this.taskHistoryService.historyResource.value();
      if (history && this.gridApi) {
        this.updateTabCounts(history);
      }
    });
  }

  domainsDialogTpl = viewChild.required<TemplateRef<any>>('domainsDialog');

  columnDefs: ColDef<TaskHistory>[] = [
    { field: 'create_time', headerName: 'Created At', sort: 'desc' },
    { field: 'task_name', headerName: 'Task Name' },
    { field: 'task_status', headerName: 'Status' },
    {
      field: 'domains_blocked', headerName: 'Blocked Domains',
      cellRenderer: (params: ICellRendererParams) => {
        if (params.value && params.value.length > 0) {
          return `<button class="domains-btn" style="cursor: pointer; color: blue; text-decoration: underline; background: none; border: none; padding: 0;">${params.value.length} Domains</button>`;
        }
        return '0';
      },
      onCellClicked: (params: any) => {
        if (params.value && params.value.length > 0) {
          this.openDomainsDialog(params.value);
        }
      }
    },
    { field: 'harvester', headerName: 'Harvester' },
    { field: 'model', headerName: 'Model' }
  ];

  reload() {
    this.taskHistoryService.historyResource.reload();
  }

  async deepUpdate() {
    await this.taskHistoryService.deepUpdate();
    this.snackBar.open('Deep update started', 'Close', { duration: 3000 });
    this.reload();
  }

  async deepInsert() {
    await this.taskHistoryService.deepInsert();
    this.snackBar.open('Deep insert started', 'Close', { duration: 3000 });
    this.reload();
  }

  downloadSnapshot() {
    this.taskHistoryService.downloadSnapshot();
  }

  openDomainsDialog(domains: string[]) {
    this.dialog.open(this.domainsDialogTpl(), {
      data: { domains: domains }
    });
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
