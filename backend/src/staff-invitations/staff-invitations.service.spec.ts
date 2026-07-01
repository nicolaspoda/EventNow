import { Test, TestingModule } from '@nestjs/testing';
import { StaffInvitationsService } from './staff-invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from '../auth/auth.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { CustomLoggerService } from '../logger/logger.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventType } from '@prisma/client';

describe('StaffInvitationsService', () => {
  let service: StaffInvitationsService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    event: { findUnique: jest.fn() },
    eventStaff: { findUnique: jest.fn(), create: jest.fn() },
    staffInvitation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
    deleteByTypeAndRelatedId: jest.fn(),
  };

  const mockAuthService = {
    generateTokens: jest.fn(),
  };

  const mockMessagesGateway = {
    emitNewNotificationToUser: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockOrganizerUser = { id: 'org-1', role: 'ORGANIZER', email: 'org@test.com', username: 'org' };
  const mockExistingUser = { id: 'user-1', email: 'invited@test.com', username: 'invited' };

  const mockProEvent = {
    id: 'event-1',
    type: EventType.PROFESSIONAL,
    organizerId: 'org-1',
    title: 'Pro Event',
  };

  const mockInvitation = {
    id: 'inv-1',
    token: 'token-abc',
    email: 'invited@test.com',
    eventId: 'event-1',
    invitedById: 'org-1',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 86400000),
    event: { id: 'event-1', title: 'Pro Event', eventDate: new Date() },
    invitedBy: { id: 'org-1', username: 'org', email: 'org@test.com' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffInvitationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MessagesGateway, useValue: mockMessagesGateway },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<StaffInvitationsService>(StaffInvitationsService);
    jest.resetAllMocks();
  });

  describe('createInvitation', () => {
    it('should throw BadRequestException if inviter is not ORGANIZER', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockOrganizerUser, role: 'USER' });
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'test@test.com' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if inviter user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'test@test.com' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if event not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockOrganizerUser);
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'test@test.com' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if not organizer of event', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockOrganizerUser);
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockProEvent, organizerId: 'other-org' });
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'test@test.com' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if event is not PROFESSIONAL', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockOrganizerUser);
      mockPrismaService.event.findUnique.mockResolvedValue({ ...mockProEvent, type: EventType.COMMUNITY });
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'test@test.com' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invited user not found', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockOrganizerUser)
        .mockResolvedValueOnce(null);
      mockPrismaService.event.findUnique.mockResolvedValue(mockProEvent);
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'notfound@test.com' })).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user is already staff for event', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockOrganizerUser)
        .mockResolvedValueOnce(mockExistingUser);
      mockPrismaService.event.findUnique.mockResolvedValue(mockProEvent);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'user-1' });
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'invited@test.com' })).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if pending invitation already exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockOrganizerUser)
        .mockResolvedValueOnce(mockExistingUser);
      mockPrismaService.event.findUnique.mockResolvedValue(mockProEvent);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      mockPrismaService.staffInvitation.findFirst.mockResolvedValue({ id: 'inv-old' });
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'invited@test.com' })).rejects.toThrow(ConflictException);
    });

    it('should create invitation and notify user', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockOrganizerUser)
        .mockResolvedValueOnce(mockExistingUser);
      mockPrismaService.event.findUnique.mockResolvedValue(mockProEvent);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      mockPrismaService.staffInvitation.findFirst.mockResolvedValue(null);
      mockPrismaService.staffInvitation.create.mockResolvedValue(mockInvitation);
      mockNotificationsService.create.mockResolvedValue({});
      const result = await service.createInvitation('org-1', { eventId: 'event-1', email: 'invited@test.com' });
      expect(mockPrismaService.staffInvitation.create).toHaveBeenCalled();
      expect(mockNotificationsService.create).toHaveBeenCalled();
      expect(mockMessagesGateway.emitNewNotificationToUser).toHaveBeenCalledWith('user-1');
    });

    it('should use invitedBy email as fallback in notification body', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockOrganizerUser)
        .mockResolvedValueOnce(mockExistingUser);
      mockPrismaService.event.findUnique.mockResolvedValue(mockProEvent);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      mockPrismaService.staffInvitation.findFirst.mockResolvedValue(null);
      mockPrismaService.staffInvitation.create.mockResolvedValue({
        ...mockInvitation,
        invitedBy: { id: 'org-1', username: null, email: 'org@test.com' },
      });
      mockNotificationsService.create.mockResolvedValue({});
      await service.createInvitation('org-1', { eventId: 'event-1', email: 'invited@test.com' });
      const notifArg = mockNotificationsService.create.mock.calls[0][0];
      expect(notifArg.body).toContain('org@test.com');
    });
  });

  describe('getInvitationByToken', () => {
    it('should throw NotFoundException if invitation not found', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(null);
      await expect(service.getInvitationByToken('bad-token')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already used', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue({ ...mockInvitation, status: 'ACCEPTED' });
      await expect(service.getInvitationByToken('token-abc')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException and update status to EXPIRED if expired', async () => {
      const expiredInv = { ...mockInvitation, expiresAt: new Date(Date.now() - 86400000) };
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(expiredInv);
      mockPrismaService.staffInvitation.update.mockResolvedValue({});
      await expect(service.getInvitationByToken('token-abc')).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.staffInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'EXPIRED' } }),
      );
    });

    it('should return valid invitation', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(mockInvitation);
      const result = await service.getInvitationByToken('token-abc');
      expect(result).toEqual(mockInvitation);
    });
  });

  describe('acceptInvitation', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.acceptInvitation('user-1', 'token-abc')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if email mismatch', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockExistingUser, email: 'other@test.com' });
      await expect(service.acceptInvitation('user-1', 'token-abc')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already staff', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockExistingUser)
        .mockResolvedValueOnce(mockExistingUser);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue({ eventId: 'event-1', userId: 'user-1' });
      await expect(service.acceptInvitation('user-1', 'token-abc')).rejects.toThrow(BadRequestException);
    });

    it('should accept invitation and return tokens', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockExistingUser)
        .mockResolvedValueOnce({ id: 'user-1', username: 'invited', email: 'invited@test.com', role: 'STAFF' });
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockResolvedValue([]);
      mockNotificationsService.deleteByTypeAndRelatedId.mockResolvedValue(1);
      mockAuthService.generateTokens.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });
      const result = await service.acceptInvitation('user-1', 'token-abc');
      expect(result.message).toContain('acceptée');
      expect(result.accessToken).toBe('at');
    });

    it('should return simple message if updated user not found', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockExistingUser)
        .mockResolvedValueOnce(null);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockResolvedValue([]);
      mockNotificationsService.deleteByTypeAndRelatedId.mockResolvedValue(1);
      const result = await service.acceptInvitation('user-1', 'token-abc');
      expect(result).toEqual({ message: 'Invitation acceptée avec succès' });
    });
  });

  describe('declineInvitation', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.declineInvitation('user-1', 'token-abc')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if email mismatch', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockExistingUser, email: 'other@test.com' });
      await expect(service.declineInvitation('user-1', 'token-abc')).rejects.toThrow(BadRequestException);
    });

    it('should decline invitation', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrismaService.user.findUnique.mockResolvedValue(mockExistingUser);
      mockPrismaService.staffInvitation.update.mockResolvedValue({});
      mockNotificationsService.deleteByTypeAndRelatedId.mockResolvedValue(1);
      const result = await service.declineInvitation('user-1', 'token-abc');
      expect(result).toEqual({ message: 'Invitation refusée' });
      expect(mockPrismaService.staffInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'DECLINED' } }),
      );
    });
  });

  describe('getMyInvitations', () => {
    it('should return invitations for organizer', async () => {
      mockPrismaService.staffInvitation.findMany.mockResolvedValue([mockInvitation]);
      const result = await service.getMyInvitations('org-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getPendingInvitationsForEmail', () => {
    it('should return pending invitations for email', async () => {
      mockPrismaService.staffInvitation.findMany.mockResolvedValue([mockInvitation]);
      const result = await service.getPendingInvitationsForEmail('invited@test.com');
      expect(result).toHaveLength(1);
    });
  });

  describe('cancelInvitation', () => {
    it('should throw NotFoundException if invitation not found', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(null);
      await expect(service.cancelInvitation('org-1', 'inv-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not organizer of invitation', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue({ ...mockInvitation, invitedById: 'other-org' });
      await expect(service.cancelInvitation('org-1', 'inv-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invitation not PENDING', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue({ ...mockInvitation, status: 'ACCEPTED' });
      await expect(service.cancelInvitation('org-1', 'inv-1')).rejects.toThrow(BadRequestException);
    });

    it('should cancel invitation and notify user', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrismaService.user.findUnique.mockResolvedValue(mockExistingUser);
      mockPrismaService.staffInvitation.delete.mockResolvedValue({});
      mockNotificationsService.deleteByTypeAndRelatedId.mockResolvedValue(1);
      const result = await service.cancelInvitation('org-1', 'inv-1');
      expect(result).toEqual({ message: 'Invitation annulée' });
      expect(mockMessagesGateway.emitNewNotificationToUser).toHaveBeenCalledWith('user-1');
    });

    it('should cancel invitation without notification if user not found', async () => {
      mockPrismaService.staffInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.staffInvitation.delete.mockResolvedValue({});
      const result = await service.cancelInvitation('org-1', 'inv-1');
      expect(result).toEqual({ message: 'Invitation annulée' });
      expect(mockMessagesGateway.emitNewNotificationToUser).not.toHaveBeenCalled();
    });
  });

  describe('handlePrismaError', () => {
    it('should rethrow NestJS exceptions directly', async () => {
      mockPrismaService.user.findUnique.mockRejectedValue(new BadRequestException('test'));
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'test@test.com' })).rejects.toThrow(BadRequestException);
    });

    it('should convert P2003 to BadRequestException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockOrganizerUser);
      mockPrismaService.event.findUnique.mockResolvedValue(mockProEvent);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockOrganizerUser).mockResolvedValueOnce(mockExistingUser);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      mockPrismaService.staffInvitation.findFirst.mockResolvedValue(null);
      mockPrismaService.staffInvitation.create.mockRejectedValue({ code: 'P2003' });
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'invited@test.com' })).rejects.toThrow(BadRequestException);
    });

    it('should convert P2002 to ConflictException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockOrganizerUser).mockResolvedValueOnce(mockExistingUser);
      mockPrismaService.event.findUnique.mockResolvedValue(mockProEvent);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      mockPrismaService.staffInvitation.findFirst.mockResolvedValue(null);
      mockPrismaService.staffInvitation.create.mockRejectedValue({ code: 'P2002' });
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'invited@test.com' })).rejects.toThrow(ConflictException);
    });

    it('should convert P2021 to BadRequestException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockOrganizerUser).mockResolvedValueOnce(mockExistingUser);
      mockPrismaService.event.findUnique.mockResolvedValue(mockProEvent);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      mockPrismaService.staffInvitation.findFirst.mockResolvedValue(null);
      mockPrismaService.staffInvitation.create.mockRejectedValue({ code: 'P2021' });
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'invited@test.com' })).rejects.toThrow(BadRequestException);
    });

    it('should convert message with "Unknown arg" to BadRequestException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockOrganizerUser).mockResolvedValueOnce(mockExistingUser);
      mockPrismaService.event.findUnique.mockResolvedValue(mockProEvent);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      mockPrismaService.staffInvitation.findFirst.mockResolvedValue(null);
      mockPrismaService.staffInvitation.create.mockRejectedValue({ message: 'Unknown arg foo' });
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'invited@test.com' })).rejects.toThrow(BadRequestException);
    });

    it('should log and throw BadRequestException for unknown errors', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockOrganizerUser).mockResolvedValueOnce(mockExistingUser);
      mockPrismaService.event.findUnique.mockResolvedValue(mockProEvent);
      mockPrismaService.eventStaff.findUnique.mockResolvedValue(null);
      mockPrismaService.staffInvitation.findFirst.mockResolvedValue(null);
      mockPrismaService.staffInvitation.create.mockRejectedValue(new Error('DB error'));
      await expect(service.createInvitation('org-1', { eventId: 'event-1', email: 'invited@test.com' })).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
