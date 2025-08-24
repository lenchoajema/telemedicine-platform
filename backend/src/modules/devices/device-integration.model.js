import mongoose from 'mongoose';
import crypto from 'crypto';
import { Buffer } from 'buffer';

// Basic encryption for tokens - replace with a robust solution like Vault in production
const algorithm = 'aes-256-cbc';
// Derive a proper 32-byte key from the provided secret to avoid invalid key length errors
const rawSecret = process.env.DEVICE_TOKEN_SECRET || 'dev-secret-please-change';
const derivedKey = crypto.createHash('sha256').update(String(rawSecret)).digest(); // 32 bytes

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16); // fresh IV per encryption
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
  let encrypted = cipher.update(typeof text === 'string' ? text : String(text));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

const decrypt = (hash) => {
  if (!hash || !hash.iv || !hash.encryptedData) return null;
  const decipher = crypto.createDecipheriv(algorithm, derivedKey, Buffer.from(hash.iv, 'hex'));
  let decrypted = decipher.update(Buffer.from(hash.encryptedData, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};


const DeviceIntegrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['AppleHealth', 'GoogleFit', 'Fitbit'], required: true },
  accessToken: {
    iv: String,
    encryptedData: String,
  },
  refreshToken: {
    iv: String,
    encryptedData: String,
  },
  scopes: [String],
  connectedAt: { type: Date, default: Date.now },
  lastSyncAt: { type: Date },
  status: { type: String, enum: ['Active', 'Revoked', 'Error'], default: 'Active' },
}, { timestamps: true });

// Encrypt tokens before saving
DeviceIntegrationSchema.pre('save', function(next) {
  if (this.isModified('accessToken') && typeof this.accessToken === 'string' && this.accessToken) {
    this.accessToken = encrypt(this.accessToken);
  }
  if (this.isModified('refreshToken') && typeof this.refreshToken === 'string' && this.refreshToken) {
    this.refreshToken = encrypt(this.refreshToken);
  }
  next();
});

// Add a method to decrypt tokens when needed
DeviceIntegrationSchema.methods.getAccessToken = function() {
  return decrypt(this.accessToken);
};

DeviceIntegrationSchema.methods.getRefreshToken = function() {
  return decrypt(this.refreshToken);
};


export default mongoose.model('DeviceIntegration', DeviceIntegrationSchema);
