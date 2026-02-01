import { IsUUID, IsInt, Min, Max } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  ticketCategoryId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  quantity: number;
}
