import { Injectable, resource, inject } from '@angular/core';
import { firstValueFrom, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface DashboardStats {
    deviceOwnership: { owner: string; total: number; problem: number }[];
    pendingProblems: { owner: string; count: number }[];
    activeHosts: number;
    activeDevices: number;
    activeUsers: number;
    pluginCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);

    // rxResource for fetching dashboard stats
    readonly statsResource = resource({
        loader: () => {
            if (environment.useMock) {
                // Mock data response
                const mockData: DashboardStats = {
                    deviceOwnership: [
                        { owner: 'Team A', total: 150, problem: 5 },
                        { owner: 'Team B', total: 120, problem: 12 },
                        { owner: 'Team C', total: 80, problem: 0 },
                        { owner: 'Team D', total: 200, problem: 25 },
                    ],
                    pendingProblems: [
                        { owner: 'Team A', count: 2 },
                        { owner: 'Team B', count: 8 },
                        { owner: 'Team D', count: 15 },
                    ],
                    activeHosts: 714,
                    activeDevices: 135,
                    activeUsers: 17200,
                    pluginCount: 234
                };
                // Simulate network delay
                return firstValueFrom(of(mockData).pipe(delay(800)));
            } else {
                // Real API call
                return firstValueFrom(this.http.get<DashboardStats>(`${environment.apiUrl}/mini/statistic_mini/summary`));
            }
        }
    });
}
