import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EventStaffGuard } from '../auth/guards/event-staff.guard';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: TicketsService;

  const mockTicketsService = {
    validateTicket: jest.fn(),
    getUserTickets: jest.fn(),
    getTicketByQRCode: jest.fn(),
    getValidationStats: jest.fn(),
    getStaffValidations: jest.fn(),
    getStaffEvents: jest.fn(),
    generateTicketPDF: jest.fn(),
  };

  const mockUser = { id: 'user-1', email: 'test@test.com', role: 'CLIENT' } as any;

  const mockTicket = {
    id: 'ticket-1',
    qrCode: 'TICKET-ABC123-123456',
    validatedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [{ provide: TicketsService, useValue: mockTicketsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(EventStaffGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get<TicketsService>(TicketsService);
    jest.clearAllMocks();
  });

  describe('validateTicket', () => {
    it('should validate ticket', async () => {
      const validationResult = { valid: true, ticket: mockTicket };
      mockTicketsService.validateTicket.mockResolvedValue(validationResult);
      const result = await controller.validateTicket({ qrCode: 'TICKET-ABC123-123456' }, mockUser);
      expect(result).toEqual(validationResult);
      expect(service.validateTicket).toHaveBeenCalledWith('TICKET-ABC123-123456', mockUser.id);
    });
  });

  describe('getValidationStats', () => {
    it('should return validation stats', async () => {
      const stats = { total: 10, validated: 5 };
      mockTicketsService.getValidationStats.mockResolvedValue(stats);
      const result = await controller.getValidationStats('event-1', mockUser);
      expect(result).toEqual(stats);
      expect(service.getValidationStats).toHaveBeenCalledWith('event-1', mockUser.id);
    });
  });

  describe('getValidations', () => {
    it('should return staff validations with event filter', async () => {
      const validations = [{ id: 'v-1' }];
      mockTicketsService.getStaffValidations.mockResolvedValue(validations);
      const result = await controller.getValidations(mockUser, 'event-1');
      expect(result).toEqual(validations);
      expect(service.getStaffValidations).toHaveBeenCalledWith(mockUser.id, 'event-1');
    });

    it('should return all staff validations without event filter', async () => {
      mockTicketsService.getStaffValidations.mockResolvedValue([]);
      await controller.getValidations(mockUser);
      expect(service.getStaffValidations).toHaveBeenCalledWith(mockUser.id, undefined);
    });
  });

  describe('getStaffEvents', () => {
    it('should return staff events', async () => {
      const events = [{ id: 'event-1' }];
      mockTicketsService.getStaffEvents.mockResolvedValue(events);
      const result = await controller.getStaffEvents(mockUser);
      expect(result).toEqual(events);
      expect(service.getStaffEvents).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getMyTickets', () => {
    it('should return user tickets', async () => {
      mockTicketsService.getUserTickets.mockResolvedValue([mockTicket]);
      const result = await controller.getMyTickets(mockUser);
      expect(result).toEqual([mockTicket]);
      expect(service.getUserTickets).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getTicketByQRCode', () => {
    it('should return ticket by QR code', async () => {
      mockTicketsService.getTicketByQRCode.mockResolvedValue(mockTicket);
      const result = await controller.getTicketByQRCode('TICKET-ABC123-123456');
      expect(result).toEqual(mockTicket);
      expect(service.getTicketByQRCode).toHaveBeenCalledWith('TICKET-ABC123-123456');
    });
  });

  describe('downloadTicket', () => {
    it('should set headers and send PDF buffer', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');
      mockTicketsService.generateTicketPDF.mockResolvedValue(pdfBuffer);

      const mockRes = { set: jest.fn(), send: jest.fn() };
      await controller.downloadTicket('ticket-1', mockUser, mockRes as any);

      expect(service.generateTicketPDF).toHaveBeenCalledWith('ticket-1', mockUser.id);
      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=ticket-ticket-1.pdf',
        'Content-Length': pdfBuffer.length,
      });
      expect(mockRes.send).toHaveBeenCalledWith(pdfBuffer);
    });
  });
});
