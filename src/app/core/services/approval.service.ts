import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ApprovalRequest, EntityApprovalSummary } from '../models/approval.model';

@Injectable({
    providedIn: 'root'
})
export class ApprovalService {

    // --- MOCK DATA ---

    private mockRequests: ApprovalRequest[] = [
        {
            id: 'REQ-2025-001',
            requester: 'User A',
            reason: 'Setup new farm devices SystemID',
            approvers: ['Manager D'],
            expiryNotification: ['User A', 'User B', 'User C'],
            originalFileUrl: '/assets/images/auth-bg.jpg',
            permissions: [
                {
                    type: 'SystemID',
                    expireDate: '2026-10-08',
                    purpose: 'System Access',
                    systemId: 'farm-controller.srv',
                    users: ['A', 'B', 'C'],
                    ips: ['192.168.10.10', '192.168.10.20']
                }
            ]
        },
        {
            id: 'REQ-2025-002',
            requester: 'User B',
            reason: 'Proxy Access to Slack and Github',
            approvers: ['Manager A'],
            permissions: [
                {
                    type: 'Proxy',
                    requestPeriod: '2025-01-01 08:00 ~ 2026-03-20 17:00', // Expiring soon (Warning status)
                    ipAddress: '10.50.0.12',
                    user: 'B',
                    targetIp: 'slack.com'
                },
                {
                    type: 'Proxy',
                    requestPeriod: '2025-01-01 08:00 ~ 2026-01-01 17:00', // Expired
                    ipAddress: '10.50.0.12',
                    user: 'B',
                    targetIp: 'github.com'
                }
            ]
        },
        {
            id: 'REQ-2025-003',
            requester: 'User C',
            reason: 'Firewall Access Database Sync',
            approvers: ['Manager B'],
            permissions: [
                {
                    type: 'Firewall',
                    period: '2025-06-09 ~ 2026-06-08', // Valid
                    user: 'C',
                    notify: ['C'],
                    rules: [
                        { user: 'C', source: '10.50.0.12', destination: 'db.internal.net', port: '5432', purpose: 'postgres', category: 'TCP' },
                        { user: 'C', source: '10.50.0.12', destination: 'redis.internal.net', port: '6379', purpose: 'redis', category: 'TCP' }
                    ]
                }
            ]
        },
        {
            id: 'REQ-2025-004',
            requester: 'User C',
            reason: 'Firewall Access Legacy System',
            approvers: ['Manager B'],
            permissions: [
                {
                    type: 'Firewall',
                    period: '2023-01-01 ~ 2024-01-01', // Expired
                    user: 'C',
                    notify: ['C'],
                    rules: [
                        { user: 'C', source: '10.50.0.12', destination: 'legacy-mainframe.net', port: '23', purpose: 'telnet', category: 'TCP' }
                    ]
                }
            ]
        },
        {
            id: 'REQ-2025-005',
            requester: 'User D',
            reason: 'Proxy For All for build server',
            approvers: ['Manager X'],
            permissions: [
                {
                    type: 'ProxyForAll',
                    requestPeriod: '2025-01-01 00:00 ~ 2026-12-31 23:59', // Valid
                    ipAddress: 'build-server-01.infra',
                    user: 'D'
                }
            ]
        },
        {
            id: 'REQ-2025-006',
            requester: 'User D',
            reason: 'Proxy For All for old test server',
            approvers: ['Manager X'],
            permissions: [
                {
                    type: 'ProxyForAll',
                    requestPeriod: '2020-01-01 00:00 ~ 2021-12-31 23:59', // Expired
                    ipAddress: 'test-server-05.infra',
                    user: 'D'
                }
            ]
        },
        {
            id: 'REQ-2025-007',
            requester: 'User E',
            reason: 'Complex Bi-Directional Firewall setup for Web Node',
            approvers: ['Security Team'],
            permissions: [
                {
                    type: 'Firewall',
                    period: '2025-05-01 ~ 2025-12-31', // Valid
                    user: 'E',
                    rules: [
                        { user: 'E', source: 'web-node-01', destination: 'db.internal.net', port: '5432', purpose: 'db access', category: 'TCP' },
                        { user: 'E', source: 'web-node-01', destination: 'metrics.net', port: '9090', purpose: 'prometheus', category: 'TCP' }
                    ]
                },
                {
                    type: 'Firewall',
                    period: '2025-05-01 ~ 2025-12-31', // Valid
                    user: 'E',
                    rules: [
                        { user: 'E', source: 'lb.external.net', destination: 'web-node-01', port: '443', purpose: 'inbound web', category: 'TCP' },
                        { user: 'E', source: 'monitor.internal.net', destination: 'web-node-01', port: '8080', purpose: 'health check', category: 'TCP' }
                    ]
                },
                {
                    type: 'Firewall',
                    period: '2022-01-01 ~ 2023-01-01', // Expired
                    user: 'E',
                    rules: [
                        { user: 'E', source: 'old-admin-pc', destination: 'web-node-01', port: '22', purpose: 'ssh', category: 'TCP' }
                    ]
                }
            ]
        },
        {
            id: 'REQ-2025-008',
            requester: 'User F',
            reason: 'Device Escort for contractor laptops',
            approvers: ['Manager Z'],
            permissions: [
                {
                    type: 'Escort',
                    items: [
                        { requestPeriod: '2025-06-01 08:00 ~ 2025-06-30 17:00', user: 'Contractor 1', serialNo: 'SN001', modelName: 'Thinkpad', ipAddress: '10.99.0.50', requestItem: 'Internet', macAddress: 'AA:11' },
                        { requestPeriod: '2025-06-01 08:00 ~ 2025-06-30 17:00', user: 'Contractor 2', serialNo: 'SN002', modelName: 'MacBook', ipAddress: '10.99.0.51', requestItem: 'Internet', macAddress: 'BB:22' },
                        { requestPeriod: '2020-01-01 08:00 ~ 2020-12-31 17:00', user: 'Contractor 3', serialNo: 'SN003', modelName: 'Dell XPS', ipAddress: '10.99.0.52', requestItem: 'Internet', macAddress: 'CC:33' }
                    ]
                }
            ]
        }
    ];

    // Flattens the requests into a view centered around IPs and Accounts
    private generateDeviceSummaries(): EntityApprovalSummary[] {
        const summaryMap = new Map<string, EntityApprovalSummary>();

        const getOrInit = (id: string, type: 'Device' | 'AP' | 'Account'): EntityApprovalSummary => {
            if (!summaryMap.has(id)) {
                summaryMap.set(id, {
                    entityId: id,
                    entityType: type,
                    totalPermissions: 0,
                    status: 'Valid',
                    relatedRequests: [],
                    firewallGroups: [],
                    proxyGroups: [],
                    inSystemIds: []
                });
            }
            return summaryMap.get(id)!;
        };

        this.mockRequests.forEach(req => {
            req.permissions.forEach(perm => {
                if (perm.type === 'SystemID') {
                    // Account
                    const acc = getOrInit(perm.systemId, 'Account');
                    acc.totalPermissions++;
                    if (!acc.relatedRequests.includes(req.id)) acc.relatedRequests.push(req.id);

                    // IPs
                    perm.ips.forEach(ip => {
                        const dev = getOrInit(ip, 'Device');
                        dev.totalPermissions++;
                        if (!dev.inSystemIds!.includes(perm.systemId)) dev.inSystemIds!.push(perm.systemId);
                        if (!dev.relatedRequests.includes(req.id)) dev.relatedRequests.push(req.id);
                    });
                }

                if (perm.type === 'SuperUser') {
                    const acc = getOrInit(perm.userAccount, 'Account');
                    acc.totalPermissions++;
                    if (!acc.relatedRequests.includes(req.id)) acc.relatedRequests.push(req.id);
                }

                if (perm.type === 'RestApi') {
                    const acc = getOrInit(perm.user, 'Account');
                    acc.totalPermissions++;
                    if (!acc.relatedRequests.includes(req.id)) acc.relatedRequests.push(req.id);
                }

                if (perm.type === 'Proxy') {
                    const ap = getOrInit(perm.ipAddress, 'AP');
                    ap.totalPermissions++;
                    const expiryDate = perm.requestPeriod.split('~')[1]?.trim() || 'Unknown';
                    const isExpired = new Date(expiryDate) < new Date();

                    let group = ap.proxyGroups!.find(g => g.expiryDate === expiryDate);
                    if (!group) {
                        group = { expiryDate, isExpired, targets: [] };
                        ap.proxyGroups!.push(group);
                    }
                    group.targets.push(`${perm.targetIp}`);

                    if (!ap.relatedRequests.includes(req.id)) ap.relatedRequests.push(req.id);
                }

                if (perm.type === 'ProxyForAll') {
                    const dev = getOrInit(perm.ipAddress, 'Device');
                    dev.totalPermissions++;
                    const expiryDate = perm.requestPeriod.split('~')[1]?.trim() || 'Unknown';
                    const isExpired = new Date(expiryDate) < new Date();
                    dev.proxyForAll = { expiryDate, isExpired };
                    if (!dev.relatedRequests.includes(req.id)) dev.relatedRequests.push(req.id);
                }

                if (perm.type === 'Firewall') {
                    const expiryDate = perm.period.split('~')[1]?.trim() || 'Unknown';
                    const isExpired = new Date(expiryDate) < new Date();

                    perm.rules.forEach(rule => {
                        // For the source IP, this is an OUTBOUND connection
                        const src = getOrInit(rule.source, 'Device');
                        src.totalPermissions++;
                        let srcGroup = src.firewallGroups!.find(g => g.expiryDate === expiryDate);
                        if (!srcGroup) {
                            srcGroup = { expiryDate, isExpired, rules: [] };
                            src.firewallGroups!.push(srcGroup);
                        }
                        // Check for duplicate rule before adding
                        const srcDuplicate = srcGroup.rules.some(r => r.peer === rule.destination && r.port === rule.port && r.protocol === rule.category);
                        if (!srcDuplicate) {
                            srcGroup.rules.push({ direction: 'Out', peer: rule.destination, port: rule.port, protocol: rule.category });
                        }
                        if (!src.relatedRequests.includes(req.id)) src.relatedRequests.push(req.id);

                        // For the destination IP, this is an INBOUND connection
                        const dest = getOrInit(rule.destination, 'Device');
                        dest.totalPermissions++;
                        let destGroup = dest.firewallGroups!.find(g => g.expiryDate === expiryDate);
                        if (!destGroup) {
                            destGroup = { expiryDate, isExpired, rules: [] };
                            dest.firewallGroups!.push(destGroup);
                        }
                        // Check for duplicate rule before adding
                        const destDuplicate = destGroup.rules.some(r => r.peer === rule.source && r.port === rule.port && r.protocol === rule.category);
                        if (!destDuplicate) {
                            destGroup.rules.push({ direction: 'In', peer: rule.source, port: rule.port, protocol: rule.category });
                        }
                        if (!dest.relatedRequests.includes(req.id)) dest.relatedRequests.push(req.id);
                    });
                }

                if (perm.type === 'Escort') {
                    perm.items.forEach(item => {
                        const dev = getOrInit(item.ipAddress, 'Device');
                        dev.totalPermissions++;
                        dev.hasEscort = true;
                        dev.escortExpiry = item.requestPeriod.split('~')[1]?.trim();
                        if (!dev.relatedRequests.includes(req.id)) dev.relatedRequests.push(req.id);
                    });
                }
            });
        });

        // Calculate statuses based on expiry dates rather than dummy data
        const summaries = Array.from(summaryMap.values());
        summaries.forEach(summary => {
            let hasExpired = false;
            let hasWarning = false;
            const now = new Date();
            const warningThreshold = new Date();
            warningThreshold.setDate(now.getDate() + 30); // Warn if expiring in 30 days

            const checkExpiry = (expiryStr: string | undefined, isExpiredFlag?: boolean) => {
                if (!expiryStr) return;
                const expDate = new Date(expiryStr);
                if (isExpiredFlag || expDate < now) {
                    hasExpired = true;
                } else if (expDate < warningThreshold) {
                    hasWarning = true;
                }
            };

            checkExpiry(summary.escortExpiry);

            if (summary.proxyForAll) {
                checkExpiry(summary.proxyForAll.expiryDate, summary.proxyForAll.isExpired);
            }

            summary.firewallGroups?.forEach(g => checkExpiry(g.expiryDate, g.isExpired));
            summary.proxyGroups?.forEach(g => checkExpiry(g.expiryDate, g.isExpired));

            if (hasExpired) {
                summary.status = 'Expired';
            } else if (hasWarning) {
                summary.status = 'Warning';
            } else {
                summary.status = 'Valid';
            }
        });

        return summaries;
    }

    // --- API METHODS ---

    getDeviceSummaries(): Observable<EntityApprovalSummary[]> {
        return of(this.generateDeviceSummaries()).pipe(delay(500));
    }

    getRequestDetails(requestId: string): Observable<ApprovalRequest | undefined> {
        const req = this.mockRequests.find(r => r.id === requestId);
        return of(req).pipe(delay(300));
    }

    getAllRequests(): Observable<ApprovalRequest[]> {
        return of(this.mockRequests).pipe(delay(300));
    }

    // Mock processing an uploaded file
    importApprovalFile(file: File): Observable<{ message: string, extractedRequests: ApprovalRequest[] }> {
        // Return some dummy new request data to simulate OCR/Extract
        const newReq: ApprovalRequest = {
            id: `REQ-NEW-${Math.floor(Math.random() * 1000)}`,
            requester: 'Extracted User',
            permissions: [
                {
                    type: 'Firewall',
                    period: '2026-01-01 ~ 2027-01-01',
                    user: 'Extracted User',
                    rules: [
                        { user: 'Extracted User', source: '10.0.0.99', destination: '8.8.8.8', port: '53', purpose: 'DNS', category: 'UDP' }
                    ]
                }
            ]
        };
        return of({
            message: 'File processed successfully',
            extractedRequests: [newReq]
        }).pipe(delay(1500));
    }

    applyApprovals(requests: ApprovalRequest[]): Observable<boolean> {
        this.mockRequests = [...this.mockRequests, ...requests];
        return of(true).pipe(delay(800));
    }
}
