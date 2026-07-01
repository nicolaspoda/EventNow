import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { AuthService } from '../auth.service';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateGoogleUser: jest.fn(),
  };

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    delete process.env.GOOGLE_CALLBACK_URL;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use GOOGLE_CALLBACK_URL when set', async () => {
      process.env.GOOGLE_CALLBACK_URL = 'http://custom/callback';
      const module = await Test.createTestingModule({
        providers: [
          GoogleStrategy,
          { provide: AuthService, useValue: mockAuthService },
        ],
      }).compile();
      const s = module.get<GoogleStrategy>(GoogleStrategy);
      expect(s).toBeDefined();
    });

    it('should use default callback when GOOGLE_CALLBACK_URL unset', async () => {
      delete process.env.GOOGLE_CALLBACK_URL;
      const module = await Test.createTestingModule({
        providers: [
          GoogleStrategy,
          { provide: AuthService, useValue: mockAuthService },
        ],
      }).compile();
      const s = module.get<GoogleStrategy>(GoogleStrategy);
      expect(s).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should validate Google user and call done with user', async () => {
      const mockProfile = {
        id: 'google-123',
        emails: [{ value: 'test@gmail.com' }],
        name: {
          givenName: 'John',
          familyName: 'Doe',
        },
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@gmail.com',
        role: 'USER',
      };

      mockAuthService.validateGoogleUser.mockResolvedValue(mockUser);

      const done = jest.fn();

      await strategy.validate(
        'access-token',
        'refresh-token',
        mockProfile,
        done,
      );

      expect(authService.validateGoogleUser).toHaveBeenCalledWith({
        googleId: 'google-123',
        email: 'test@gmail.com',
      });
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should handle profile without name', async () => {
      const mockProfile = {
        id: 'google-456',
        emails: [{ value: 'test2@gmail.com' }],
        name: {
          givenName: undefined,
          familyName: undefined,
        },
      };

      const mockUser = {
        id: 'user-456',
        email: 'test2@gmail.com',
        role: 'USER',
      };

      mockAuthService.validateGoogleUser.mockResolvedValue(mockUser);

      const done = jest.fn();

      await strategy.validate('token', 'refresh', mockProfile, done);

      expect(authService.validateGoogleUser).toHaveBeenCalledWith({
        googleId: 'google-456',
        email: 'test2@gmail.com',
      });
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });
  });
});
