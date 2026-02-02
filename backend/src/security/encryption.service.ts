import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private secretKey: Buffer;

  constructor(private config: ConfigService) {
    const key = this.config.get('ENCRYPTION_KEY');
    if (!key || key.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters');
    }
    this.secretKey = Buffer.from(key, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.secretKey,
      iv,
    ) as crypto.Cipher & { getAuthTag(): Buffer };

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      iv,
    ) as crypto.Decipher & { setAuthTag(tag: Buffer): crypto.Decipher };
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async hash(text: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(text, salt, 100000, 64, 'sha512')
      .toString('hex');
    return `${salt}:${hash}`;
  }

  async verifyHash(text: string, hashedText: string): Promise<boolean> {
    const [salt, originalHash] = hashedText.split(':');
    const hash = crypto
      .pbkdf2Sync(text, salt, 100000, 64, 'sha512')
      .toString('hex');
    return hash === originalHash;
  }
}
