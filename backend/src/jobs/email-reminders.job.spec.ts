import { Test, TestingModule } from '@nestjs/testing';
import { EmailRemindersJob } from './email-reminders.job';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('EmailRemindersJob', () => {
  let job: EmailRemindersJob;

  const mockPrismaService = {
    order: { findMany: jest.fn() },
  };
  const mockMailService = {
    sendEventReminder7Days: jest.fn(),
    sendEventReminder1Day: jest.fn(),
  };
  const mockNotificationsService = {
    create: jest.fn(),
  };

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);
  const startOfDay = new Date(sevenDaysFromNow.setHours(0, 0, 0, 0));

  const mockEvent = {
    id: 'event-1',
    title: 'Test Concert',
    location: 'Paris',
    eventDate: new Date(startOfDay.getTime() + 3600000),
  };

  const mockOrder = {
    id: 'order-1',
    user: { id: 'user-1', email: 'user@test.com', username: 'user1' },
    tickets: [{
      ticketCategory: { event: mockEvent },
    }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailRemindersJob,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: mockMailService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    job = module.get<EmailRemindersJob>(EmailRemindersJob);
    jest.clearAllMocks();
  });

  describe('sendReminders7Days', () => {
    it('should send 7-day reminders for matching orders', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);
      mockMailService.sendEventReminder7Days.mockResolvedValue({});
      mockNotificationsService.create.mockResolvedValue({});

      await job.sendReminders7Days();

      expect(mockMailService.sendEventReminder7Days).toHaveBeenCalled();
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'EVENT_REMINDER_7_DAYS' }),
      );
    });

    it('should skip tickets with event outside the day window', async () => {
      const outsideEvent = { ...mockEvent, eventDate: new Date(0) };
      const orderWithOutsideEvent = {
        ...mockOrder,
        tickets: [{ ticketCategory: { event: outsideEvent } }],
      };
      mockPrismaService.order.findMany.mockResolvedValue([orderWithOutsideEvent]);

      await job.sendReminders7Days();
      expect(mockMailService.sendEventReminder7Days).not.toHaveBeenCalled();
    });

    it('should use email split as username fallback', async () => {
      const orderNoUsername = {
        ...mockOrder,
        user: { ...mockOrder.user, username: null, email: 'user@test.com' },
      };
      mockPrismaService.order.findMany.mockResolvedValue([orderNoUsername]);
      mockMailService.sendEventReminder7Days.mockResolvedValue({});
      mockNotificationsService.create.mockResolvedValue({});

      await job.sendReminders7Days();
      expect(mockMailService.sendEventReminder7Days).toHaveBeenCalledWith(
        expect.objectContaining({ userName: 'user' }),
      );
    });

    it('should handle mail send errors gracefully', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);
      mockMailService.sendEventReminder7Days.mockRejectedValue(new Error('SMTP fail'));

      await expect(job.sendReminders7Days()).resolves.toBeUndefined();
    });

    it('should return without sending for empty orders', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      await job.sendReminders7Days();
      expect(mockMailService.sendEventReminder7Days).not.toHaveBeenCalled();
    });

    it('should aggregate tickets per event for same order', async () => {
      const orderWithMultipleTickets = {
        ...mockOrder,
        tickets: [
          { ticketCategory: { event: mockEvent } },
          { ticketCategory: { event: mockEvent } },
        ],
      };
      mockPrismaService.order.findMany.mockResolvedValue([orderWithMultipleTickets]);
      mockMailService.sendEventReminder7Days.mockResolvedValue({});
      mockNotificationsService.create.mockResolvedValue({});

      await job.sendReminders7Days();
      expect(mockMailService.sendEventReminder7Days).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendEventReminder7Days).toHaveBeenCalledWith(
        expect.objectContaining({ ticketsCount: 2 }),
      );
    });
  });

  describe('sendReminders1Day', () => {
    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));

    const tomorrowEvent = {
      id: 'event-2',
      title: 'Tomorrow Concert',
      location: 'Lyon',
      eventDate: new Date(tomorrowStart.getTime() + 3600000),
    };

    const tomorrowOrder = {
      id: 'order-2',
      user: { id: 'user-2', email: 'user2@test.com', username: 'user2' },
      tickets: [{
        ticketCategory: { event: tomorrowEvent },
      }],
    };

    it('should send 1-day reminders for matching orders', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([tomorrowOrder]);
      mockMailService.sendEventReminder1Day.mockResolvedValue({});
      mockNotificationsService.create.mockResolvedValue({});

      await job.sendReminders1Day();

      expect(mockMailService.sendEventReminder1Day).toHaveBeenCalled();
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'EVENT_REMINDER_1_DAY' }),
      );
    });

    it('should skip orders with events outside tomorrow window', async () => {
      const outsideEvent = { ...tomorrowEvent, eventDate: new Date(0) };
      const outsideOrder = {
        ...tomorrowOrder,
        tickets: [{ ticketCategory: { event: outsideEvent } }],
      };
      mockPrismaService.order.findMany.mockResolvedValue([outsideOrder]);

      await job.sendReminders1Day();
      expect(mockMailService.sendEventReminder1Day).not.toHaveBeenCalled();
    });

    it('should use email split as username fallback', async () => {
      const orderNoUsername = {
        ...tomorrowOrder,
        user: { ...tomorrowOrder.user, username: null, email: 'user2@test.com' },
      };
      mockPrismaService.order.findMany.mockResolvedValue([orderNoUsername]);
      mockMailService.sendEventReminder1Day.mockResolvedValue({});
      mockNotificationsService.create.mockResolvedValue({});

      await job.sendReminders1Day();
      expect(mockMailService.sendEventReminder1Day).toHaveBeenCalledWith(
        expect.objectContaining({ userName: 'user2' }),
      );
    });

    it('should handle mail send errors gracefully', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([tomorrowOrder]);
      mockMailService.sendEventReminder1Day.mockRejectedValue(new Error('SMTP fail'));

      await expect(job.sendReminders1Day()).resolves.toBeUndefined();
    });
  });
});
