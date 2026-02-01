import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateTicketDto {
  @IsString()
  @IsNotEmpty()
  qrCode: string;
}
