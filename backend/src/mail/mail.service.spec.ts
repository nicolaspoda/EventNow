import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from '../logger/logger.service';

describe('MailService', () => {
  let service: MailService;

  const mockMailerService = { sendMail: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue('http://localhost:3000') };
  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mockMailerService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    jest.clearAllMocks();
  });

  describe('sendOrderConfirmation', () => {
    const orderData = {
      userEmail: 'user@test.com',
      userName: 'User',
      orderId: 'order-1',
      totalAmount: 50,
      tickets: [{ eventTitle: 'Concert', eventDate: '2026-01-01', category: 'VIP', quantity: 1 }],
    };

    it('should send order confirmation email', async () => {
      mockMailerService.sendMail.mockResolvedValue({});
      await service.sendOrderConfirmation(orderData);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          template: 'order-confirmation',
        }),
      );
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should log error and not throw when mailer fails', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));
      await expect(service.sendOrderConfirmation(orderData)).resolves.toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('sendEventReminder7Days', () => {
    const reminderData = {
      userEmail: 'user@test.com',
      userName: 'User',
      eventTitle: 'Concert',
      eventDate: '2026-01-01',
      eventLocation: 'Paris',
      ticketsCount: 2,
      orderId: 'order-1',
    };

    it('should send 7-day reminder email', async () => {
      mockMailerService.sendMail.mockResolvedValue({});
      await service.sendEventReminder7Days(reminderData);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          template: 'event-reminder-7days',
        }),
      );
    });

    it('should handle send failure gracefully', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP fail'));
      await expect(service.sendEventReminder7Days(reminderData)).resolves.toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('sendEventReminder1Day', () => {
    const reminderData = {
      userEmail: 'user@test.com',
      userName: 'User',
      eventTitle: 'Concert',
      eventDate: '2026-01-01',
      eventLocation: 'Paris',
      ticketsCount: 1,
      orderId: 'order-1',
    };

    it('should send 1-day reminder email', async () => {
      mockMailerService.sendMail.mockResolvedValue({});
      await service.sendEventReminder1Day(reminderData);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'event-reminder-1day' }),
      );
    });

    it('should handle send failure gracefully', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP fail'));
      await expect(service.sendEventReminder1Day(reminderData)).resolves.toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('sendEventCancellation', () => {
    const cancellationData = {
      userEmail: 'user@test.com',
      userName: 'User',
      eventTitle: 'Concert',
      eventDate: '2026-01-01',
      refundAmount: 50,
      cancelReason: 'Force majeure',
    };

    it('should send event cancellation email with refundAmount', async () => {
      mockMailerService.sendMail.mockResolvedValue({});
      await service.sendEventCancellation(cancellationData);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'event-cancelled' }),
      );
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should send cancellation without refundAmount', async () => {
      mockMailerService.sendMail.mockResolvedValue({});
      await service.sendEventCancellation({
        ...cancellationData,
        refundAmount: undefined,
      });
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({ refundAmount: null }),
        }),
      );
    });

    it('should handle send failure gracefully', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP fail'));
      await expect(service.sendEventCancellation(cancellationData)).resolves.toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('sendTestEmail', () => {
    it('should send test email', async () => {
      mockMailerService.sendMail.mockResolvedValue({});
      await service.sendTestEmail('test@test.com');
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'test@test.com' }),
      );
    });

    it('should throw when test email fails', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP fail'));
      await expect(service.sendTestEmail('test@test.com')).rejects.toThrow('SMTP fail');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
