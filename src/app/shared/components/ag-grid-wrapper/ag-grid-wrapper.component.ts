import { Component, Input, Output, EventEmitter, effect, inject, viewChild, computed } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridReadyEvent, ModuleRegistry, themeQuartz, colorSchemeDark } from 'ag-grid-community'; // Verify imports
import { ThemeService } from '../../../core/services/theme.service';
import { SkeletonLoadingOverlay } from '../custom-cells/skeleton-loading-overlay/skeleton-loading-overlay';

@Component({
  selector: 'app-ag-grid-wrapper',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './ag-grid-wrapper.component.html',
  styleUrl: './ag-grid-wrapper.component.scss'
})
export class AgGridWrapperComponent {
  themeService = inject(ThemeService);

  @Input() rowData: any[] = [];
  @Input() columnDefs: ColDef[] = [];
  @Input() fitColumns: boolean = true;
  @Input() quickFilterText: string = '';
  @Output() gridReady = new EventEmitter<GridReadyEvent>();

  get defaultColDef(): ColDef {
    return {
      sortable: true,
      filter: true,
      resizable: true,
      flex: this.fitColumns ? 1 : 0,
      width: this.fitColumns ? undefined : 150,
      minWidth: 100
    };
  }

  private gridApi: any;

  // Computed gridOptions to handle theme changes
  gridOptions = computed<GridOptions>(() => {
    const isDark = this.themeService.theme() === 'dark';
    return {
      theme: isDark ? themeQuartz.withPart(colorSchemeDark) : themeQuartz,
      loadingOverlayComponent: SkeletonLoadingOverlay
    };
  });

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      if (this.gridApi) {
        const newTheme = theme === 'dark' ? themeQuartz.withPart(colorSchemeDark) : themeQuartz;
        this.gridApi.setGridOption('theme', newTheme);
      }
    });

    effect(() => {
      console.log('AgGridWrapper rowData changed:', this.rowData?.length);
    });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    if (this.fitColumns) {
      this.gridApi.sizeColumnsToFit();
    }
    this.gridReady.emit(params);
  }
}
