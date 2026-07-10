import { Test, TestingModule } from '@nestjs/testing';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { BadRequestException } from '@nestjs/common';

describe('MailController', () => {
  let controller: MailController;

  const mockMailService = {
    sendTestEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [{ provide: MailService, useValue: mockMailService }],
    }).compile();

    controller = module.get<MailController>(MailController);
    jest.clearAllMocks();
  });

  it('should throw BadRequestException if no email provided', async () => {
    await expect(controller.sendTestEmail('')).rejects.toThrow(BadRequestException);
  });

  it('should send test email successfully', async () => {
    mockMailService.sendTestEmail.mockResolvedValue({});
    const result = await controller.sendTestEmail('test@example.com');
    expect(result).toEqual({ message: 'Email de test envoyé avec succès' });
    expect(mockMailService.sendTestEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('should throw BadRequestException on mail service error', async () => {
    mockMailService.sendTestEmail.mockRejectedValue(new Error('SMTP error'));
    await expect(controller.sendTestEmail('test@example.com')).rejects.toThrow(BadRequestException);
  });

  it('should handle non-Error thrown by mail service', async () => {
    mockMailService.sendTestEmail.mockRejectedValue('string error');
    await expect(controller.sendTestEmail('test@example.com')).rejects.toThrow(BadRequestException);
  });
});
