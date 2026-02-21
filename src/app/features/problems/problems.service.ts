import { Injectable, resource, inject } from '@angular/core';
import { firstValueFrom, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface Problem {
    _id: string;
    issue_time: string;
    server: string;
    task_name: string;
    issue_message: string;
    issue_url: string;
    note: string;
    job: string;
    model: string;
    farm_url: string;
    serial: string;
    os: string;
    qb_id: string;
    type: string;
    status: string;
    owner: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProblemsService {
    private http = inject(HttpClient);

    // rxResource for fetching problems
    readonly problemsResource = resource({
        loader: () => {
            if (environment.useMock) {
                // Mock data
                const mockData: Problem[] = Array.from({ length: 50 }).map((_, i) => ({
                    _id: `problem-${i}`,
                    issue_time: new Date().toISOString(),
                    server: `server-${i % 5}`,
                    task_name: `Task ${i}`,
                    issue_message: `Error in task ${i}`,
                    issue_url: `http://logs/issue/${i}`,
                    note: i % 2 === 0 ? 'Investigating' : '',
                    job: `job-${i}`,
                    model: 'Pixel 6',
                    farm_url: 'http://farm/1',
                    serial: `SERIAL${i}`,
                    os: 'Android 14',
                    qb_id: `qb-${i}`,
                    type: 'Infrastructure',
                    status: i % 3 === 0 ? 'Resolved' : 'Pending',
                    owner: i % 2 === 0 ? 'Team A' : 'Team B'
                }));
                return firstValueFrom(of(mockData).pipe(delay(600)));
            } else {
                return firstValueFrom(this.http.get<Problem[]>(`${environment.apiUrl}/mini/problems_mini/list`));
            }
        }
    });

    async updateProblem(id: string, data: Partial<Problem>) {
        if (environment.useMock) {
            console.log(`[Mock] Updating problem ${id}:`, data);
            await firstValueFrom(of(true).pipe(delay(300)));
            // In a real app with resource, we might invalidate/reload or optimistic update.
            // For now, we just log and return.
            return true;
        } else {
            return firstValueFrom(this.http.put(`${environment.apiUrl}/mini/problems_mini/update/id=${id}`, data));
        }
    }
}
