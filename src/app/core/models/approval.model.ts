export interface ApprovalRequest {
    id: string; // The fixed request ID
    requester?: string;
    reason?: string;
    approvers?: string[];
    expiryNotification?: string[];
    originalFileUrl?: string; // Mock file upload
    permissions: Permission[];
}

export type PermissionType = 'SystemID' | 'SuperUser' | 'RestApi' | 'Proxy' | 'ProxyForAll' | 'Firewall' | 'Escort';

export interface BasePermission {
    type: PermissionType;
    purpose?: string;
    expireDate?: string; // YYYY-MM-DD or Period
}

// SystemID Permission
export interface SystemIdPermission extends BasePermission {
    type: 'SystemID';
    systemId: string; // e.g., abc.srv
    users: string[]; // List user: A, B, C
    ips: string[]; // List IP: x.x.x.x, y.y.y.y
}

// Super User Permission
export interface SuperUserPermission extends BasePermission {
    type: 'SuperUser';
    userAccount: string; // e.g., abc.srv
    quickBuild: string; // Which QuickBuild: Android QuickBuild
    accessType: string; // Access Type: download for all
}

// REST API CP QuickBuild Permission
export interface RestApiPermission extends BasePermission {
    type: 'RestApi';
    quickBuild: string; // e.g., CP QuickBuild
    user: string; // user who uses REST API: abc.srv
    reason?: string;
    cmdAndFrequency?: string; // List CMD and frequency
}

// Proxy Permission
export interface ProxyPermission extends BasePermission {
    type: 'Proxy';
    ipAddress: string; // IP address
    user: string;
    targetIp: string;
    requestPeriod: string; // e.g., 2025-06-09 08:00 ~ 2026-06-08 17:00
}

// Proxy For All Permission
export interface ProxyForAllPermission extends BasePermission {
    type: 'ProxyForAll';
    ipAddress: string;
    user: string;
    requestPeriod: string;
}

export interface FirewallRule {
    user: string;
    source: string;
    destination: string;
    port: string;
    purpose: string;
    category: string; // e.g., TCP, TCP+UDP
}

// Firewall Permission
export interface FirewallPermission extends BasePermission {
    type: 'Firewall';
    user: string;
    period: string; // e.g., 2025-06-09 ~ 2026-06-08
    notify?: string[];
    rules: FirewallRule[];
}

// Escort Permission
export interface EscortItem {
    requestPeriod: string; // e.g., 2025-06-09 08:00 ~ 2026-06-08 17:00
    user: string;
    serialNo: string;
    modelName: string; // e.g., assembled PC
    ipAddress: string;
    requestItem: string; // e.g., Use internet
    macAddress: string;
}

export interface EscortPermission extends BasePermission {
    type: 'Escort';
    items: EscortItem[];
}

export type Permission =
    SystemIdPermission |
    SuperUserPermission |
    RestApiPermission |
    ProxyPermission |
    ProxyForAllPermission |
    FirewallPermission |
    EscortPermission;

export interface FirewallRuleSummary {
    direction: 'In' | 'Out';
    peer: string;
    port: string;
    protocol: string;
}

export interface FirewallGroupSummary {
    expiryDate: string;
    isExpired: boolean;
    rules: FirewallRuleSummary[];
}

export interface ProxyGroupSummary {
    expiryDate: string;
    isExpired: boolean;
    targets: string[];
}

// DTO for the flattened table view (Device/IP/Account perspective)
export interface EntityApprovalSummary {
    entityId: string; // Can be an IP (e.g., 192.168.1.1) or Account (e.g., abc.srv)
    entityType: 'Device' | 'AP' | 'Account';
    hasEscort?: boolean;
    escortExpiry?: string;
    firewallGroups?: FirewallGroupSummary[];
    proxyGroups?: ProxyGroupSummary[];
    proxyForAll?: { expiryDate: string, isExpired: boolean };
    inSystemIds?: string[]; // System IDs this entity is part of
    totalPermissions: number;
    status: 'Valid' | 'Warning' | 'Expired' | 'None';
    relatedRequests: string[]; // Request IDs that affect this entity
}
