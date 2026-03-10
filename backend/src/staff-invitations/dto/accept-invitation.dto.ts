import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptStaffInvitationDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
