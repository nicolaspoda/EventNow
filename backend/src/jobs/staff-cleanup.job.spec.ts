import { Test, TestingModule } from '@nestjs/testing';
import { StaffCleanupJob } from './staff-cleanup.job';
import { TicketsService } from '../tickets/tickets.service';

describe('StaffCleanupJob', () => {
  let job: StaffCleanupJob;

  const mockTicketsService = {
    removeStaffForEndedEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffCleanupJob,
        { provide: TicketsService, useValue: mockTicketsService },
      ],
    }).compile();

    job = module.get<StaffCleanupJob>(StaffCleanupJob);
    jest.clearAllMocks();
  });

  describe('removeStaffForEndedEvents', () => {
    it('should call ticketsService.removeStaffForEndedEvents', async () => {
      mockTicketsService.removeStaffForEndedEvents.mockResolvedValue({});
      await job.removeStaffForEndedEvents();
      expect(mockTicketsService.removeStaffForEndedEvents).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from ticketsService', async () => {
      mockTicketsService.removeStaffForEndedEvents.mockRejectedValue(new Error('DB error'));
      await expect(job.removeStaffForEndedEvents()).rejects.toThrow('DB error');
    });
  });
});
