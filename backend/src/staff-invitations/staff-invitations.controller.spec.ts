import { Test, TestingModule } from '@nestjs/testing';
import { StaffInvitationsController } from './staff-invitations.controller';
import { StaffInvitationsService } from './staff-invitations.service';

describe('StaffInvitationsController', () => {
  let controller: StaffInvitationsController;

  const mockService = {
    createInvitation: jest.fn(),
    getMyInvitations: jest.fn(),
    getPendingInvitationsForEmail: jest.fn(),
    getInvitationByToken: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
    cancelInvitation: jest.fn(),
  };

  const mockUser = { id: 'user-1', email: 'user@test.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffInvitationsController],
      providers: [{ provide: StaffInvitationsService, useValue: mockService }],
    }).compile();

    controller = module.get<StaffInvitationsController>(StaffInvitationsController);
    jest.clearAllMocks();
  });

  it('should create invitation', async () => {
    mockService.createInvitation.mockResolvedValue({ id: 'inv-1' });
    await controller.createInvitation(mockUser, { eventId: 'e-1', email: 'staff@test.com' });
    expect(mockService.createInvitation).toHaveBeenCalledWith('user-1', { eventId: 'e-1', email: 'staff@test.com' });
  });

  it('should get my invitations', async () => {
    mockService.getMyInvitations.mockResolvedValue([]);
    await controller.getMyInvitations(mockUser);
    expect(mockService.getMyInvitations).toHaveBeenCalledWith('user-1');
  });

  it('should get pending invitations', async () => {
    mockService.getPendingInvitationsForEmail.mockResolvedValue([]);
    await controller.getPendingInvitations(mockUser);
    expect(mockService.getPendingInvitationsForEmail).toHaveBeenCalledWith('user@test.com');
  });

  it('should get invitation by token', async () => {
    mockService.getInvitationByToken.mockResolvedValue({ id: 'inv-1' });
    await controller.getInvitationByToken('token-abc');
    expect(mockService.getInvitationByToken).toHaveBeenCalledWith('token-abc');
  });

  it('should accept invitation', async () => {
    mockService.acceptInvitation.mockResolvedValue({ message: 'Accepted' });
    await controller.acceptInvitation(mockUser, { token: 'token-abc' });
    expect(mockService.acceptInvitation).toHaveBeenCalledWith('user-1', 'token-abc');
  });

  it('should decline invitation', async () => {
    mockService.declineInvitation.mockResolvedValue({ message: 'Declined' });
    await controller.declineInvitation(mockUser, { token: 'token-abc' });
    expect(mockService.declineInvitation).toHaveBeenCalledWith('user-1', 'token-abc');
  });

  it('should cancel invitation', async () => {
    mockService.cancelInvitation.mockResolvedValue({ message: 'Cancelled' });
    await controller.cancelInvitation(mockUser, 'inv-1');
    expect(mockService.cancelInvitation).toHaveBeenCalledWith('user-1', 'inv-1');
  });
});
