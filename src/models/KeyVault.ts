// src/models/KeyVault.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IKeyVault extends Document {
  userId: string;
  serviceName: string;
  apiKey: string;
  updatedAt: Date;
}

const KeyVaultSchema = new Schema<IKeyVault>({
  userId: { type: String, required: true },
  serviceName: { type: String, required: true },
  apiKey: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export const KeyVault = mongoose.model<IKeyVault>('KeyVault', KeyVaultSchema);
