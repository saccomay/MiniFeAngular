import { Injectable, resource, inject } from '@angular/core';
import { firstValueFrom, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface Device {
    _id: string;
    imei: string;
    serial_farm: string;
    model: string;
    host: string;
    note: string;
    label: string;
    serial: string;
    job: string;
    inventory: string;
    url: string;
    job_status: string;
    circuit_serial: string;
    hardware: string;
    borrowed_date: string;
    return_date: string;
    adb: string;
    comment: string;
    owner: string;
    create_time: string;
    update_time: string;
    node?: string;
}

@Injectable({
    providedIn: 'root'
})
export class DevicesService {
    private http = inject(HttpClient);

    readonly devicesResource = resource({
        loader: () => {
            if (environment.useMock) {
                const mockData: Device[] = Array.from({ length: 50 }).map((_, i) => ({
                    _id: `device-${i}`,
                    imei: `IMEI${i}`,
                    serial_farm: `SF${i}`,
                    model: 'Pixel 7',
                    host: `host-${i % 10}`,
                    note: '',
                    label: `Label ${i}`,
                    serial: `SERIAL${i}`,
                    job: i % 5 === 0 ? 'Running' : 'Idle',
                    inventory: 'Yes',
                    url: 'http://device/1',
                    job_status: i % 5 === 0 ? 'Active' : 'Inactive',
                    circuit_serial: `CS${i}`,
                    hardware: 'v1.0',
                    borrowed_date: '',
                    return_date: '',
                    adb: i % 10 === 0 ? 'Offline' : 'Online',
                    comment: '',
                    owner: i % 2 === 0 ? 'Team A' : 'Team B',
                    create_time: new Date().toISOString(),
                    update_time: new Date().toISOString()
                }));
                return firstValueFrom(of(mockData).pipe(delay(700)));
            } else {
                return firstValueFrom(this.http.get<Device[]>(`${environment.apiUrl}/mini/devices_mini/list`));
            }
        }
    });

    async updateDevice(serial: string, data: Partial<Device>) {
        if (environment.useMock) {
            await firstValueFrom(of(true).pipe(delay(300)));
            return true;
        } else {
            return firstValueFrom(this.http.put(`${environment.apiUrl}/mini/devices_mini/update/filter={"serial":"${serial}"}`, data));
        }
    }

    async deepUpdate() {
        if (environment.useMock) {
            await firstValueFrom(of(true).pipe(delay(1000)));
            return true;
        } else {
            return firstValueFrom(this.http.put(`${environment.apiUrl}/mini/devices_mini/deep_update`, {}));
        }
    }

    async importDevices(file: File) {
        if (environment.useMock) {
            await firstValueFrom(of(true).pipe(delay(1000)));
            return true;
        } else {
            const formData = new FormData();
            formData.append('file', file);
            // Assuming knoxid is handled or appended
            return firstValueFrom(this.http.post(`${environment.apiUrl}/mini/devices_mini/upload/knoxid=mock`, formData));
        }
    }
}
