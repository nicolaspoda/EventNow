import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateStaffInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUUID()
  @IsNotEmpty()
  eventId: string;
}
