import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import sanitizeHtml from 'sanitize-html';

describe('Security Measures', () => {
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'ENCRYPTION_KEY') {
          return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        }
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  it('should sanitize XSS attempts', () => {
    const xssInput = '<script>alert("XSS")</script>';
    const sanitized = sanitizeHtml(xssInput, {
      allowedTags: [],
      allowedAttributes: {},
    });
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toBe('');
  });

  it('should encrypt sensitive data', () => {
    const plaintext = 'sensitive-data';
    const encrypted = encryptionService.encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toContain(':');

    const decrypted = encryptionService.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should hash passwords securely', async () => {
    const password = 'MySecurePassword123!';
    const hashed = await encryptionService.hash(password);

    expect(hashed).not.toBe(password);
    expect(hashed).toContain(':');

    const isValid = await encryptionService.verifyHash(password, hashed);
    expect(isValid).toBe(true);

    const isInvalid = await encryptionService.verifyHash(
      'WrongPassword',
      hashed,
    );
    expect(isInvalid).toBe(false);
  });

  it('should throw error if encryption key is invalid', () => {
    const mockConfigService = {
      get: jest.fn(() => 'invalid-key'),
    };

    expect(() => {
      new EncryptionService(mockConfigService as any);
    }).toThrow('ENCRYPTION_KEY must be 64 hex characters');
  });

  it('should produce different encrypted outputs for same input', () => {
    const plaintext = 'test-data';
    const encrypted1 = encryptionService.encrypt(plaintext);
    const encrypted2 = encryptionService.encrypt(plaintext);

    expect(encrypted1).not.toBe(encrypted2);

    expect(encryptionService.decrypt(encrypted1)).toBe(plaintext);
    expect(encryptionService.decrypt(encrypted2)).toBe(plaintext);
  });
});
