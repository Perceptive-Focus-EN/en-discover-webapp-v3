// src/services/keyVaultService.ts
import { KeyVault } from '../models/KeyVault';

export class KeyVaultService {
  static async storeApiKey(userId: string, serviceName: string, apiKey: string): Promise<void> {
    await KeyVault.findOneAndUpdate(
      { userId, serviceName },
      { apiKey, updatedAt: new Date() },
      { upsert: true }
    );
  }

  static async getApiKey(userId: string, serviceName: string): Promise<string | null> {
    const keyVault = await KeyVault.findOne({ userId, serviceName });
    return keyVault ? keyVault.apiKey : null;
  }

  static async deleteApiKey(userId: string, serviceName: string): Promise<void> {
    await KeyVault.deleteOne({ userId, serviceName });
  }
}
