import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateStaffInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
