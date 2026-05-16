import {
  IsString,
  IsUppercase,
  MinLength,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsInt,
  IsDateString,
  Max,
  ValidateIf,
} from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreatePromoCodeDto {
  @IsString()
  @IsUppercase()
  @MinLength(3)
  @MaxLength(20)
  code: string;

  @IsString()
  eventId: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @Min(1)
  @ValidateIf((o) => o.discountType === DiscountType.PERCENTAGE)
  @Max(100)
  discountValue: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
