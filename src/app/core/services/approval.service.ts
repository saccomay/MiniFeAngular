import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ApprovalRequest, EntityApprovalSummary } from '../models/approval.model';

@Injectable({
    providedIn: 'root'
})
export class ApprovalService {

    // --- MOCK DATA ---
    // Each request covers exactly ONE permission type.
    // Multi-permission scenarios from the old design are now split into separate request entries.
    private mockRequests: ApprovalRequest[] = [

        // ── REQ-2026-001 workstation setup (split into 4 requests) ──────────────────

        {
            id: 'REQ-2026-001-ESC', requester: 'Senior.Dev', reason: 'Escort for Dev workstation', approvers: ['Manager Y'],
            affectedEntities: [{ id: '10.20.30.1', type: 'Host' }],
            permission: { type: 'Escort', items: [
                { requestPeriod: '2025-01-01 08:00 ~ 2026-12-31 17:00', user: 'Dev 1', serialNo: 'DEV001', modelName: 'Dell Precision', ipAddress: '10.20.30.1', requestItem: 'Internet', macAddress: '00:11:22:33:44:01' }
            ] }
        },
        {
            id: 'REQ-2026-001-FW', requester: 'Senior.Dev', reason: 'Firewall rules for Dev workstation', approvers: ['Manager Y'],
            affectedEntities: [{ id: '10.20.30.1', type: 'Host' }],
            permission: { type: 'Firewall', period: '2025-01-01 ~ 2026-12-31', user: 'Senior.Dev', rules: [
                { user: 'Senior.Dev', source: '10.20.30.1', destination: 'github.com',    port: '443',  purpose: 'git',   category: 'TCP' },
                { user: 'Senior.Dev', source: '10.20.30.1', destination: 'npm.org',        port: '443',  purpose: 'npm',   category: 'TCP' },
                { user: 'Senior.Dev', source: '10.20.30.1', destination: 'staging-db.int', port: '5432', purpose: 'db',    category: 'TCP' },
                { user: 'Senior.Dev', source: '10.20.30.1', destination: 'redis.int',      port: '6379', purpose: 'cache', category: 'TCP' },
                { user: 'Senior.Dev', source: '10.20.30.1', destination: 'auth.int',       port: '8443', purpose: 'auth',  category: 'TCP' }
            ]}
        },
        {
            id: 'REQ-2026-001-P', requester: 'Senior.Dev', reason: 'Proxy access for Dev workstation', approvers: ['Manager Y'],
            affectedEntities: [{ id: '10.20.30.1', type: 'AP' }],
            permission: { type: 'Proxy', requestPeriod: '2025-01-01 08:00 ~ 2026-12-31 17:00', rules: [
                { ipAddress: '10.20.30.1', user: 'Senior.Dev', targetIp: 'stackoverflow.com' }
            ]}
        },
        {
            id: 'REQ-2026-001-SID', requester: 'Senior.Dev', reason: 'SystemID for Dev workstation', approvers: ['Manager Y'],
            affectedEntities: [{ id: '10.20.30.1', type: 'Host' }],
            permission: { type: 'SystemID', expireDate: '2026-12-31', systemId: 'System.X', users: ['Senior.Dev'], ips: ['10.20.30.1'] }
        },

        // ── REQ-2026-002 API Gateway (split into 2) ─────────────────────────────────

        {
            id: 'REQ-2026-002-API', requester: 'API.Admin', reason: 'REST API for api.service', approvers: ['Manager X'],
            permission: { type: 'RestApi', expireDate: '2026-06-30', user: 'api.service', quickBuild: 'CP Node', reason: 'Automated Status', cmdAndFrequency: 'curl -X GET /health (1min)' }
        },
        {
            id: 'REQ-2026-002-SID', requester: 'API.Admin', reason: 'SystemID for cluster server', approvers: ['Manager X'],
            affectedEntities: [{ id: '192.168.10.1', type: 'Host' }],
            permission: { type: 'SystemID', expireDate: '2025-06-30', systemId: 'Sys.Cluster.1', users: ['api.service'], ips: ['192.168.10.1'] }
        },

        // ── Single-type requests ─────────────────────────────────────────────────────

        {
            id: 'REQ-2026-003', requester: 'DB.Admin', reason: 'Emergency Super User Access.', approvers: ['VP Engineering'],
            permission: { type: 'SuperUser', expireDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], userAccount: 'db.admin', quickBuild: 'Oracle QuickBuild', accessType: 'Full' }
        },
        {
            id: 'REQ-2026-005', requester: 'Network.Team', reason: 'Global Proxy Gateway',
            affectedEntities: [{ id: '192.168.254.254', type: 'Host' }],
            permission: { type: 'ProxyForAll', requestPeriod: '2025-01-01 08:00 ~ 2028-12-31 17:00', ipAddress: '192.168.254.254', user: 'Network.Service' }
        },
        {
            id: 'REQ-2024-001', requester: 'API.Admin', reason: 'Old API tokens',
            permission: { type: 'RestApi', expireDate: '2024-05-05', user: 'legacy.api', quickBuild: 'Legacy', reason: 'Deprecated System', cmdAndFrequency: 'N/A' }
        },
        {
            id: 'REQ-2026-014', requester: 'Architecture', reason: 'Reserving Namespace',
            permission: { type: 'SystemID', expireDate: '2030-01-01', systemId: 'Arch.Reserve.Sys', users: ['Arch'], ips: [] }
        },

        // ── REQ-2026-018 CEO device (split into 2) ───────────────────────────────────

        {
            id: 'REQ-2026-018-PFA', requester: 'CEO', reason: 'ProxyForAll for CEO machine',
            affectedEntities: [{ id: '10.1.1.1', type: 'Host' }],
            permission: { type: 'ProxyForAll', requestPeriod: '2020-01-01 00:00 ~ 2030-12-31 23:59', ipAddress: '10.1.1.1', user: 'CEO.Device' }
        },
        {
            id: 'REQ-2026-018-SID', requester: 'CEO', reason: 'SystemID for CEO machine',
            affectedEntities: [{ id: '10.1.1.1', type: 'Host' }],
            permission: { type: 'SystemID', expireDate: '2030-12-31', systemId: 'Executive.Bypass', users: [], ips: ['10.1.1.1'] }
        },

        {
            id: 'REQ-2026-019', requester: 'Security', reason: 'DMZ Testing',
            affectedEntities: [{ id: '10.0.0.99', type: 'Host' }],
            permission: { type: 'Firewall', period: '2025-01-01 ~ 2026-12-31', user: 'Security', rules: [
                { user: 'Security', source: '10.0.0.99', destination: '8.8.8.8', port: '53', purpose: 'DNS', category: 'UDP' }
            ]}
        },
        {
            id: 'REQ-2027-001', requester: 'App.Srv', reason: 'Background Service',
            permission: { type: 'SuperUser', expireDate: '2028-01-01', userAccount: 'app.service.1', quickBuild: 'Backend', accessType: 'RWX' }
        },
        {
            // Proxy with multiple IP→target pairs
            id: 'REQ-2027-002', requester: 'QA', reason: 'Testing proxy',
            affectedEntities: [{ id: '10.50.50.50', type: 'AP' }],
            permission: { type: 'Proxy', requestPeriod: '2025-01-01 08:00 ~ 2026-12-31 17:00', rules: [
                { ipAddress: '10.50.50.50', user: 'QA', targetIp: '192.168.1.1' }
            ]}
        },

        // ── REQ-2026-099 edge cases (split into 2 SystemID requests) ────────────────

        {
            id: 'REQ-2026-099-W', requester: 'Edge.Tester', reason: 'Testing Warning SystemID',
            affectedEntities: [{ id: '10.99.99.99', type: 'Host' }],
            permission: { type: 'SystemID', expireDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], systemId: 'Warning.Sys', users: ['Warn.User'], ips: ['10.99.99.99'] }
        },
        {
            id: 'REQ-2026-099-D', requester: 'Edge.Tester', reason: 'Testing Expired SystemID',
            affectedEntities: [{ id: '10.99.99.98', type: 'Host' }],
            permission: { type: 'SystemID', expireDate: '2020-01-01', systemId: 'Dead.Sys', users: ['Dead.User'], ips: ['10.99.99.98'] }
        },

        // ── REQ-2026-100 audit expired (split into 3) ────────────────────────────────

        {
            id: 'REQ-2026-100-FW', requester: 'Audit.Team', reason: 'Expired Firewall test',
            affectedEntities: [{ id: '10.55.55.55', type: 'Host' }],
            permission: { type: 'Firewall', period: '2020-01-01 ~ 2021-12-31', user: 'Audit.FW', rules: [
                { user: 'Audit.FW', source: '10.55.55.55', destination: '8.8.4.4', port: '53', purpose: 'DNS', category: 'UDP' }
            ]}
        },
        {
            id: 'REQ-2026-100-P', requester: 'Audit.Team', reason: 'Expired Proxy test',
            affectedEntities: [{ id: '10.55.55.55', type: 'AP' }],
            permission: { type: 'Proxy', requestPeriod: '2020-01-01 08:00 ~ 2021-12-31 17:00', rules: [
                { ipAddress: '10.55.55.55', user: 'Audit.Proxy', targetIp: '1.1.1.1' }
            ]}
        },
        {
            id: 'REQ-2026-100-ESC', requester: 'Audit.Team', reason: 'Expired Escort test',
            affectedEntities: [{ id: '10.55.55.55', type: 'Host' }],
            permission: { type: 'Escort', items: [
                { requestPeriod: '2020-01-01 08:00 ~ 2021-12-31 17:00', user: 'Audit.Escort', serialNo: 'AUD001', modelName: 'HP', ipAddress: '10.55.55.55', requestItem: 'Local', macAddress: 'AA:BB:CC:DD:EE:FF' }
            ]}
        }
    ];

    // Flattens the requests into a view centered around Hosts (BE-selected IPs), APs, and Accounts.
    private generateHostSummaries(): EntityApprovalSummary[] {
        // Map key = '<type>:<id>' so that same IP can appear as both Host and AP simultaneously.
        const summaryMap = new Map<string, EntityApprovalSummary>();

        const key = (type: string, id: string) => `${type}:${id}`;

        const getOrInit = (id: string, type: 'Host' | 'AP' | 'Account'): EntityApprovalSummary => {
            const k = key(type, id);
            if (!summaryMap.has(k)) {
                summaryMap.set(k, {
                    entityId: id,
                    entityType: type,
                    totalPermissions: 0,
                    status: 'Valid',
                    relatedRequests: [],
                    firewallGroups: [],
                    proxyGroups: [],
                    superUserPermissions: [],
                    restApiPermissions: []
                });
            }
            return summaryMap.get(k)!;
        };

        const getHost = (ip: string) => summaryMap.get(key('Host', ip));
        const getAP   = (ip: string) => summaryMap.get(key('AP', ip));

        // Step 1: Pre-register all entity rows from each request's affectedEntities.
        // Type (Host | AP) is declared explicitly in the mock data.
        this.mockRequests.forEach(req => {
            (req.affectedEntities ?? []).forEach(entity => {
                const e = getOrInit(entity.id, entity.type);
                if (!e.relatedRequests.includes(req.id)) e.relatedRequests.push(req.id);
            });
        });

        // Step 2: For each request, handle its single permission and aggregate into the entity.
        this.mockRequests.forEach(req => {
            const perm = req.permission;

            if (perm.type === 'SystemID') {
                const expiryDate = perm.expireDate || 'Unknown';
                const daysUntilExpiry = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
                let status: 'Valid' | 'Warning' | 'Expired' = 'Valid';
                if (daysUntilExpiry < 0) status = 'Expired';
                else if (daysUntilExpiry <= 30) status = 'Warning';
                const systemIdObj = { systemId: perm.systemId, expiryDate, status, requestId: req.id };

                perm.users.forEach(u => {
                    const acc = getOrInit(u, 'Account');
                    acc.totalPermissions++;
                    if (!acc.inSystemId) acc.inSystemId = systemIdObj;
                    if (!acc.relatedRequests.includes(req.id)) acc.relatedRequests.push(req.id);
                });
                perm.ips.forEach(ip => {
                    const host = getHost(ip);
                    if (host) {
                        host.totalPermissions++;
                        if (!host.inSystemId) host.inSystemId = systemIdObj;
                        if (!host.relatedRequests.includes(req.id)) host.relatedRequests.push(req.id);
                    }
                });
            }

            else if (perm.type === 'SuperUser') {
                const acc = getOrInit(perm.userAccount, 'Account');
                acc.totalPermissions++;
                const expiryDate = perm.expireDate || 'Unknown';
                const isExpired = new Date(expiryDate) < new Date();
                acc.superUserPermissions!.push({
                    expiryDate, isExpired, requestId: req.id,
                    userAccount: perm.userAccount, quickBuild: perm.quickBuild,
                    accessType: perm.accessType, purpose: perm.purpose,
                    approvers: req.approvers, expiryNotification: req.expiryNotification
                });
                if (!acc.relatedRequests.includes(req.id)) acc.relatedRequests.push(req.id);
            }

            else if (perm.type === 'RestApi') {
                const acc = getOrInit(perm.user, 'Account');
                acc.totalPermissions++;
                const expiryDate = perm.expireDate || 'Unknown';
                const isExpired = new Date(expiryDate) < new Date();
                acc.restApiPermissions!.push({
                    expiryDate, isExpired, requestId: req.id,
                    user: perm.user, quickBuild: perm.quickBuild, reason: perm.reason,
                    cmdAndFrequency: perm.cmdAndFrequency,
                    approvers: req.approvers, expiryNotification: req.expiryNotification
                });
                if (!acc.relatedRequests.includes(req.id)) acc.relatedRequests.push(req.id);
            }

            else if (perm.type === 'Proxy') {
                // Each rule in perm.rules has its own AP IP + target
                perm.rules.forEach(rule => {
                    const ap = getAP(rule.ipAddress);
                    if (ap) {
                        ap.totalPermissions++;
                        const expiryDate = perm.requestPeriod.split('~')[1]?.trim() || 'Unknown';
                        const isExpired = new Date(expiryDate) < new Date();
                        let group = ap.proxyGroups!.find(g => g.expiryDate === expiryDate && g.requestId === req.id);
                        if (!group) {
                            group = { expiryDate, isExpired, requestId: req.id, targets: [] };
                            ap.proxyGroups!.push(group);
                        }
                        group.targets.push(rule.targetIp);
                        if (!ap.relatedRequests.includes(req.id)) ap.relatedRequests.push(req.id);
                    }
                });
            }

            else if (perm.type === 'ProxyForAll') {
                const host = getHost(perm.ipAddress);
                if (host) {
                    host.totalPermissions++;
                    const expiryDate = perm.requestPeriod.split('~')[1]?.trim() || 'Unknown';
                    const isExpired = new Date(expiryDate) < new Date();
                    host.proxyForAll = { expiryDate, isExpired, requestId: req.id };
                    if (!host.relatedRequests.includes(req.id)) host.relatedRequests.push(req.id);
                }
            }

            else if (perm.type === 'Firewall') {
                const expiryDate = perm.period.split('~')[1]?.trim() || 'Unknown';
                const isExpired = new Date(expiryDate) < new Date();
                perm.rules.forEach(rule => {
                    const src = getHost(rule.source);
                    if (src) {
                        src.totalPermissions++;
                        let g = src.firewallGroups!.find(g => g.expiryDate === expiryDate && g.requestId === req.id);
                        if (!g) { g = { expiryDate, isExpired, requestId: req.id, rules: [] }; src.firewallGroups!.push(g); }
                        if (!g.rules.some(r => r.peer === rule.destination && r.port === rule.port && r.protocol === rule.category))
                            g.rules.push({ direction: 'Out', peer: rule.destination, port: rule.port, protocol: rule.category });
                        if (!src.relatedRequests.includes(req.id)) src.relatedRequests.push(req.id);
                    }
                    const dest = getHost(rule.destination);
                    if (dest) {
                        dest.totalPermissions++;
                        let g = dest.firewallGroups!.find(g => g.expiryDate === expiryDate && g.requestId === req.id);
                        if (!g) { g = { expiryDate, isExpired, requestId: req.id, rules: [] }; dest.firewallGroups!.push(g); }
                        if (!g.rules.some(r => r.peer === rule.source && r.port === rule.port && r.protocol === rule.category))
                            g.rules.push({ direction: 'In', peer: rule.source, port: rule.port, protocol: rule.category });
                        if (!dest.relatedRequests.includes(req.id)) dest.relatedRequests.push(req.id);
                    }
                });
            }

            else if (perm.type === 'Escort') {
                perm.items.forEach(item => {
                    const host = getHost(item.ipAddress);
                    if (host) {
                        host.totalPermissions++;
                        host.hasEscort = true;
                        host.escortExpiry = item.requestPeriod.split('~')[1]?.trim();
                        host.escortRequestId = req.id;
                        if (!host.relatedRequests.includes(req.id)) host.relatedRequests.push(req.id);
                    }
                });
            }
        });

        // Step 3: Calculate overall status per entity
        const summaries = Array.from(summaryMap.values());
        summaries.forEach(summary => {
            let hasExpired = false, hasWarning = false;
            const now = new Date();
            const warnAt = new Date(); warnAt.setDate(now.getDate() + 30);
            const check = (d: string | undefined, expired?: boolean) => {
                if (!d) return;
                const dt = new Date(d);
                if (expired || dt < now) hasExpired = true;
                else if (dt < warnAt) hasWarning = true;
            };
            check(summary.escortExpiry);
            if (summary.proxyForAll) check(summary.proxyForAll.expiryDate, summary.proxyForAll.isExpired);
            summary.firewallGroups?.forEach(g => check(g.expiryDate, g.isExpired));
            summary.proxyGroups?.forEach(g => check(g.expiryDate, g.isExpired));
            summary.superUserPermissions?.forEach(p => check(p.expiryDate, p.isExpired));
            summary.restApiPermissions?.forEach(p => check(p.expiryDate, p.isExpired));
            summary.status = hasExpired ? 'Expired' : hasWarning ? 'Warning' : 'Valid';
        });

        return summaries;
    }

    // --- API METHODS ---

    getHostSummaries(): Observable<EntityApprovalSummary[]> {
        return of(this.generateHostSummaries()).pipe(delay(500));
    }

    getRequestDetails(requestId: string): Observable<ApprovalRequest | undefined> {
        const req = this.mockRequests.find(r => r.id === requestId);
        return of(req).pipe(delay(300));
    }

    getAllRequests(): Observable<ApprovalRequest[]> {
        return of(this.mockRequests).pipe(delay(300));
    }

    importApprovalFile(file: File): Observable<{ message: string, extractedRequests: ApprovalRequest[] }> {
        const newReq: ApprovalRequest = {
            id: `REQ-NEW-${Math.floor(Math.random() * 1000)}`,
            requester: 'Extracted User',
            affectedEntities: [{ id: '10.0.0.99', type: 'Host' }],
            permission: {
                type: 'Firewall',
                period: '2026-01-01 ~ 2027-01-01',
                user: 'Extracted User',
                rules: [
                    { user: 'Extracted User', source: '10.0.0.99', destination: '8.8.8.8', port: '53', purpose: 'DNS', category: 'UDP' }
                ]
            }
        };
        return of({ message: 'File processed successfully', extractedRequests: [newReq] }).pipe(delay(1500));
    }

    applyApprovals(requests: ApprovalRequest[]): Observable<boolean> {
        this.mockRequests = [...this.mockRequests, ...requests];
        return of(true).pipe(delay(800));
    }
}

