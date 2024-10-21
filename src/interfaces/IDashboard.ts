// src/interfaces/IDashboard.ts
import { ExtendedUserInfo  } from "../types/User/interfaces";
import { TenantInfo } from "../types/Tenant/interfaces";

export interface IDashboard {
    getTenantInfo(tenantId: string): Promise<TenantInfo>;
    getUserInfo(userId: string): Promise<ExtendedUserInfo>;
    getAllUsers(): Promise<ExtendedUserInfo []>;
    getDNSRecords(tenantId: string): Promise<DNSRecord[]>;
    getCertificateInfo(domain: string): Promise<CertificateInfo>;
    getMessageQueueStatus(tenantId: string): Promise<QueueStatus>;
    updateTenantDomain(tenantId: string, newDomain: string): Promise<boolean>;
    regenerateCertificate(domain: string): Promise<boolean>;
    getTenants(page: string, limit: string): Promise<TenantInfo[]>;
    getSystemHealth(): Promise<SystemHealthOverview>;
    getSystemHealthOverview(): Promise<SystemHealth[]>;
    getOnboardingUsers(): Promise<ExtendedUserInfo[]>;
    completeOnboarding(userId: string): Promise<boolean>;
    getAnalytics(): Promise<AnalyticsData>;
    getGlobalStats(): Promise<GlobalStats>;
    getRegionalData(): Promise<RegionalData[]>;
  }

export interface DNSRecord {
    type: 'A' | 'CNAME' | 'MX' | 'TXT';
    name: string;
    value: string;
    ttl: number;
}

export interface CertificateInfo {
    domain: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    status: 'Valid' | 'Expired' | 'Revoked';
}

export interface QueueStatus {
    queueName: string;
    messageCount: number;
    oldestMessageAge: number;
}

export type HealthStatus = 'Healthy' | 'Degraded' | 'Down' | 'Warning' | 'Critical' | 'Connected' | 'Disconnected';

export interface SystemHealth {
    service: string;
    status: HealthStatus;
}

export interface SystemHealthOverview {
    dns: HealthStatus;
    certificates: HealthStatus;
    messageQueue: HealthStatus;
    database: HealthStatus;
}

export interface AnalyticsData {
    activeUsers: number;
    totalTenants: number;
    averageOnboardingTime: number;
    mostUsedFeatures: { name: string; usage: number }[];
}

export interface GlobalStats {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers: number;
    averageUptime: number;
    totalRequests: number;
    averageResponseTime: number;
}

export interface RegionalData {
    region: string;
    tenants: number;
    users: number;
    uptime: number;
}
