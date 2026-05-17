import { Test, TestingModule } from '@nestjs/testing';
import { PromoCodesController } from './promo-codes.controller';
import { PromoCodesService } from './promo-codes.service';
import { DiscountType } from '@prisma/client';

describe('PromoCodesController', () => {
  let controller: PromoCodesController;

  const mockPromoCodesService = {
    createPromoCode: jest.fn(),
    validatePromoCode: jest.fn(),
    getEventPromoCodes: jest.fn(),
    deletePromoCode: jest.fn(),
  };

  const mockUser = { id: 'user-1', email: 'test@test.com', role: 'ORGANIZER' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromoCodesController],
      providers: [
        { provide: PromoCodesService, useValue: mockPromoCodesService },
      ],
    }).compile();

    controller = module.get<PromoCodesController>(PromoCodesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createPromoCode delegates to service', async () => {
    const dto = {
      code: 'PROMO10',
      eventId: 'event-1',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
    };
    mockPromoCodesService.createPromoCode.mockResolvedValue({
      id: 'promo-1',
      ...dto,
    });

    const result = await controller.createPromoCode(dto, mockUser as any);

    expect(mockPromoCodesService.createPromoCode).toHaveBeenCalledWith(
      'user-1',
      dto,
    );
    expect(result).toMatchObject({ id: 'promo-1' });
  });

  it('validatePromoCode delegates to service', async () => {
    const dto = { code: 'PROMO10', eventId: 'event-1', orderAmount: 100 };
    mockPromoCodesService.validatePromoCode.mockResolvedValue({
      promoCode: { id: 'promo-1' },
      discountAmount: 10,
      finalAmount: 90,
    });

    const result = await controller.validatePromoCode(dto);

    expect(mockPromoCodesService.validatePromoCode).toHaveBeenCalledWith(dto);
    expect(result).toMatchObject({ discountAmount: 10, finalAmount: 90 });
  });

  it('getEventPromoCodes delegates to service', async () => {
    mockPromoCodesService.getEventPromoCodes.mockResolvedValue([]);

    await controller.getEventPromoCodes('event-1', mockUser as any);

    expect(mockPromoCodesService.getEventPromoCodes).toHaveBeenCalledWith(
      'user-1',
      'event-1',
    );
  });

  it('deletePromoCode delegates to service', async () => {
    mockPromoCodesService.deletePromoCode.mockResolvedValue({
      isActive: false,
    });

    await controller.deletePromoCode('promo-1', mockUser as any);

    expect(mockPromoCodesService.deletePromoCode).toHaveBeenCalledWith(
      'user-1',
      'promo-1',
    );
  });
});
