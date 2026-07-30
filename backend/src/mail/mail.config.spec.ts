import { buildMailConfig } from './mail.config';

describe('buildMailConfig', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should use default host/port and no auth when env vars are unset', () => {
    delete process.env.MAIL_HOST;
    delete process.env.MAIL_PORT;
    delete process.env.MAIL_USER;
    delete process.env.MAIL_PASSWORD;
    delete process.env.MAIL_FROM;

    const mailConfig = buildMailConfig();

    expect(mailConfig.transport).toMatchObject({
      host: 'smtp.gmail.com',
      port: 587,
      auth: undefined,
    });
    expect(mailConfig.defaults?.from).toBe('"EventNow" <noreply@eventnow.com>');
  });

  it('should use custom host/port/auth/from when env vars are set', () => {
    process.env.MAIL_HOST = 'smtp.custom.com';
    process.env.MAIL_PORT = '2525';
    process.env.MAIL_USER = 'user@custom.com';
    process.env.MAIL_PASSWORD = 'secret';
    process.env.MAIL_FROM = 'custom@eventnow.com';

    const mailConfig = buildMailConfig();

    expect(mailConfig.transport).toMatchObject({
      host: 'smtp.custom.com',
      port: 2525,
      auth: { user: 'user@custom.com', pass: 'secret' },
    });
    expect(mailConfig.defaults?.from).toBe('"EventNow" <custom@eventnow.com>');
  });
});
