import { Tenant } from '../types/Tenant/interfaces';

export async function deleteTenant(tenantId: string, deletedBy: string, db: any, softDelete: boolean = true): Promise<void> {
  // ... (same as before)
}

export function transferTenantOwnership(tenant: Tenant, newOwnerId: string): Tenant {
  tenant.ownerId = newOwnerId;
  tenant.updatedAt = new Date().toISOString();
  return tenant;
}

export function checkResourceLimits(tenant: Tenant): boolean {
  return tenant.resourceUsage <= tenant.resourceLimit;
}