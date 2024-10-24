// src/types/sharedTypes.ts

import { DatabaseError } from '@/MonitoringSystem/errors/specific';
import { ROLES } from '../../constants/AccessKey/AccountRoles';
import { AccessLevel } from '@/constants/AccessKey/access_levels';
import { Permissions } from '@/constants/AccessKey/permissions';
import { AuditTrail, Session } from './interfaces';
import { COLLECTIONS } from '@/constants/collections';
import { Tenant } from '../Tenant/interfaces';
import moment from 'moment';

export type FrequencyType = 'pay-as-you-go' | 'monthly' | 'annually';

export type FeatureFlags = Record<string, boolean>;

export type HealthStatus =
  | 'Healthy'
  | 'Degraded'
  | 'Down'
  | 'Warning'
  | 'Critical'
  | 'Connected'
  | 'Disconnected';


  export type LanguageType = 
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'ru' // Russian
  | 'zh' // Chinese
  | 'ja' // Japanese
  | 'ko'; // Korean

export type CurrencyType = 
  | 'USD' // United States Dollar
  | 'EUR' // Euro
  | 'GBP' // British Pound Sterling
  | 'JPY' // Japanese Yen
  | 'CNY' // Chinese Yuan
  | 'CAD' // Canadian Dollar
  | 'AUD' // Australian Dollar
  | 'CHF' // Swiss Franc
  | 'INR'; // Indian Rupee

export type MeasurementSystemType = 
  | 'metric'
  | 'imperial';

export type TemperaturaUnitType = 
  | 'celsius'
  | 'fahrenheit'
  | 'kelvin';

export type TimeFormatType = 
  | '12h'
  | '24h';

export type DateFormatType = 
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY-MM-DD';

export type TimeZoneType = 
  | 'UTC'
  | 'GMT'
  | 'EST'
  | 'CST'
  | 'MST'
  | 'PST'
  | 'CET'
  | 'JST'
    | 'AEST';

export type CountryType =
  | 'US' // United States
  | 'CA' // Canada
  | 'GB' // United Kingdom
  | 'DE' // Germany
  | 'FR' // France
  | 'JP' // Japan
  | 'CN' // China
  | 'AU' // Australia
  | 'BR' // Brazil
  | 'IN'; // India

export type RegionType =
  | 'NA' // North America
  | 'SA' // South America
  | 'EU' // Europe
  | 'AS' // Asia
  | 'AF' // Africa
  | 'OC' // Oceania
  | 'AN'; // Antarctica

// Utility type for MongoDB ObjectId representation
export type ObjectId = string;  // Simplified for now, it can be more complex if needed

export type ChartType = 'bar' | 'line' | 'pie';


// Type representing a record of permissions
export type LocalPermissions = Record<Permissions, boolean>;

export type PrimaryColor =
    'blue' |
    'green' |
    'red' |
    'purple' |
    'orange' |
    'yellow' |
    'pink' |
    'cyan' |
    'teal' |
    'indigo' |
    'gray' |
    'brown';

export type FontFamily =
    'Arial' |
    'Helvetica' |
    'Times New Roman' |
    'Times' |
    'Courier New' |
    'Courier' |
    'Verdana' |
    'Georgia' |
    'Palatino' |
    'Garamond' |
    'Bookman' |
    'Comic Sans MS' |
    'Trebuchet MS' |
    'Arial Black' |
  'Impact';
    

export interface BackgroundImage {
    file: string;
    url: string;
  alt: string;
}


/**
 * Type representing a shard key for partitioning data.
 */
export type ShardKey = {
    tenantId: string;
    userId: string;
    partitionKey: string;
};




// --------------------------- Utility Types --------------------------- //

/**
 * Type representing a document with an ID.
 */
export type WithId<T> = T & { id: string };

/**
 * Type representing a document without an ID.
 */
export type WithoutId<T> = Omit<T, '_id' | 'id'>;

/**
 * Type representing a partial version of an object.
 */
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * Type representing a query that includes a shard key.
 */
export type ShardedQuery<T> = T & ShardKey;

/**
 * Type representing a document ID, which can be a string or ObjectId.
 */
export type DocumentId = string | ObjectId;



/**
 * Creates indexes for a collection in the database.
 * @param collection The collection for which to create indexes.
 * @returns A promise that resolves when the indexes are created.
 */
export async function createIndexes(collection: any): Promise<void> {
    try {
        await Promise.all([
            collection.createIndex({ tenantId: 1, userId: 1 }),
            collection.createIndex({ tenantId: 1, createdAt: 1 }),
            collection.createIndex({ ttl: 1 }, { expireAfterSeconds: 0 }),
        ]);
    } catch (error) {
        console.error("Error creating indexes:", error);
        throw new DatabaseError("Failed to create indexes");
    }
}

/**
 * Creates a new session in the database.
 * @param db The database connection.
 * @param session The session object to insert.
 * @returns A promise that resolves when the session is created.
 */

export async function createSession(db: any, session: Session): Promise<void> {
    try {
        await db.collection(COLLECTIONS.SESSIONS).insertOne(session);
    } catch (error) {
        console.error("Error creating session:", error);
        throw new DatabaseError("Failed to create session");
    }
}


/**
 * Creates an audit trail entry in the database.
 * @param db The database connection.
 * @param auditTrail The audit trail object to insert.
 * @returns A promise that resolves when the audit trail entry is created.
 */
export async function createAuditTrail(db: any, auditTrail: AuditTrail): Promise<void> {
    try {
        await db.collection(COLLECTIONS.AUDIT_TRAILS).insertOne(auditTrail);
    } catch (error) {
        console.error("Error creating audit trail:", error);
        throw new DatabaseError("Failed to create audit trail");
    }
}



/**
 * Deletes a tenant, optionally performing a soft delete.
 * @param tenantId The ID of the tenant to delete.
 * @param deletedBy The ID of the user performing the deletion.
 * @param db The database connection.
 * @param softDelete Whether to perform a soft delete.
 * @returns A promise that resolves when the tenant is deleted.
 */
export async function deleteTenant(tenantId: string, deletedBy: string, db: any, softDelete: boolean = true): Promise<void> {
    try {
        const tenantCollection = db.collection(COLLECTIONS.TENANTS);
        const userCollection = db.collection(COLLECTIONS.USERS);
        const resourceCollection = db.collection(COLLECTIONS.RESOURCES);

        const updateOperation = softDelete
            ? {
                $set: {
                    softDelete: {
                        isDeleted: true,
                        deletedBy,
                        deletedAt: new Date().toISOString(),
                    },
                    updatedAt: new Date().toISOString(),
                },
            }
            : { $set: { deletedAt: new Date().toISOString() } };

        await userCollection.updateMany({ tenantId }, updateOperation);
        await resourceCollection.updateMany({ tenantId }, updateOperation);

        if (softDelete) {
            await tenantCollection.updateOne({ _id: tenantId }, updateOperation);
        } else {
            await tenantCollection.deleteOne({ _id: tenantId });
        }
    } catch (error) {
        console.error("Error deleting tenant:", error);
        throw new DatabaseError("Failed to delete tenant");
    }
}

/**
 * Deletes a user, optionally performing a soft delete.
 * @param userId The ID of the user to delete.
 * @param deletedBy The ID of the user performing the deletion.
 * @param db The database connection.
 * @param softDelete Whether to perform a soft delete.
 * @returns A promise that resolves when the user is deleted.
 */

export async function deleteUser(userId: string, deletedBy: string, db: any, softDelete: boolean = true): Promise<void> {
    try {
        const userCollection = db.collection(COLLECTIONS.USERS);
        const resourceCollection = db.collection(COLLECTIONS.RESOURCES);

        const updateOperation = softDelete
            ? {
                $set: {
                    softDelete: {
                        isDeleted: true,
                        deletedBy,
                        deletedAt: new Date().toISOString(),
                    },
                    updatedAt: new Date().toISOString(),
                },
            }
            : { $set: { deletedAt: new Date().toISOString() } };

        await userCollection.updateOne({ _id: userId }, updateOperation);
        await resourceCollection.updateMany({ userId }, updateOperation);
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new DatabaseError("Failed to delete user");
  } 
}

/**
 * Deletes a resource, optionally performing a soft delete.
 * @param resourceId The ID of the resource to delete.
 * @param deletedBy The ID of the user performing the deletion.
 * @param db The database connection.
 * @param softDelete Whether to perform a soft delete.
 * @returns A promise that resolves when the resource is deleted.
 */

export async function deleteResource(resourceId: string, deletedBy: string, db: any, softDelete: boolean = true): Promise<void> {
    try {
        const resourceCollection = db.collection(COLLECTIONS.RESOURCES);

        const updateOperation = softDelete
            ? {
                $set: {
                    softDelete: {
                        isDeleted: true,
                        deletedBy,
                        deletedAt: new Date().toISOString(),
                    },
                    updatedAt: new Date().toISOString(),
                },
            }
            : { $set: { deletedAt: new Date().toISOString() } };

        await resourceCollection.updateOne({ _id: resourceId }, updateOperation);
    } catch (error) {
        console.error("Error deleting resource:", error);
        throw new DatabaseError("Failed to delete resource");
  } 
}



/**
 * Formats a date to the specified tenant's timezone.
 * @param date The date to format.
 * @param timeZone The tenant's timezone.
 * @returns The formatted date string.
 */
export function formatToTenantTimeZone(date: string, timeZone: string): string {
    return moment.utc(date).tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
}



/**
 * Transfers ownership of a tenant to a new owner.
 * @param tenant The tenant to transfer ownership of.
 * @param newOwnerId The ID of the new owner.
 * @returns The updated tenant object.
 */
export function transferTenantOwnership(tenant: Tenant, newOwnerId: string): Tenant {
    tenant.ownerId = newOwnerId;
    tenant.updatedAt = new Date().toISOString();
    return tenant;
}



/**
 * Migrates data in the database, such as adding new fields to collections.
 * @param db The database connection.
 * @returns A promise that resolves when the migration is complete.
 */
export async function migrateData(db: any): Promise<void> {
    try {
        const userCollection = db.collection(COLLECTIONS.USERS);
        // Example migration: Add a new field to all users
        await userCollection.updateMany({}, { $set: { newField: 'defaultValue' } });
    } catch (error) {
        console.error("Error during data migration:", error);
        throw new DatabaseError("Failed to migrate data");
    }
}

/**
 * Logs the distribution of shards across the users collection.
 * @param db The database connection.
 */
export async function monitorShardDistribution(db: any): Promise<void> {
    try {
        const collection = db.collection(COLLECTIONS.USERS);
        const shardStats = await collection.aggregate([{ $group: { _id: "$partitionKey", count: { $sum: 1 } } }]).toArray();
        console.log(shardStats);
    } catch (error) {
        console.error("Error monitoring shard distribution:", error);
        throw new DatabaseError("Failed to monitor shard distribution");
    }
}


 // Add this to your user creation logic
 const sharedAzureResourceId = process.env.SHARED_AZURE_RESOURCE_ID;
 if (!sharedAzureResourceId) {
   throw new Error('Shared Azure Resource ID not found');
 }
