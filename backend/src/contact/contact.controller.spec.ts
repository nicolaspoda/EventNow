import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { MailService } from '../mail/mail.service';
import { ContactDto } from './dto/contact.dto';

describe('ContactController', () => {
  let controller: ContactController;

  const mockMailService = {
    sendContactMessage: jest.fn(),
  };

  const dto: ContactDto = {
    name: 'Jean Dupont',
    email: 'jean@test.com',
    subject: 'Question sur un événement',
    message: 'Bonjour, je voulais savoir si les billets étaient remboursables.',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [{ provide: MailService, useValue: mockMailService }],
    }).compile();

    controller = module.get<ContactController>(ContactController);
    jest.clearAllMocks();
  });

  it('should send the contact message and return a confirmation', async () => {
    mockMailService.sendContactMessage.mockResolvedValue(undefined);

    const result = await controller.sendContactMessage(dto);

    expect(mockMailService.sendContactMessage).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'Votre message a bien été envoyé.' });
  });

  it('should throw InternalServerErrorException when the mail service fails', async () => {
    mockMailService.sendContactMessage.mockRejectedValue(
      new Error('SMTP error'),
    );

    await expect(controller.sendContactMessage(dto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
