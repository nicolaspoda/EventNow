import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTicketCategoryDto } from './create-ticket-category.dto';

export enum EventType {
  PROFESSIONAL = 'PROFESSIONAL',
  COMMUNITY = 'COMMUNITY',
  ALL = 'ALL',
}

export enum EventCategory {
  CONCERT = 'CONCERT',
  CONFERENCE = 'CONFERENCE',
  FESTIVAL = 'FESTIVAL',
  SPORT = 'SPORT',
  THEATER = 'THEATER',
  EXHIBITION = 'EXHIBITION',
  OTHER = 'OTHER',
}

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

  @IsString()
  @IsOptional()
  image_public_id?: string;

  @IsDateString()
  event_date: string;

  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @IsEnum(EventCategory)
  @IsOptional()
  category?: EventCategory;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTicketCategoryDto)
  @ArrayMinSize(1)
  ticket_categories: CreateTicketCategoryDto[];
}
