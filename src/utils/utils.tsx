// src/utils/utils.ts

import { MongoClient } from 'mongodb';
import moment from 'moment-timezone';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { BCRYPT_SALT_ROUNDS } from '../constants/constants';
import { COLLECTIONS } from '../constants/collections';
import { DatabaseError } from '../errors/errors';
import { SoftDeletable } from '../types/Shared/interfaces';
import { User } from '../types/User/interfaces';
import { Tenant } from "../types/Tenant/interfaces";


// Utility function to connect to the database
export async function getDatabase(connectionString: string): Promise<any> {
    try {
        const client = await MongoClient.connect(connectionString);
        return client.db();
    } catch (error) {
        console.error("Error connecting to database:", error);
        throw new DatabaseError("Failed to connect to the database");
    }
}

// Utility function to create indexes
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

// Utility function to create an audit trail entry
export async function createAuditTrail(db: any, auditTrail: any): Promise<void> {
    try {
        await db.collection(COLLECTIONS.AUDIT_TRAILS).insertOne(auditTrail);
    } catch (error) {
        console.error("Error creating audit trail:", error);
        throw new DatabaseError("Failed to create audit trail");
    }
}

// Utility function to soft delete a user
export function softDeleteUser(user: User & SoftDeletable, deletedBy: string): User {
    user.softDelete = {
        isDeleted: true,
        deletedBy,
        deletedAt: new Date().toISOString(),
    };
    user.updatedAt = new Date().toISOString();
    return user;
}

// Utility function to hash a password
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

// Utility function to verify a password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// Utility function to generate a unique user ID using UUID
export function generateUniqueUserId(): string {
    return uuidv4();
}

// Utility function to format a date to the specified tenant's timezone
export function formatToTenantTimeZone(date: string, timeZone: string): string {
    return moment.utc(date).tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
}

// Utility function to check if a tenant's resource usage is within their limit
export function checkResourceLimits(tenant: Tenant): boolean {
    return tenant.resourceUsage <= tenant.resourceLimit;
}

// Utility function to resume a user's onboarding process from where they left off
export function resumeOnboarding(onboardingStatus: any): string | null {
    if (!onboardingStatus || onboardingStatus.isOnboardingComplete) {
        return null;
    }
    const currentStep = onboardingStatus.steps[onboardingStatus.currentStepIndex];
    return currentStep.name || null;
}

// Utility function to delete a tenant with soft delete option
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

// Utility function to create user indexes in the database
export async function createUserIndexes(collection: any): Promise<void> {
    try {
        await collection.createIndex({ email: 1, tenantId: 1 }, { unique: true }); // Unique email per tenant
    } catch (error) {
        console.error("Error creating user indexes:", error);
        throw new DatabaseError("Failed to create user indexes");
    }
}

// Utility function to monitor shard distribution
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

// Utility function to migrate data in the database
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