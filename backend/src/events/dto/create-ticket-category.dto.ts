import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTicketCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0.5)
  price: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  initial_stock: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  current_stock?: number;
}
