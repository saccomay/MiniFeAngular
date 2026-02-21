import { Component, inject } from '@angular/core';
import { ProblemsService, Problem } from './problems.service';
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
  selector: 'app-problems',
  standalone: true,
  imports: [AgGridWrapperComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TableToolbarComponent, SkeletonLoadingOverlay],
  templateUrl: './problems.component.html',
  styleUrls: ['./problems.component.scss', '../../shared/styles/table-page.scss']
})
export class ProblemsComponent {
  problemsService = inject(ProblemsService);
  snackBar = inject(MatSnackBar);
  authService = inject(AuthService);

  private gridApi?: GridApi;

  tabs: TabOption[] = [
    { value: 'all', label: 'All', count: 0 },
    { value: 'Pending', label: 'Pending', color: '#F59E0B', count: 0 },
    { value: 'Resolved', label: 'Resolved', color: '#22C55E', count: 0 },
    { value: 'Ignored', label: 'Ignored', color: '#637381', count: 0 }
  ];
  activeTab = 'all';
  quickFilterText = '';
  onlyMeActive = false;
  activeFilterCount = 0;

  constructor() {
    effect(() => {
      const problems = this.problemsService.problemsResource.value();
      if (problems && this.gridApi) {
        this.updateTabCounts(problems);
      }
    });
  }

  columnDefs: ColDef<Problem>[] = [
    { field: 'issue_time', headerName: 'Time' },
    { field: 'server', headerName: 'Server' },
    { field: 'task_name', headerName: 'Task' },
    { field: 'issue_message', headerName: 'Message', flex: 2 },
    { field: 'note', headerName: 'Note', editable: true, cellEditor: 'agTextCellEditor' },
    {
      field: 'status', headerName: 'Status', editable: true, cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['Pending', 'Resolved', 'Ignored'] }
    },
    { field: 'owner', headerName: 'Owner' },
    { colId: 'device', headerName: 'Device', valueGetter: (p: any) => p.data ? `${p.data.model} (${p.data.serial})` : '' }
  ];

  reload() {
    this.problemsService.problemsResource.reload();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;

    const problems = this.problemsService.problemsResource.value();
    if (problems) {
      this.updateTabCounts(problems);
    }

    this.gridApi.addEventListener('filterChanged', () => {
      this.calculateActiveFilters();
    });
  }

  updateTabCounts(problems: Problem[]) {
    const allCount = problems.length;
    const pendingCount = problems.filter(p => p.status === 'Pending').length;
    const resolvedCount = problems.filter(p => p.status === 'Resolved').length;
    const ignoredCount = problems.filter(p => p.status === 'Ignored').length;

    this.tabs = this.tabs.map(tab => {
      if (tab.value === 'all') return { ...tab, count: allCount };
      if (tab.value === 'Pending') return { ...tab, count: pendingCount };
      if (tab.value === 'Resolved') return { ...tab, count: resolvedCount };
      if (tab.value === 'Ignored') return { ...tab, count: ignoredCount };
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
      this.gridApi.setColumnFilterModel('status', tabValue === 'all' ? null : { type: 'equals', filter: tabValue }).then(() => {
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
