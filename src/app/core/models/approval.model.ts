export interface ApprovalRequest {
    id: string; // The fixed request ID
    requester?: string;
    reason?: string;
    approvers?: string[];
    expiryNotification?: string[];
    originalFileUrl?: string; // Mock file upload
    // Entities (Host IPs / AP IPs) this request applies to — explicitly typed by BE.
    // Account rows are always derived from the user fields inside each permission.
    affectedEntities?: Array<{ id: string; type: 'Host' | 'AP' }>;
    permission: Permission; // each request covers exactly ONE permission type
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

// Proxy Item: one AP IP → one target URL
export interface ProxyRule {
    ipAddress: string; // AP IP
    user: string;
    targetIp: string;  // target URL/IP
}

// Proxy Permission: one AP or multiple APs each with their own target URL
export interface ProxyPermission extends BasePermission {
    type: 'Proxy';
    requestPeriod: string; // e.g., 2025-06-09 08:00 ~ 2026-06-08 17:00
    rules: ProxyRule[];
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
    requestId: string;
    rules: FirewallRuleSummary[];
}

export interface SuperUserSummary {
    expiryDate: string;
    isExpired: boolean;
    requestId: string;
    userAccount: string;
    quickBuild: string;
    accessType: string;
    purpose?: string;
    approvers?: string[];
    expiryNotification?: string[];
}

export interface RestApiSummary {
    expiryDate: string;
    isExpired: boolean;
    requestId: string;
    quickBuild: string;
    user: string;
    reason?: string;
    cmdAndFrequency?: string;
    approvers?: string[];
    expiryNotification?: string[];
}

export interface ProxyGroupSummary {
    expiryDate: string;
    isExpired: boolean;
    requestId: string;
    targets: string[];
}

export interface SystemIdGroupSummary {
    systemId: string;
    expiryDate: string;
    status: 'Valid' | 'Warning' | 'Expired';
    requestId: string;
}

// DTO for the flattened table view (Host/AP/Account perspective)
export interface EntityApprovalSummary {
    entityId: string; // Can be a BE-selected IP (Host/AP) or Account name
    entityType: 'Host' | 'AP' | 'Account';
    hasEscort?: boolean;
    escortExpiry?: string;
    escortRequestId?: string;
    firewallGroups?: FirewallGroupSummary[];
    proxyGroups?: ProxyGroupSummary[];
    proxyForAll?: { expiryDate: string, isExpired: boolean, requestId: string };
    superUserPermissions?: SuperUserSummary[];
    restApiPermissions?: RestApiSummary[];
    inSystemId?: SystemIdGroupSummary; // A single Advanced System ID this entity is part of
    totalPermissions: number;
    status: 'Valid' | 'Warning' | 'Expired' | 'None';
    relatedRequests: string[]; // Request IDs that affect this entity
}
