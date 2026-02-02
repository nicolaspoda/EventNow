import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatus } from '@prisma/client';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrdersService = {
    initiatePayment: jest.fn(),
    confirmPayment: jest.fn(),
    getUserOrders: jest.fn(),
    getOrderById: jest.fn(),
    refundOrder: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    role: 'CLIENT',
  };

  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    totalAmount: 200,
    status: OrderStatus.PAID,
    tickets: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('should initiate payment', async () => {
      const paymentIntent = { paymentId: 'sim_123', amount: 200 };
      mockOrdersService.initiatePayment.mockResolvedValue(paymentIntent);

      const result = await controller.initiatePayment(
        { bookingId: 'booking-1' },
        mockUser,
      );

      expect(result).toEqual(paymentIntent);
      expect(service.initiatePayment).toHaveBeenCalledWith(
        'booking-1',
        mockUser.id,
      );
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment and create order', async () => {
      const confirmResult = { order: mockOrder, tickets: [] };
      mockOrdersService.confirmPayment.mockResolvedValue(confirmResult);

      const result = await controller.confirmPayment(
        { bookingId: 'booking-1', paymentId: 'payment-1' },
        mockUser,
      );

      expect(result).toEqual(confirmResult);
      expect(service.confirmPayment).toHaveBeenCalledWith(
        'booking-1',
        'payment-1',
        mockUser.id,
      );
    });
  });

  describe('getUserOrders', () => {
    it('should return user orders', async () => {
      mockOrdersService.getUserOrders.mockResolvedValue([mockOrder]);

      const result = await controller.getUserOrders(mockUser);

      expect(result).toEqual([mockOrder]);
      expect(service.getUserOrders).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('refundOrder', () => {
    it('should refund order', async () => {
      const refundedOrder = { ...mockOrder, status: OrderStatus.REFUNDED };
      mockOrdersService.refundOrder.mockResolvedValue(refundedOrder);

      const result = await controller.refundOrder('order-1', mockUser);

      expect(result.status).toBe(OrderStatus.REFUNDED);
      expect(service.refundOrder).toHaveBeenCalledWith('order-1', mockUser.id);
    });
  });
});
