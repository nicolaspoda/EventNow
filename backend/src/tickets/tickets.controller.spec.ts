import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: TicketsService;

  const mockTicketsService = {
    validateTicket: jest.fn(),
    getUserTickets: jest.fn(),
    getTicketByQRCode: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    role: 'CLIENT',
  };

  const mockTicket = {
    id: 'ticket-1',
    qrCode: 'TICKET-ABC123-123456',
    validatedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get<TicketsService>(TicketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTicket', () => {
    it('should validate ticket', async () => {
      const validationResult = { valid: true, ticket: mockTicket };
      mockTicketsService.validateTicket.mockResolvedValue(validationResult);

      const result = await controller.validateTicket(
        { qrCode: 'TICKET-ABC123-123456' },
        mockUser,
      );

      expect(result).toEqual(validationResult);
      expect(service.validateTicket).toHaveBeenCalledWith(
        'TICKET-ABC123-123456',
        mockUser.id,
      );
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
      expect(service.getTicketByQRCode).toHaveBeenCalledWith(
        'TICKET-ABC123-123456',
      );
    });
  });
});
