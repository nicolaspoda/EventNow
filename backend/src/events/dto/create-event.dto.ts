import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTicketCategoryDto } from './create-ticket-category.dto';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsDateString()
  event_date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTicketCategoryDto)
  @ArrayMinSize(1)
  ticket_categories: CreateTicketCategoryDto[];
}
