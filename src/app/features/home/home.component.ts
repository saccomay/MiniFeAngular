import { Component, inject, computed } from '@angular/core';
import { DashboardService } from './dashboard.service';
import { ChartWrapperComponent } from '../../shared/components/chart-wrapper/chart-wrapper.component';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { AgChartOptions } from 'ag-charts-community';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToolCardComponent } from '../../shared/components/tool-card/tool-card.component';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        ChartWrapperComponent,
        StatsCardComponent,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        ToolCardComponent
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {
    dashboardService = inject(DashboardService);

    constructor() {
        console.log('HomeComponent loaded');
        console.log('Stats:', this.dashboardService.statsResource.value());
    }

    activeHosts = computed(() => this.dashboardService.statsResource.value()?.activeHosts ?? 0);
    activeDevices = computed(() => this.dashboardService.statsResource.value()?.activeDevices ?? 0);
    activeUsers = computed(() => this.dashboardService.statsResource.value()?.activeUsers ?? 0);
    pluginCount = computed(() => this.dashboardService.statsResource.value()?.pluginCount ?? 0);

    tools = [
        {
            name: 'Zabbix',
            icon: 'monitor_heart',
            description: 'Enterprise-class open source distributed monitoring solution.',
            link: 'https://www.zabbix.com/',
            repo: 'https://github.com/zabbix/zabbix',
            logoUrl: 'https://assets.zabbix.com/img/logo/zabbix_logo_500x131.png'
        },
        {
            name: 'Kong Gateway',
            icon: 'dns',
            description: 'The world\'s most popular open source API gateway.',
            link: 'https://konghq.com/products/kong-gateway',
            repo: 'https://github.com/Kong/kong',
            logoUrl: 'https://2.bp.blogspot.com/-2K8eKuyX8Is/XW7t6NvnHCI/AAAAAAAAAAs/Z-iX0oxJI1M6w-N-cO2l56jO-TJOtQaMwCK4BGAYYCw/s1600/Kong%2BLogo.png'
        },
        {
            name: 'Swagger',
            icon: 'api',
            description: 'Simplify API development for users, teams, and enterprises.',
            link: 'https://swagger.io/',
            repo: 'https://github.com/swagger-api',
            logoUrl: 'https://static1.smartbear.co/swagger/media/assets/images/swagger_logo.svg'
        },
        {
            name: 'Semaphore',
            icon: 'settings_ethernet',
            description: 'Modern UI for Ansible, Terraform, and other DevOps tools.',
            link: 'https://semaphoreui.com/',
            repo: 'https://github.com/semaphoreui/semaphore',
            logoUrl: '' // Fallback to icon
        },
        {
            name: 'Farmer Center',
            icon: 'agriculture',
            description: 'Centralized job automation and resource management.',
            link: '#',
            repo: 'https://github.com',
            logoUrl: '' // Fallback to icon
        },
    ];

    deviceChartOptions = computed<AgChartOptions>(() => {
        const data = this.dashboardService.statsResource.value()?.deviceOwnership || [];
        return {
            data: data,
            theme: {
                baseTheme: 'ag-material',
                palette: {
                    fills: ['#1890FF', '#FF4842'],
                    strokes: ['#1890FF', '#FF4842'],
                },
                overrides: {
                    bar: {
                        series: {
                            strokeWidth: 0,
                            highlightStyle: {
                                item: {
                                    fillOpacity: 0.8
                                }
                            }
                        }
                    }
                }
            },
            padding: {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
            },
            series: [
                {
                    type: 'bar',
                    direction: 'horizontal',
                    xKey: 'owner',
                    yKey: 'total',
                    yName: 'Total Devices',
                    stacked: true,
                    cornerRadius: 6,
                    fill: '#1890FF',
                    fillOpacity: 0.6,
                    strokeWidth: 0,
                },
                {
                    type: 'bar',
                    direction: 'horizontal',
                    xKey: 'owner',
                    yKey: 'problem',
                    yName: 'Problem Devices',
                    stacked: true,
                    cornerRadius: 6,
                    fill: '#FF4842', // Red
                    fillOpacity: 0.6,
                    strokeWidth: 0,
                }
            ],
            axes: [
                {
                    type: 'category',
                    position: 'left',
                    line: { width: 0 },
                    label: {
                        fontFamily: 'Public Sans, sans-serif',
                        color: '#637381',
                        fontSize: 12,
                    },
                    gridStyle: [{ stroke: undefined }]
                },
                {
                    type: 'number',
                    position: 'bottom',
                    line: { width: 0 },
                    label: {
                        fontFamily: 'Public Sans, sans-serif',
                        color: '#637381',
                        fontSize: 12,
                    },
                    gridStyle: [
                        {
                            stroke: '#919EAB',
                            lineDash: [3, 3],
                            opacity: 0.2
                        }
                    ]
                }
            ],
            legend: {
                position: 'bottom',
                item: {
                    label: {
                        fontFamily: 'Public Sans, sans-serif',
                        color: '#637381',
                        fontSize: 12,
                    },
                    marker: {
                        shape: 'circle',
                        size: 8,
                    }
                }
            }
        } as any;
    });

    problemsChartOptions = computed<AgChartOptions>(() => {
        const data = this.dashboardService.statsResource.value()?.pendingProblems || [];
        return {
            data: data,
            theme: {
                baseTheme: 'ag-material',
                palette: {
                    fills: ['#FFAB00'],
                    strokes: ['#FFAB00'],
                },
                overrides: {
                    bar: {
                        series: {
                            strokeWidth: 0,
                            highlightStyle: {
                                item: {
                                    fillOpacity: 0.6
                                }
                            }
                        }
                    }
                }
            },
            padding: {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
            },
            series: [{
                type: 'bar',
                xKey: 'owner',
                yKey: 'count',
                yName: 'Pending Problems',
                cornerRadius: 8,
                fill: '#FFAB00',
                fillOpacity: 0.6,
                strokeWidth: 0,
            }],
            axes: [
                {
                    type: 'category',
                    position: 'bottom',
                    line: { width: 0 },
                    label: {
                        fontFamily: 'Public Sans, sans-serif',
                        color: '#637381',
                        fontSize: 12,
                    },
                    gridStyle: [{ stroke: undefined }]
                },
                {
                    type: 'number',
                    position: 'left',
                    line: { width: 0 },
                    label: {
                        fontFamily: 'Public Sans, sans-serif',
                        color: '#637381',
                        fontSize: 12,
                    },
                    gridStyle: [
                        {
                            stroke: '#919EAB',
                            lineDash: [3, 3],
                            opacity: 0.2
                        }
                    ]
                }
            ],
            legend: {
                enabled: false
            }
        } as any;
    });
}

