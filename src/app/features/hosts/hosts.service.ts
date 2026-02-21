import { Injectable, resource, inject } from '@angular/core';
import { firstValueFrom, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface Host {
    _id: string;
    asset_no: string;
    image_host?: string;
    ip?: string;
    mac?: string;
    serial?: string;
    os?: string;
    hostname?: string;
    comment?: string;
    jenkins_url?: string;
    town_status?: string;
    zabbix_status?: string;
    owner?: string;
    mac_address?: string;
    asset_description?: string;
    asset_name?: string;
    model?: string;
    remark?: string;
    other_info?: string;
    serial_hr?: { _no: string };
    pic?: string;
    owner_hr?: string;
    asset_type?: string;
    building?: string;
    cd_no?: string;
    cis?: string;
    code?: string;
    class_code?: string;
    cdass_type?: string;
    contract?: string;
    cost_center?: string;
    cost_center_name?: string;
    counted_id?: string;
    floor?: string;
    hs_code?: string;
    invoice?: string;
    last_count?: string;
    manufacturer?: string;
    nbv?: string;
    origin?: string;
    po_date?: string;
    po_no?: string;
    qty?: string;
    reason?: string;
    request_solution?: string;
    resp_cost_center?: string;
    resp_group?: string;
    resp_team?: string;
    status?: string;
    updated_id?: string;
    updated_time?: string;
    vendor?: string;
    vietnamese_name?: string;
    create_time?: string;
    accounting_doc?: string;
    acq_val?: string;
    actual_solution?: string;
    area?: string;
    image_label?: string;
}

@Injectable({
    providedIn: 'root'
})
export class HostsService {
    private http = inject(HttpClient);

    readonly hostsResource = resource({
        loader: () => {
            if (environment.useMock) {
                const mockData: Host[] = Array.from({ length: 50 }).map((_, i) => ({
                    _id: `host-${i}`,
                    asset_no: `ASSET${i}`,
                    image_host: `img-host-${i}.png`,
                    ip: `192.168.1.${i}`,
                    mac: `00:11:22:33:44:${i < 10 ? '0' + i : i}`,
                    serial: `SN-${1000 + i}`,
                    os: i % 2 === 0 ? 'Windows 10' : 'Ubuntu 20.04',
                    hostname: `host-${i}.local`,
                    comment: i % 3 === 0 ? 'Needs maintenance' : 'Operational',
                    jenkins_url: `http://jenkins/job/build-${i}`,
                    town_status: i % 2 === 0 ? 'Active' : 'Inactive',
                    zabbix_status: 'Monitored',
                    owner: `User ${i}`,
                    mac_address: `00:11:22:33:44:${i < 10 ? '0' + i : i}`,
                    asset_description: `High performance workstation ${i}`,
                    asset_name: `Workstation-${i}`,
                    model: 'Dell Precision 5550',
                    remark: 'None',
                    other_info: 'N/A',
                    serial_hr: { _no: `HR-SN-${i}` },
                    pic: `Manager ${i % 5}`,
                    owner_hr: `HR User ${i}`,
                    asset_type: 'Laptop',
                    building: 'Main Building',
                    cd_no: `CD-${i}`,
                    cis: `CIS-${i}`,
                    code: `CODE-${i}`,
                    class_code: 'IT-001',
                    cdass_type: 'Type A',
                    contract: `CTR-2024-${i}`,
                    cost_center: 'CC-101',
                    cost_center_name: 'Engineering',
                    counted_id: `CNT-${i}`,
                    floor: `${(i % 5) + 1}`,
                    hs_code: '8471.30',
                    invoice: `INV-2024-${i}`,
                    last_count: '2024-01-01',
                    manufacturer: 'Dell',
                    nbv: '1000',
                    origin: 'Vietnam',
                    po_date: '2023-12-01',
                    po_no: `PO-${i}`,
                    qty: '1',
                    reason: 'New Hire',
                    request_solution: 'None',
                    resp_cost_center: 'CC-101',
                    resp_group: 'Engineering',
                    resp_team: 'DevOps',
                    status: 'In Use',
                    updated_id: `UPD-${i}`,
                    updated_time: new Date().toISOString(),
                    vendor: 'FPT',
                    vietnamese_name: `Máy tính ${i}`,
                    create_time: new Date().toISOString(),
                    accounting_doc: `DOC-${i}`,
                    acq_val: '1500',
                    actual_solution: 'Deployed',
                    area: 'Hanoi',
                    image_label: `label-${i}`
                }));
                return firstValueFrom(of(mockData).pipe(delay(700)));
            } else {
                return firstValueFrom(this.http.get<Host[]>(`${environment.apiUrl}/mini/hosts_mini/list`));
            }
        }
    });

    async updateHost(hostname: string, data: Partial<Host>) {
        if (environment.useMock) {
            await firstValueFrom(of(true).pipe(delay(300)));
            return true;
        } else {
            return firstValueFrom(this.http.put(`${environment.apiUrl}/mini/hosts_mini/update/filter={"hostname":"${hostname}"}`, data));
        }
    }

    async importHosts(file: File) {
        if (environment.useMock) {
            await firstValueFrom(of(true).pipe(delay(1000)));
            return true;
        } else {
            const formData = new FormData();
            formData.append('file', file);
            return firstValueFrom(this.http.post(`${environment.apiUrl}/mini/hosts_mini/deep_update`, formData));
        }
    }
}
