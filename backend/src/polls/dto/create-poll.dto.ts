import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class CreatePollDto {
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  question: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(100, { each: true })
  options: string[];

  @IsOptional()
  @IsBoolean()
  multipleChoice?: boolean;

  @IsOptional()
  @IsDateString()
  closesAt?: string;
}
