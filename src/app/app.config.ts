import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

// Register AG Grid Modules
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

// Register AG Charts Modules
import { AgCharts, AllCommunityModule as AllChartsCommunityModule } from 'ag-charts-community';
// AgCharts.registerModules is the correct API for charts usually, or ModuleRegistry from charts package.
// Let's try AgCharts.registerModules if it exists, or ModuleRegistry from charts.
// The error said "Call ModuleRegistry.registerModules(...)".
// If I use ModuleRegistry from grid, it might not work for charts if they are separate instances/versions.
// Let's import ModuleRegistry from charts.
import { ModuleRegistry as ChartsModuleRegistry } from 'ag-charts-community';
ChartsModuleRegistry.registerModules([AllChartsCommunityModule]);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideAnimationsAsync(),
    provideHttpClient()
  ]
};
