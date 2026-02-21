import { Component, Input, effect, inject } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import { AgChartOptions } from 'ag-charts-community';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
    selector: 'app-chart-wrapper',
    standalone: true,
    imports: [AgCharts],
    templateUrl: './chart-wrapper.component.html',
    styleUrl: './chart-wrapper.component.scss'
})
export class ChartWrapperComponent {
    themeService = inject(ThemeService);

    @Input() set options(value: AgChartOptions) {
        this._options = value;
        this.updateTheme();
    }

    _options: AgChartOptions = {};
    chartOptions: AgChartOptions = {};

    constructor() {
        effect(() => {
            this.themeService.theme(); // dependency
            this.updateTheme();
        });
    }

    updateTheme() {
        const isDark = this.themeService.theme() === 'dark';
        this.chartOptions = {
            ...this._options,
            theme: isDark ? 'ag-default-dark' : 'ag-default',
            // Ensure background matches or is transparent
            background: { visible: false }
        };
    }
}
