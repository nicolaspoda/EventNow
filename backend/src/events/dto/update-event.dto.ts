import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTicketCategoryDto } from './create-ticket-category.dto';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsDateString()
  @IsOptional()
  event_date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTicketCategoryDto)
  @IsOptional()
  ticket_categories?: CreateTicketCategoryDto[];
}
