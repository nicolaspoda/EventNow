import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TicketsService', () => {
  let service: TicketsService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    ticket: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockStaff = {
    id: 'staff-1',
    email: 'staff@test.com',
    role: 'STAFF',
  };

  const mockTicket = {
    id: 'ticket-1',
    orderId: 'order-1',
    ticketCategoryId: 'category-1',
    qrCode: 'TICKET-ABC123-123456',
    validatedAt: null,
    order: {
      status: 'PAID',
    },
    ticketCategory: {
      name: 'VIP',
      event: {
        id: 'event-1',
        title: 'Test Event',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTicket', () => {
    it('should validate a valid ticket', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.ticket.update.mockResolvedValue({
        ...mockTicket,
        validatedAt: new Date(),
      });

      const result = await service.validateTicket(
        'TICKET-ABC123-123456',
        'staff-1',
      );

      expect(result.valid).toBe(true);
      expect(mockPrismaService.ticket.update).toHaveBeenCalled();
    });

    it('should reject if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateTicket('TICKET-ABC123-123456', 'unknown-user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if user is not STAFF', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT',
      });

      await expect(
        service.validateTicket('TICKET-ABC123-123456', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid QR code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      const result = await service.validateTicket('INVALID-QR', 'staff-1');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('QR code invalide');
    });

    it('should reject already validated ticket', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        validatedAt: new Date(),
      });

      const result = await service.validateTicket(
        'TICKET-ABC123-123456',
        'staff-1',
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Billet déjà utilisé');
    });

    it('should reject ticket with refunded order', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        order: { status: 'REFUNDED' },
      });

      const result = await service.validateTicket(
        'TICKET-ABC123-123456',
        'staff-1',
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Commande annulée ou remboursée');
    });
  });

  describe('getUserTickets', () => {
    it('should return user tickets', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([mockTicket]);

      const result = await service.getUserTickets('user-1');

      expect(result).toEqual([mockTicket]);
      expect(mockPrismaService.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { order: { userId: 'user-1' } },
        }),
      );
    });
  });

  describe('getTicketByQRCode', () => {
    it('should return ticket by QR code', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);

      const result = await service.getTicketByQRCode('TICKET-ABC123-123456');

      expect(result).toEqual(mockTicket);
    });

    it('should throw if ticket not found', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      await expect(service.getTicketByQRCode('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
