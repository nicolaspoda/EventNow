import { IsString, IsNumber, Min } from 'class-validator';

export class ValidatePromoCodeDto {
  @IsString()
  code: string;

  @IsString()
  eventId: string;

  @IsNumber()
  @Min(0)
  orderAmount: number;
}
