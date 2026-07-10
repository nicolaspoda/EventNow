import { Test, TestingModule } from '@nestjs/testing';
import { EventItemsController } from './event-items.controller';
import { EventItemsService } from './event-items.service';

describe('EventItemsController', () => {
  let controller: EventItemsController;

  const mockEventItemsService = {
    getList: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    claimItem: jest.fn(),
  };

  const mockUser = { id: 'user-1', role: 'USER' } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventItemsController],
      providers: [{ provide: EventItemsService, useValue: mockEventItemsService }],
    }).compile();

    controller = module.get<EventItemsController>(EventItemsController);
    jest.clearAllMocks();
  });

  it('should get list', () => {
    mockEventItemsService.getList.mockResolvedValue({ items: [] });
    controller.getList('event-1', mockUser);
    expect(mockEventItemsService.getList).toHaveBeenCalledWith('user-1', 'event-1');
  });

  it('should add item', () => {
    mockEventItemsService.addItem.mockResolvedValue({ id: 'item-1' });
    controller.addItem('event-1', { name: 'Wine', quantity: 2 } as any, mockUser);
    expect(mockEventItemsService.addItem).toHaveBeenCalledWith('user-1', 'event-1', { name: 'Wine', quantity: 2 });
  });

  it('should update item', () => {
    mockEventItemsService.updateItem.mockResolvedValue({ id: 'item-1' });
    controller.updateItem('event-1', 'item-1', { name: 'Updated' } as any, mockUser);
    expect(mockEventItemsService.updateItem).toHaveBeenCalledWith('user-1', 'event-1', 'item-1', { name: 'Updated' });
  });

  it('should delete item', () => {
    mockEventItemsService.deleteItem.mockResolvedValue({ items: [] });
    controller.deleteItem('event-1', 'item-1', mockUser);
    expect(mockEventItemsService.deleteItem).toHaveBeenCalledWith('user-1', 'event-1', 'item-1');
  });

  it('should claim item', () => {
    mockEventItemsService.claimItem.mockResolvedValue({ items: [] });
    controller.claimItem('event-1', 'item-1', mockUser);
    expect(mockEventItemsService.claimItem).toHaveBeenCalledWith('user-1', 'event-1', 'item-1');
  });
});
