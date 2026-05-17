import {
  IsString,
  IsOptional,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
