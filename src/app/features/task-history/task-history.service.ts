import { Injectable, resource, inject } from '@angular/core';
import { firstValueFrom, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface TaskHistory {
    _id: string;
    create_time: string;
    task_name: string;
    task_status: string;
    harvester: string;
    model: string;
    os: string;
    android_serial: string;
    ssid: string;
    url: string;
    ip: string;
    mac: string;
    ts_user: string;
    domains_blocked: string[];
    end_time: string;
}

@Injectable({
    providedIn: 'root'
})
export class TaskHistoryService {
    private http = inject(HttpClient);

    readonly historyResource = resource({
        loader: () => {
            if (environment.useMock) {
                const mockData: TaskHistory[] = Array.from({ length: 50 }).map((_, i) => ({
                    _id: `task-${i}`,
                    create_time: new Date().toISOString(),
                    task_name: `Task ${i}`,
                    task_status: i % 4 === 0 ? 'Failed' : 'Success',
                    harvester: `Harvester ${i % 3}`,
                    model: 'Pixel 8',
                    os: 'Android 14',
                    android_serial: `SERIAL${i}`,
                    ssid: 'WiFi-Guest',
                    url: 'http://task/1',
                    ip: `10.0.0.${i}`,
                    mac: `00:00:00:00:00:${i}`,
                    ts_user: 'admin',
                    domains_blocked: i % 5 === 0 ? ['google.com', 'facebook.com'] : [],
                    end_time: new Date().toISOString()
                }));
                return firstValueFrom(of(mockData).pipe(delay(700)));
            } else {
                return firstValueFrom(this.http.get<TaskHistory[]>(`${environment.apiUrl}/mini/taskhistory_mini/list`));
            }
        }
    });

    async deepUpdate() {
        if (environment.useMock) {
            await firstValueFrom(of(true).pipe(delay(800)));
            return true;
        } else {
            return firstValueFrom(this.http.put(`${environment.apiUrl}/mini/taskhistory_mini/deep_update`, {}));
        }
    }

    async deepInsert() {
        if (environment.useMock) {
            await firstValueFrom(of(true).pipe(delay(800)));
            return true;
        } else {
            return firstValueFrom(this.http.post(`${environment.apiUrl}/mini/taskhistory_mini/deep_insert`, {}));
        }
    }

    async downloadSnapshot() {
        if (environment.useMock) {
            // Simulate download
            console.log('Downloading snapshot...');
            await firstValueFrom(of(true).pipe(delay(500)));
        } else {
            // Trigger download logic or redirect
            window.open(`${environment.apiUrl}/mini/taskhistory_mini/download_task_history`, '_blank');
        }
    }
}
